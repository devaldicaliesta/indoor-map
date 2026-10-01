export type SaveOp<T> = { type: 'save'; value: T } | { type: 'remove' };
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveQueueOptions<T> {
  run: (id: string, op: SaveOp<T>) => Promise<void>;
  onStatus: (status: SaveStatus, error: Error | null) => void;
  delayMs?: number;
}

/**
 * Antrean simpan draft per fitur: perubahan beruntun digabung (yang terakhir
 * menang) setelah jeda `delayMs`, dan satu fitur tidak pernah punya dua penyimpanan
 * berjalan bersamaan sehingga urutan tulis di server sama dengan urutan edit.
 */
export class SaveQueue<T> {
  private readonly pending = new Map<string, SaveOp<T>>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly inFlight = new Set<string>();
  private readonly failed = new Map<string, SaveOp<T>>();
  private lastError: Error | null = null;
  private waiters: (() => void)[] = [];
  private everSaved = false;

  constructor(private readonly options: SaveQueueOptions<T>) {}

  enqueue(id: string, op: SaveOp<T>): void {
    this.pending.set(id, op);
    this.failed.delete(id);
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.set(
      id,
      setTimeout(() => this.fire(id), this.options.delayMs ?? 800),
    );
    this.emit();
  }

  /** Mengirim ulang semua penyimpanan yang gagal ("Gagal, coba lagi"). */
  retry(): void {
    for (const [id, op] of this.failed) this.pending.set(id, op);
    this.failed.clear();
    this.lastError = null;
    for (const id of [...this.pending.keys()]) this.fire(id);
  }

  /** Kirim semua yang tertunda sekarang dan tunggu sampai selesai (ganti lantai, keluar). */
  flush(): Promise<void> {
    for (const id of [...this.pending.keys()]) this.fire(id);
    if (this.isIdle()) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  hasUnsaved(): boolean {
    return !this.isIdle() || this.failed.size > 0;
  }

  private isIdle() {
    return this.pending.size === 0 && this.inFlight.size === 0;
  }

  private fire(id: string) {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    // Masih ada penyimpanan berjalan untuk fitur ini: dikirim setelah yang itu selesai.
    if (this.inFlight.has(id)) return;
    const op = this.pending.get(id);
    if (!op) return;
    this.pending.delete(id);
    this.inFlight.add(id);
    this.emit();
    this.options
      .run(id, op)
      .then(() => {
        this.everSaved = true;
      })
      .catch((error: unknown) => {
        this.lastError = error instanceof Error ? error : new Error(String(error));
        // Perubahan lebih baru yang sudah menunggu menggantikan yang gagal.
        if (!this.pending.has(id)) this.failed.set(id, op);
      })
      .finally(() => {
        this.inFlight.delete(id);
        if (this.pending.has(id) && !this.timers.has(id)) this.fire(id);
        this.emit();
        if (this.isIdle()) {
          for (const resolve of this.waiters.splice(0)) resolve();
        }
      });
  }

  private emit() {
    const status: SaveStatus = !this.isIdle()
      ? 'saving'
      : this.failed.size > 0
        ? 'error'
        : this.everSaved
          ? 'saved'
          : 'idle';
    this.options.onStatus(status, status === 'error' ? this.lastError : null);
  }
}
