// Klien SMTP minimal (EHLO, STARTTLS/TLS, AUTH PLAIN, satu email teks + HTML opsional)
// tanpa dependensi, agar Edge Function bisa dimuat di server on-premise tanpa akses registry.

export interface SmtpConfig {
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  from: string;
}

export interface SmtpMessage {
  to: string;
  subject: string;
  text: string;
  /** Versi HTML; bila ada, email dikirim multipart/alternative bersama teks biasa. */
  html?: string;
}

export type SmtpFailure =
  | 'unreachable'
  | 'timeout'
  | 'tls'
  | 'auth_failed'
  | 'auth_unsupported'
  | 'rejected';

export class SmtpError extends Error {
  constructor(
    readonly reason: SmtpFailure,
    message: string,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 10_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

type Conn = Deno.Conn | Deno.TlsConn;

class Session {
  private buffer = '';

  constructor(private conn: Conn) {}

  async startTls(hostname: string) {
    this.conn = await Deno.startTls(this.conn as Deno.Conn, { hostname });
    this.buffer = '';
  }

  async reply(): Promise<{ code: number; text: string }> {
    const lines: string[] = [];
    for (;;) {
      let newline = this.buffer.indexOf('\r\n');
      while (newline < 0) {
        const chunk = new Uint8Array(4096);
        const read = await this.conn.read(chunk);
        if (read === null) throw new SmtpError('rejected', 'Server SMTP menutup koneksi.');
        this.buffer += decoder.decode(chunk.subarray(0, read));
        newline = this.buffer.indexOf('\r\n');
      }
      const line = this.buffer.slice(0, newline);
      this.buffer = this.buffer.slice(newline + 2);
      lines.push(line);
      // Baris terakhir balasan multi-baris memakai spasi setelah kode, bukan tanda "-".
      if (line.length < 4 || line[3] !== '-') {
        return { code: Number(line.slice(0, 3)), text: lines.join('\n') };
      }
    }
  }

  async command(line: string, expected: number[]): Promise<string> {
    await this.conn.write(encoder.encode(`${line}\r\n`));
    const { code, text } = await this.reply();
    if (!expected.includes(code)) {
      if (code === 535 || code === 534) {
        throw new SmtpError(
          'auth_failed',
          'Autentikasi SMTP gagal. Periksa username dan password.',
        );
      }
      throw new SmtpError('rejected', `Server SMTP menolak perintah: ${text}`);
    }
    return text;
  }

  close() {
    try {
      this.conn.close();
    } catch {
      // Koneksi sudah tertutup.
    }
  }
}

function addressOf(from: string): string {
  const match = /<([^>]+)>/.exec(from);
  return (match?.[1] ?? from).trim();
}

function base64(value: string): string {
  return btoa(String.fromCharCode(...encoder.encode(value)));
}

function encodeHeader(value: string): string {
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${base64(value)}?=`;
}

/** Titik di awal baris digandakan (dot-stuffing) agar tidak dianggap akhir DATA. */
function dotStuff(text: string): string {
  return text
    .replace(/\r?\n/g, '\r\n')
    .split('\r\n')
    .map((line) => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n');
}

/** Base64 dipotong 76 karakter per baris (RFC 2045). */
function base64Lines(value: string): string {
  return (base64(value).match(/.{1,76}/g) ?? []).join('\r\n');
}

function buildMessage(config: SmtpConfig, message: SmtpMessage): string {
  const headers = [
    `From: ${config.from}`,
    `To: ${message.to}`,
    `Subject: ${encodeHeader(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
  ];
  if (!message.html) {
    return [
      ...headers,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      dotStuff(message.text),
      '.',
    ].join('\r\n');
  }
  const boundary = `indoor-map-${crypto.randomUUID()}`;
  return [
    ...headers,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    dotStuff(message.text),
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(message.html),
    `--${boundary}--`,
    '.',
  ].join('\r\n');
}

async function connect(config: SmtpConfig): Promise<Conn> {
  try {
    return config.port === 465
      ? await Deno.connectTls({ hostname: config.host, port: config.port })
      : await Deno.connect({ hostname: config.host, port: config.port });
  } catch (cause) {
    if (cause instanceof Deno.errors.InvalidData) {
      throw new SmtpError('tls', 'Gagal membuat koneksi aman (TLS) ke server SMTP.');
    }
    throw new SmtpError(
      'unreachable',
      `Server SMTP ${config.host}:${config.port} tidak bisa dihubungi. Periksa host dan port.`,
    );
  }
}

async function deliver(config: SmtpConfig, message: SmtpMessage): Promise<void> {
  const session = new Session(await connect(config));
  try {
    const greeting = await session.reply();
    if (greeting.code !== 220)
      throw new SmtpError('rejected', `Salam SMTP tidak dikenal: ${greeting.text}`);
    let capabilities = await session.command('EHLO indoor-map', [250]);

    if (config.port !== 465 && /STARTTLS/i.test(capabilities)) {
      await session.command('STARTTLS', [220]);
      try {
        await session.startTls(config.host);
      } catch {
        throw new SmtpError('tls', 'Gagal membuat koneksi aman (TLS) ke server SMTP.');
      }
      capabilities = await session.command('EHLO indoor-map', [250]);
    }

    if (config.username) {
      if (!/AUTH[ =][^\n]*PLAIN/i.test(capabilities)) {
        throw new SmtpError('auth_unsupported', 'Server SMTP tidak menawarkan autentikasi PLAIN.');
      }
      await session.command(
        `AUTH PLAIN ${base64(`\0${config.username}\0${config.password ?? ''}`)}`,
        [235],
      );
    }

    await session.command(`MAIL FROM:<${addressOf(config.from)}>`, [250]);
    await session.command(`RCPT TO:<${message.to}>`, [250, 251]);
    await session.command('DATA', [354]);
    await session.command(buildMessage(config, message), [250]);
    await session.command('QUIT', [221]).catch(() => undefined);
  } finally {
    session.close();
  }
}

export async function sendMail(config: SmtpConfig, message: SmtpMessage): Promise<void> {
  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new SmtpError('timeout', 'Server SMTP tidak merespons dalam 10 detik.')),
      TIMEOUT_MS,
    );
  });
  try {
    await Promise.race([deliver(config, message), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
