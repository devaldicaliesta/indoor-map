// Pemberitahuan pihak ketiga untuk build app: lisensi MIT/BSD/Apache/OFL mewajibkan teks
// lisensinya ikut saat software didistribusikan, sedangkan bundel Vite membuang komentar
// lisensi. Daftar diambil dari modul yang benar-benar ter-bundle, bukan dari package.json.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { Plugin } from 'vite';

export interface Notice {
  name: string;
  version: string;
  license: string;
  homepage: string | null;
  /** Teks lisensi; `null` bila paket tidak menyertakan berkas lisensi. */
  text: string | null;
}

export interface ExtraNotice {
  name: string;
  license: string;
  /** Berkas teks lisensi (misalnya OFL untuk font yang di-host sendiri). */
  file: string;
}

export interface NoticesOptions {
  /** Judul berkas, misalnya "PanduArah Admin". */
  product: string;
  /** Komponen di luar node_modules, misalnya font. */
  extra?: ExtraNotice[];
  /** Paket yang ikut tetapi tidak tercatat sebagai modul JS (misalnya CSS dasar Tailwind). */
  include?: string[];
  /** Root app untuk mencari paket `include`; bawaan direktori kerja Vite. */
  root?: string;
  fileName?: string;
}

export const NOTICES_FILE = 'third-party-notices.txt';
const LICENSE_FILE = /^(licen[cs]e|copying|notice)(\.|-|$)/i;

/** Root paket npm sebuah modul ter-bundle, atau `null` untuk kode sendiri dan modul virtual. */
export function packageRoot(moduleId: string): string | null {
  const id = moduleId.replace(/\\/g, '/').split('?')[0] ?? '';
  if (id.startsWith('\0')) return null;
  const marker = '/node_modules/';
  const at = id.lastIndexOf(marker);
  if (at < 0) return null;
  const rest = id.slice(at + marker.length).split('/');
  const length = rest[0]?.startsWith('@') ? 2 : 1;
  if (rest.length <= length) return null;
  return id.slice(0, at + marker.length) + rest.slice(0, length).join('/');
}

// Beberapa paket MIT tidak menyertakan berkas lisensi di tarball npm; teks MIT standar dengan
// pemegang hak cipta dari package.json memenuhi syarat "sertakan pemberitahuan ini".
const MIT_TEXT = `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;

function authorOf(field: unknown): string | null {
  if (typeof field === 'string') return field;
  if (field && typeof field === 'object' && 'name' in field) return String(field.name);
  return null;
}

/** Teks MIT standar untuk paket MIT tanpa berkas lisensi; `null` untuk lisensi lain. */
export function standardLicenseText(license: string, author: string | null): string | null {
  if (license !== 'MIT') return null;
  return `MIT License\n\nCopyright (c) ${author ?? 'para penulis paket'}\n\n${MIT_TEXT}`;
}

function licenseOf(field: unknown): string {
  if (typeof field === 'string') return field;
  if (field && typeof field === 'object' && 'type' in field) return String(field.type);
  return 'tidak dicantumkan';
}

/** Data lisensi satu paket dari package.json dan berkas lisensinya. */
export function readNotice(root: string): Notice {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as Record<
    string,
    unknown
  >;
  const files = readdirSync(root)
    .filter((file) => LICENSE_FILE.test(file))
    .sort();
  const text = files.map((file) => readFileSync(join(root, file), 'utf8').trim()).join('\n\n');
  const license = licenseOf(pkg.license);
  return {
    name: String(pkg.name),
    version: String(pkg.version),
    license,
    homepage: typeof pkg.homepage === 'string' ? pkg.homepage : null,
    text: text || standardLicenseText(license, authorOf(pkg.author)),
  };
}

/** Semua root paket di sebuah folder node_modules, termasuk yang bersarang dan ber-scope. */
export function packageRootsIn(nodeModules: string): string[] {
  if (!existsSync(nodeModules)) return [];
  const roots: string[] = [];
  // Tata letak pnpm: paket di node_modules berupa symlink ke `.pnpm/<paket>/node_modules/…`,
  // dan dependensinya hanya terlihat di dalam `.pnpm`.
  const store = join(nodeModules, '.pnpm');
  if (existsSync(store)) {
    for (const dir of readdirSync(store))
      roots.push(...packageRootsIn(join(store, dir, 'node_modules')));
  }
  for (const entry of readdirSync(nodeModules, { withFileTypes: true })) {
    if (!(entry.isDirectory() || entry.isSymbolicLink()) || entry.name.startsWith('.')) continue;
    const dirs = entry.name.startsWith('@')
      ? readdirSync(join(nodeModules, entry.name)).map((name) => join(entry.name, name))
      : [entry.name];
    for (const dir of dirs) {
      const root = join(nodeModules, dir);
      if (!existsSync(join(root, 'package.json'))) continue;
      roots.push(root, ...packageRootsIn(join(root, 'node_modules')));
    }
  }
  return roots;
}

/** Satu entri per nama@versi, terurut nama. */
export function collectNotices(moduleIds: Iterable<string>): Notice[] {
  return noticesOf(
    [...moduleIds].map((id) => packageRoot(id)).filter((root): root is string => root !== null),
  );
}

/** Data lisensi dari daftar root paket, satu entri per nama@versi, terurut nama. */
export function noticesOf(packageRoots: Iterable<string>): Notice[] {
  const roots = new Set(packageRoots);
  const byKey = new Map<string, Notice>();
  for (const root of roots) {
    const notice = readNotice(root);
    byKey.set(`${notice.name}@${notice.version}`, notice);
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const label = (n: Notice) => (n.version ? `${n.name} ${n.version}` : n.name);

export function renderNotices(product: string, notices: readonly Notice[]): string {
  const rule = '='.repeat(72);
  const head = [
    `${product} — pemberitahuan pihak ketiga`,
    '',
    'Berkas ini memuat komponen sumber terbuka yang ikut di dalam aplikasi ini beserta teks',
    'lisensinya, dibuat otomatis saat build.',
    '',
    ...notices.map((n) => `- ${label(n)} (${n.license})`),
  ];
  const bodies = notices.map((n) =>
    [
      rule,
      label(n),
      `Lisensi: ${n.license}`,
      ...(n.homepage ? [n.homepage] : []),
      '',
      n.text ?? `Paket tidak menyertakan berkas lisensi; berlaku lisensi ${n.license}.`,
    ].join('\n'),
  );
  return `${[head.join('\n'), ...bodies].join('\n\n')}\n`;
}

/** Plugin Vite: menulis `third-party-notices.txt` di samping index.html saat build. */
export function thirdPartyNotices(options: NoticesOptions): Plugin {
  let root = options.root ?? process.cwd();
  return {
    name: 'indoor-third-party-notices',
    apply: 'build',
    configResolved(config) {
      root = options.root ?? config.root;
    },
    generateBundle(_, bundle) {
      const ids: string[] = [];
      for (const item of Object.values(bundle)) {
        if (item.type === 'chunk') ids.push(...item.moduleIds);
      }
      const require = createRequire(join(root, 'package.json'));
      for (const name of options.include ?? []) {
        ids.push(require.resolve(`${name}/package.json`));
      }
      const extra: Notice[] = (options.extra ?? []).map((e) => ({
        name: e.name,
        version: '',
        license: e.license,
        homepage: null,
        text: readFileSync(e.file, 'utf8').trim(),
      }));
      this.emitFile({
        type: 'asset',
        fileName: options.fileName ?? NOTICES_FILE,
        source: renderNotices(options.product, [...collectNotices(ids), ...extra]),
      });
    },
  };
}

const UI_FONTS = join(import.meta.dirname, '../../../packages/ui/src/fonts');

/** Font yang di-host sendiri di `packages/ui` (OFL-1.1); dipakai semua app. */
export const UI_FONT_NOTICES: ExtraNotice[] = [
  ['Atkinson Hyperlegible (font)', 'LICENSE-atkinson-hyperlegible.txt'],
  ['IBM Plex Sans (font)', 'LICENSE-ibm-plex-sans.txt'],
  ['IBM Plex Mono (font)', 'LICENSE-ibm-plex-mono.txt'],
].map(([name, file]) => ({
  name: String(name),
  license: 'OFL-1.1',
  file: join(UI_FONTS, String(file)),
}));
