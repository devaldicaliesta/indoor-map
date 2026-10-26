import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectNotices, noticesOf, packageRoot, packageRootsIn, renderNotices } from '../src';

function fakePackage(root: string, pkg: Record<string, unknown>, files: Record<string, string>) {
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, 'package.json'), JSON.stringify(pkg));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(root, name), text);
}

describe('packageRoot', () => {
  it('paket biasa, paket ber-scope, dan tata letak pnpm', () => {
    expect(packageRoot('/app/node_modules/react/index.js')).toBe('/app/node_modules/react');
    expect(packageRoot('/app/node_modules/@radix-ui/react-dialog/dist/index.mjs')).toBe(
      '/app/node_modules/@radix-ui/react-dialog',
    );
    expect(
      packageRoot('/r/node_modules/.pnpm/maplibre-gl@6.11.2/node_modules/maplibre-gl/dist/x.mjs'),
    ).toBe('/r/node_modules/.pnpm/maplibre-gl@6.11.2/node_modules/maplibre-gl');
    expect(packageRoot('C:\\r\\node_modules\\zod\\index.js?commonjs-proxy')).toBe(
      'C:/r/node_modules/zod',
    );
  });

  it('kode sendiri dan modul virtual tidak dihitung', () => {
    expect(packageRoot('/r/packages/ui/src/index.ts')).toBeNull();
    expect(packageRoot('\0vite/preload-helper')).toBeNull();
    expect(packageRoot('/r/node_modules/@scope')).toBeNull();
  });
});

describe('collectNotices dan renderNotices', () => {
  const dir = mkdtempSync(join(tmpdir(), 'notices-'));
  const nm = join(dir, 'node_modules');
  fakePackage(
    join(nm, 'zeta'),
    { name: 'zeta', version: '1.0.0', license: 'MIT' },
    {
      LICENSE: 'MIT License\nCopyright (c) Zeta',
    },
  );
  fakePackage(
    join(nm, '@acme', 'alpha'),
    {
      name: '@acme/alpha',
      version: '2.1.0',
      license: { type: 'Apache-2.0' },
      homepage: 'https://acme.test',
    },
    { 'LICENSE.txt': 'Apache License 2.0', NOTICE: 'Acme NOTICE' },
  );
  fakePackage(join(nm, 'bare'), { name: 'bare', version: '0.1.0', license: 'ISC' }, {});
  fakePackage(
    join(nm, 'mit-tanpa-berkas'),
    { name: 'mit-tanpa-berkas', version: '1.2.3', license: 'MIT', author: { name: 'Ana Penulis' } },
    {},
  );

  const notices = collectNotices([
    join(nm, 'zeta', 'a.js'),
    join(nm, 'zeta', 'b.js'),
    join(nm, '@acme', 'alpha', 'dist', 'index.js'),
    join(nm, 'bare', 'index.js'),
    join(nm, 'mit-tanpa-berkas', 'index.js'),
    join(dir, 'src', 'main.ts'),
  ]);

  it('satu entri per paket, terurut, lisensi dan berkas NOTICE ikut', () => {
    expect(notices.map((n) => `${n.name}@${n.version} ${n.license}`)).toEqual([
      '@acme/alpha@2.1.0 Apache-2.0',
      'bare@0.1.0 ISC',
      'mit-tanpa-berkas@1.2.3 MIT',
      'zeta@1.0.0 MIT',
    ]);
    expect(notices[2]?.text).toMatch(
      /^MIT License\n\nCopyright \(c\) Ana Penulis\n\nPermission is hereby granted/,
    );
    expect(notices[0]?.text).toBe('Apache License 2.0\n\nAcme NOTICE');
    expect(notices[1]?.text).toBeNull();
  });

  it('teks berisi daftar ringkas, teks lisensi lengkap, dan keterangan paket tanpa berkas', () => {
    const text = renderNotices('PanduArah Uji', [
      ...notices,
      { name: 'Font Uji', version: '', license: 'OFL-1.1', homepage: null, text: 'SIL OFL' },
    ]);
    expect(text).toContain('PanduArah Uji — pemberitahuan pihak ketiga');
    expect(text).toContain('- zeta 1.0.0 (MIT)');
    expect(text).toContain('- Font Uji (OFL-1.1)');
    expect(text).toContain('Copyright (c) Zeta');
    expect(text).toContain('https://acme.test');
    expect(text).toContain('Paket tidak menyertakan berkas lisensi; berlaku lisensi ISC.');
  });

  it('paket terpasang dibaca dari node_modules, termasuk ber-scope dan bersarang', () => {
    fakePackage(
      join(nm, 'zeta', 'node_modules', 'inner'),
      { name: 'inner', version: '3.0.0', license: 'MIT' },
      {},
    );
    const names = noticesOf(packageRootsIn(nm)).map((n) => n.name);
    expect(names).toEqual(['@acme/alpha', 'bare', 'inner', 'mit-tanpa-berkas', 'zeta']);
    expect(packageRootsIn(join(dir, 'tidak-ada'))).toEqual([]);
  });

  it('tata letak pnpm: symlink dan dependensi di dalam .pnpm ikut terbaca', () => {
    const deployed = join(dir, 'deploy', 'node_modules');
    const store = join(deployed, '.pnpm');
    fakePackage(
      join(store, 'zod@4.0.0', 'node_modules', 'zod'),
      { name: 'zod', version: '4.0.0', license: 'MIT' },
      {},
    );
    fakePackage(
      join(store, 'dep@1.0.0', 'node_modules', 'dep'),
      { name: 'dep', version: '1.0.0', license: 'ISC' },
      {},
    );
    symlinkSync(join(store, 'zod@4.0.0', 'node_modules', 'zod'), join(deployed, 'zod'), 'dir');
    expect(noticesOf(packageRootsIn(deployed)).map((n) => `${n.name}@${n.version}`)).toEqual([
      'dep@1.0.0',
      'zod@4.0.0',
    ]);
  });
});
