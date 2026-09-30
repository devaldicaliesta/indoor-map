import { describe, expect, it } from 'vitest';
import { createExploreStore, selectionOf } from './explore-store';

const category = { kind: 'category', id: 'c1' } as const;
const location = { kind: 'location', id: 'l1' } as const;

describe('store panel Visitor', () => {
  it('mulai tanpa pilihan dengan sheet posisi intip', () => {
    const state = createExploreStore().getState();
    expect(state).toMatchObject({ query: '', list: null, detail: null, sheetSnap: 'peek' });
    expect(selectionOf(state)).toBeNull();
  });

  it('mengetik membuka hasil di sheet penuh dan menutup detail', () => {
    const store = createExploreStore();
    store.getState().openDetail(location);
    store.getState().search('rad');
    expect(store.getState()).toMatchObject({ query: 'rad', detail: null, sheetSnap: 'full' });
    store.getState().search('');
    expect(store.getState().sheetSnap).toBe('peek');
  });

  it('chip bersifat sakelar dan mengosongkan pencarian', () => {
    const store = createExploreStore();
    store.getState().search('rad');
    store.getState().toggleList(category);
    expect(store.getState()).toMatchObject({ list: category, query: '', sheetSnap: 'half' });
    expect(store.getState().focus).toEqual({ seq: 1, mode: 'fit' });
    store.getState().toggleList({ ...category });
    expect(store.getState()).toMatchObject({ list: null, sheetSnap: 'peek' });
    store.getState().toggleList({ kind: 'directory' });
    expect(store.getState().sheetSnap).toBe('full');
  });

  it('hasil cari kategori membuka daftarnya walau daftar itu sudah terbuka', () => {
    const store = createExploreStore();
    store.getState().toggleList(category);
    store.getState().search('poli');
    store.getState().openList(category);
    expect(store.getState()).toMatchObject({ list: category, query: '' });
  });

  it('detail dibuka di sheet setengah; kembali ke hasil, daftar, atau awal', () => {
    const store = createExploreStore();
    store.getState().openDetail({ kind: 'unit', id: 'u1' }, 'pan');
    expect(store.getState()).toMatchObject({ sheetSnap: 'half', focus: { seq: 1, mode: 'pan' } });
    store.getState().closeDetail();
    expect(store.getState()).toMatchObject({ detail: null, sheetSnap: 'peek' });

    store.getState().toggleList(category);
    store.getState().openDetail(location);
    store.getState().closeDetail();
    expect(store.getState()).toMatchObject({ list: category, sheetSnap: 'half' });

    store.getState().search('rad');
    store.getState().openDetail(location);
    store.getState().closeDetail();
    expect(store.getState()).toMatchObject({ query: 'rad', sheetSnap: 'full' });
  });

  it('sorotan peta: detail menang, pencarian menyembunyikan daftar, direktori tidak menyorot', () => {
    expect(selectionOf({ detail: location, query: 'x', list: category })).toBe(location);
    expect(selectionOf({ detail: null, query: 'x', list: category })).toBeNull();
    expect(selectionOf({ detail: null, query: '', list: category })).toBe(category);
    expect(selectionOf({ detail: null, query: '', list: { kind: 'directory' } })).toBeNull();
  });
});
