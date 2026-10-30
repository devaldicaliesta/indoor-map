/** Blok teks legal dari Markdown sederhana di `docs/legal/` (judul, paragraf, daftar bernomor). */
export type LegalBlock =
  | { kind: 'title'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] };

const NUMBERED = /^\d+\.\s+/;

/**
 * Sengaja hanya mendukung bentuk yang dipakai naskah EULA, tanpa format inline, agar teks yang
 * disetujui sama persis dengan berkasnya tanpa dependency Markdown.
 */
export function parseLegalText(markdown: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  for (const chunk of markdown.replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    const lines = chunk
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const [first] = lines;
    if (!first) continue;
    if (first.startsWith('## ')) {
      blocks.push({ kind: 'heading', text: first.slice(3).trim() });
    } else if (first.startsWith('# ')) {
      blocks.push({ kind: 'title', text: first.slice(2).trim() });
    } else if (NUMBERED.test(first)) {
      const items: string[] = [];
      for (const line of lines) {
        if (NUMBERED.test(line)) items.push(line.replace(NUMBERED, ''));
        else if (items.length) items[items.length - 1] += ` ${line}`;
      }
      blocks.push({ kind: 'list', items });
    } else {
      blocks.push({ kind: 'paragraph', text: lines.join(' ') });
    }
  }
  return blocks;
}

/** Versi naskah dari baris `Versi YYYY-MM-DD`; `null` bila tidak ada. */
export function legalTextVersion(markdown: string): string | null {
  return /^Versi (\d{4}-\d{2}-\d{2})$/m.exec(markdown)?.[1] ?? null;
}
