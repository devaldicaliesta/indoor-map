import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Edge Function berjalan di Deno tanpa bundler: setiap impor relatif harus berekstensi `.ts` dan
// tidak boleh ada paket npm. Kesalahan ini tidak tertangkap typecheck, tetapi membuat fungsi
// gagal boot ("Module not found ... Maybe add a '.ts' extension").
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const functionsDir = join(root, 'supabase/functions');
const IMPORT = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/g;

function filesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesIn(join(dir, entry.name))
      : entry.name.endsWith('.ts')
        ? [join(dir, entry.name)]
        : [],
  );
}

const specifiers = (file: string) =>
  [...readFileSync(file, 'utf8').matchAll(IMPORT)].map((match) => match[1] ?? '');

/** Modul `packages/domain` yang dimuat Edge Function, beserta seluruh impornya. */
function domainGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const queue = filesIn(functionsDir).flatMap((file) =>
    specifiers(file)
      .filter((s) => s.includes('packages/domain/'))
      .map((s) => resolve(dirname(file), s)),
  );
  for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
    if (graph.has(file)) continue;
    const imports = specifiers(file);
    graph.set(file, imports);
    for (const s of imports)
      if (s.startsWith('.') && s.endsWith('.ts')) queue.push(resolve(dirname(file), s));
  }
  return graph;
}

describe('modul domain yang dimuat Edge Function', () => {
  it('hanya mengimpor file relatif berekstensi .ts', () => {
    const graph = domainGraph();
    expect(graph.size).toBeGreaterThan(0);
    const wrong = [...graph].flatMap(([file, imports]) =>
      imports
        .filter((s) => !(s.startsWith('.') && s.endsWith('.ts')))
        .map((s) => `${relative(root, file)}: ${s}`),
    );
    expect(wrong).toEqual([]);
  });
});
