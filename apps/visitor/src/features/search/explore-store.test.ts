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

describe('titik asal', () => {
  const qr = { kind: 'origin_point', code: '3fa9c1d2e4b5' } as const;

  it('Rute ke sini tanpa titik asal meminta titik asal lebih dulu', () => {
    const store = createExploreStore();
    store.getState().openDetail(location);
    store.getState().requestRoute(location);
    expect(store.getState()).toMatchObject({
      destination: location,
      originMode: 'choose',
      detail: null,
    });
    store.getState().setOrigin({ kind: 'feature', featureId: 'u1' });
    expect(store.getState()).toMatchObject({
      origin: { kind: 'feature', featureId: 'u1' },
      originMode: 'off',
      destination: location,
      originSeq: 1,
    });
  });

  it('dari QR titik asal sudah ada: Rute ke sini langsung ke panel rute', () => {
    const store = createExploreStore({ origin: qr });
    store.getState().requestRoute(location);
    expect(store.getState()).toMatchObject({
      origin: qr,
      originMode: 'off',
      destination: location,
    });
  });

  it('titik asal bisa diganti; ketuk peta; batal tanpa titik asal membatalkan rute', () => {
    const store = createExploreStore({ origin: qr });
    store.getState().requestRoute(location);
    store.getState().chooseOrigin();
    store.getState().tapOrigin();
    expect(store.getState().originMode).toBe('tap');
    store.getState().cancelOrigin();
    expect(store.getState()).toMatchObject({
      origin: qr,
      destination: location,
      originMode: 'off',
    });

    const fresh = createExploreStore();
    fresh.getState().requestRoute(location);
    fresh.getState().cancelOrigin();
    expect(fresh.getState()).toMatchObject({ destination: null, originMode: 'off' });
  });
});

describe('rute', () => {
  it('mode aksesibel dan rute baru kembali ke daftar langkah dan membingkai ulang', () => {
    const store = createExploreStore({ origin: { kind: 'origin_point', code: '3fa9c1d2e4b5' } });
    store.getState().requestRoute(location);
    const seq = store.getState().routeSeq;
    store.getState().showStep(2);
    store.getState().setAccessible(true);
    expect(store.getState()).toMatchObject({
      accessible: true,
      activeStep: null,
      routeSeq: seq + 1,
    });
    store.getState().showStep(1);
    store.getState().closeRoute();
    expect(store.getState()).toMatchObject({ destination: null, activeStep: null });
  });

  it('tukar asal dan tujuan', () => {
    const store = createExploreStore({ origin: { kind: 'location', locationId: 'l1' } });
    store.getState().requestRoute({ kind: 'unit', id: 'u2' });
    store.getState().swap({ kind: 'feature', featureId: 'u2' }, location);
    expect(store.getState()).toMatchObject({
      origin: { kind: 'feature', featureId: 'u2' },
      destination: location,
    });
  });
});

describe('keadaan awal dari tautan', () => {
  it('lokasi dibuka dan kamera membingkainya', () => {
    const state = createExploreStore({ detail: location }).getState();
    expect(state).toMatchObject({ detail: location, sheetSnap: 'half', focus: { seq: 1 } });
  });

  it('rute lengkap langsung tampil; tanpa asal yang berlaku meminta asal', () => {
    const qr = { kind: 'origin_point', code: '3fa9c1d2e4b5' } as const;
    expect(
      createExploreStore({ origin: qr, destination: location, accessible: true }).getState(),
    ).toMatchObject({ originMode: 'off', destination: location, accessible: true, routeSeq: 1 });
    expect(createExploreStore({ destination: location }).getState()).toMatchObject({
      originMode: 'choose',
      destination: location,
    });
  });
});
