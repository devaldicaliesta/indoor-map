import { beforeEach, describe, expect, it } from 'vitest';
import { selectScreen, useBrowseStore } from './browse-store';

const store = () => useBrowseStore.getState();

describe('navigasi panel Visitor', () => {
  beforeEach(() => store().reset());

  it('mulai mengetik membuka hasil dengan sheet penuh; mengosongkan kembali ke beranda', () => {
    store().setQuery('rad');
    expect(store()).toMatchObject({ query: 'rad', stack: [], sheet: 'full' });
    store().setSheet('half');
    store().setQuery('radio');
    expect(store().sheet).toBe('half');
    store().setQuery('');
    expect(store()).toMatchObject({ query: '', sheet: 'peek' });
  });

  it('membuka dari daftar menumpuk layar dan meminta kamera', () => {
    store().open({ kind: 'category', id: 'c1' });
    expect(store()).toMatchObject({ sheet: 'half', focus: { seq: 1 } });
    store().open({ kind: 'location', id: 'l1' });
    expect(selectScreen(store())).toEqual({ kind: 'location', id: 'l1' });
    expect(store().focus).toEqual({ target: { kind: 'location', id: 'l1' }, seq: 2 });
    store().back();
    expect(selectScreen(store())).toEqual({ kind: 'category', id: 'c1' });
    store().back();
    expect(store()).toMatchObject({ stack: [], sheet: 'peek' });
  });

  it('direktori memakai sheet penuh dan tidak menggeser kamera', () => {
    store().open({ kind: 'directory' });
    expect(store()).toMatchObject({ sheet: 'full', focus: null });
  });

  it('ketuk peta menggantikan detail yang terbuka tanpa menggeser kamera', () => {
    store().open({ kind: 'directory' });
    store().openFromMap({ kind: 'unit', id: 'u1' });
    store().openFromMap({ kind: 'location', id: 'l1' });
    expect(store().stack).toEqual([{ kind: 'directory' }, { kind: 'location', id: 'l1' }]);
    expect(store()).toMatchObject({ sheet: 'half', focus: null });
    store().back();
    expect(store().sheet).toBe('full');
  });

  it('mengetik saat detail terbuka kembali ke hasil pencarian', () => {
    store().setQuery('rad');
    store().open({ kind: 'location', id: 'l1' });
    store().setQuery('radi');
    expect(store()).toMatchObject({ stack: [], sheet: 'full' });
    store().open({ kind: 'location', id: 'l1' });
    store().back();
    expect(store().sheet).toBe('full');
  });
});
