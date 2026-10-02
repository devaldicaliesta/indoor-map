import type { DataClient, FloorFeature } from '@indoor/data';
import { expect, type Page } from '@playwright/test';
import type { EditorPage } from '../pages/editor-page';

/** Persegi `size` px dengan sudut kiri atas (dx, dy) relatif terhadap pusat kanvas. */
export const square = (dx: number, dy: number, size = 60): [number, number][] => [
  [dx, dy],
  [dx + size, dy],
  [dx + size, dy + size],
  [dx, dy + size],
];

/** Posisi layar dari offset terhadap pusat kanvas editor. */
export async function at(editor: EditorPage, dx: number, dy: number) {
  const box = await editor.canvas.boundingBox();
  if (!box) throw new Error('kanvas editor tidak tampil');
  return { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy };
}

/** Menggambar unit lewat alat Poligon dan menunggu tersimpan. */
export async function drawUnit(page: Page, editor: EditorPage, points: [number, number][]) {
  await editor.tool('Poligon').click();
  await editor.drawPolygon(points);
  await expect(editor.saveStatus('Tersimpan')).toBeVisible();
  await page.keyboard.press('Escape');
}

/** Unit di lantai itu, diurutkan menurut kode (dibaca dari server). */
export async function unitsOn(
  superAdmin: DataClient,
  floorId: Parameters<DataClient['features']['listByFloor']>[0],
) {
  const { features } = await superAdmin.features.listByFloor(floorId);
  return features
    .filter((f: FloorFeature) => f.properties.kind === 'unit')
    .sort((a, b) => String(a.properties.unitCode).localeCompare(String(b.properties.unitCode)));
}

export function ring(feature: FloorFeature | undefined): number[][] {
  if (feature?.geometry.type !== 'Polygon') throw new Error('bukan poligon');
  return feature.geometry.coordinates[0] ?? [];
}
