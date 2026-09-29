import type { PictogramKey } from '@indoor/domain';

/**
 * Satu bagian piktogram di kanvas 24×24: path berisi (aturan evenodd, sehingga lubang
 * bisa dibuat di path yang sama) atau garis dengan tebal `stroke` dan ujung bulat.
 */
export interface PictogramPart {
  d: string;
  stroke?: number;
}

/** Lingkaran sebagai path agar semua bagian cukup satu jenis elemen. */
function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
}

/**
 * Set piktogram bawaan (05-desain-ui.md): bentuk sederhana dan tebal agar tetap terbaca
 * di dalam lingkaran 28 px di peta. Warna selalu `currentColor`; latar diatur pemakai.
 */
export const PICTOGRAM_SHAPES: Record<PictogramKey, readonly PictogramPart[]> = {
  'toilet-male': [
    { d: circle(12, 4, 2.2) },
    {
      d: 'M9.2 7.2h5.6a1.8 1.8 0 0 1 1.8 1.8v5.8h-2V21h-2.2v-6h-0.8v6H9.4v-6.2h-2V9a1.8 1.8 0 0 1 1.8-1.8z',
    },
  ],
  'toilet-female': [
    { d: circle(12, 4, 2.2) },
    {
      d: 'M10.1 7.2h3.8a1.5 1.5 0 0 1 1.44 1.08L17.2 15h-2.8v6h-1.9v-6h-1v6H9.6v-6H6.8l1.86-6.72A1.5 1.5 0 0 1 10.1 7.2z',
    },
  ],
  'toilet-accessible': [
    { d: circle(10, 3.8, 2) },
    { d: 'M10 7.6v5.9h5.2l2.6 5.3', stroke: 2.3 },
    { d: 'M10 10.2h4.4', stroke: 2 },
    { d: 'M7.4 11.1a5 5 0 1 0 7.1 7', stroke: 2 },
  ],
  'prayer-room': [
    { d: 'M12.9 1.6a2.3 2.3 0 1 0 0 4.4 2.9 2.9 0 0 1 0-4.4z' },
    {
      d: 'M4 21v-7.4h1.6a6.4 6.4 0 0 1 12.8 0H20V21zM10.4 21v-3.2a1.6 1.6 0 0 1 3.2 0V21z',
    },
  ],
  atm: [
    {
      d:
        'M4.5 4h15A1.5 1.5 0 0 1 21 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 14.5v-9A1.5 1.5 0 0 1 4.5 4z' +
        'M6 7v6h12V7z',
    },
    { d: circle(12, 10, 1.8) },
    { d: 'M7 19.5h10', stroke: 2.2 },
  ],
  'first-aid': [{ d: 'M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z' }],
  information: [{ d: circle(12, 5, 2) }, { d: 'M9.5 9h4v9h1.8v2.5H8.7V18h1.8v-6.5h-1z' }],
  'fire-extinguisher': [
    { d: 'M9 10a3 3 0 0 1 6 0v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z' },
    { d: 'M10.6 4.2h2.8V7h-2.8z' },
    { d: 'M13.4 5.2h3.4l1.7 3.4', stroke: 1.8 },
    { d: 'M8.6 3.4h4.6', stroke: 1.8 },
  ],
  'assembly-point': [
    { d: circle(10, 10.4, 1.4) },
    { d: circle(14, 10.4, 1.4) },
    { d: 'M8.6 12.3h2.8v3.6H8.6zM12.6 12.3h2.8v3.6h-2.8z' },
    {
      d: 'M6.8 6.8L2.4 5.4 5.4 2.4zM17.2 6.8l4.4-1.4-3-3zM17.2 17.2l4.4 1.4-3 3zM6.8 17.2l-4.4 1.4 3 3z',
    },
  ],
  'emergency-exit': [
    { d: 'M13.5 3.5H20v17h-6.5', stroke: 2 },
    { d: circle(8.4, 4.6, 1.9) },
    { d: 'M8.2 8.2l-2 5 3.2 2.3v4.8', stroke: 2.2 },
    { d: 'M8.2 8.2l3 3.1h2.6', stroke: 2 },
    { d: 'M6.2 13.2l-2.8 1.3', stroke: 2 },
  ],
  elevator: [
    {
      d:
        'M6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3z' +
        'M7 5v14h10V5z',
    },
    { d: 'M12 6.5l3.2 4H8.8zM12 17.5l3.2-4H8.8z' },
  ],
  escalator: [
    { d: 'M3 19.5h4.4L16 9.5h5', stroke: 3 },
    { d: circle(12.6, 4.2, 1.8) },
    { d: 'M12.6 7.6v4.2', stroke: 2.2 },
  ],
  stairs: [{ d: 'M3 21v-4.5h4.5V12H12V7.5h4.5V3H21v18z' }],
  parking: [
    { d: 'M7 3h6.2a5.2 5.2 0 0 1 0 10.4h-2.4V21H7zM10.8 6.6v3.2h2.4a1.6 1.6 0 0 0 0-3.2z' },
  ],
};
