import type { FeatureKind, QrMatrix } from '@indoor/domain';
import type { Position } from 'geojson';
import type { FloorFeatureCollection } from './map';
import {
  drawFloor,
  type PaperSize,
  type PrintLayout,
  type PrintShape,
  paperPoints,
  qrShapes,
  textWidth,
} from './print';
import type { MapDisplay } from './style';

export type BoardLanguage = 'id' | 'en';

export interface BoardTexts {
  here: string;
  scan: readonly string[];
  locations: string;
  legend: string;
  north: string;
  sticker: string;
}

export const BOARD_TEXTS: Record<BoardLanguage, BoardTexts> = {
  id: {
    here: 'Anda di sini',
    scan: ['Pindai untuk petunjuk arah', 'dari titik ini'],
    locations: 'Lokasi utama',
    legend: 'Legenda',
    north: 'U',
    sticker: 'Pindai untuk rute ke sini',
  },
  en: {
    here: 'You are here',
    scan: ['Scan for directions', 'from this point'],
    locations: 'Main locations',
    legend: 'Legend',
    north: 'N',
    sticker: 'Scan for directions here',
  },
};

export interface BoardOptions {
  paper: PaperSize;
  venueName: string;
  place: string;
  here: Position;
  headingDeg: number;
  qr: QrMatrix;
  url: string;
  locations: readonly string[];
  texts: BoardTexts;
  kindLabels: Partial<Record<FeatureKind, string>>;
  accent?: string;
  colors?: MapDisplay['colors'];
}

const INK = '#1f2328';
const MUTED = '#545b64';
const HERE = '#d1242f';
const LEGEND_KINDS: FeatureKind[] = ['unit', 'corridor', 'elevator', 'stairs', 'exit', 'facility'];

function fitText(text: string, size: number, maxWidth: number, bold = false): string {
  if (textWidth(text, size, bold) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && textWidth(`${cut}…`, size, bold) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

const rotate = ([x, y]: [number, number], cx: number, cy: number, deg: number) => {
  const turn = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [
    cx + dx * Math.cos(turn) - dy * Math.sin(turn),
    cy + dx * Math.sin(turn) + dy * Math.cos(turn),
  ] as [number, number];
};

export function buildBoardLayout(
  features: FloorFeatureCollection,
  options: BoardOptions,
): PrintLayout {
  const [width, height] = paperPoints(options.paper, 'portrait');
  const u = width / 595.28;
  const margin = 28 * u;
  const accent = options.accent ?? INK;
  const shapes: PrintShape[] = [];
  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    extra: Partial<Extract<PrintShape, { type: 'text' }>> = {},
  ) =>
    shapes.push({ type: 'text', x, y, size, text: value, anchor: 'start', color: INK, ...extra });

  const bandHeight = 34 * u;
  shapes.push({
    type: 'path',
    rings: [
      [
        [0, 0],
        [width, 0],
        [width, bandHeight],
        [0, bandHeight],
      ],
    ],
    closed: true,
    fill: accent,
  });
  text(
    fitText(options.venueName, 16 * u, width - margin * 2, true),
    margin,
    bandHeight / 2 + 6 * u,
    16 * u,
    {
      bold: true,
      color: '#ffffff',
    },
  );

  const titleY = bandHeight + 40 * u;
  text(options.texts.here, margin, titleY, 30 * u, { bold: true, color: HERE });
  text(fitText(options.place, 14 * u, width - margin * 2), margin, titleY + 22 * u, 14 * u, {
    color: MUTED,
  });

  const map = {
    x: margin,
    y: titleY + 38 * u,
    w: width - margin * 2,
    h: height * 0.5,
  };
  shapes.push({
    type: 'path',
    rings: [
      [
        [map.x, map.y],
        [map.x + map.w, map.y],
        [map.x + map.w, map.y + map.h],
        [map.x, map.y + map.h],
      ],
    ],
    closed: true,
    fill: '#f7f7f4',
    stroke: '#d5d9de',
    width: 0.8,
  });
  const floor = drawFloor(
    features,
    { x: map.x + 6 * u, y: map.y + 6 * u, w: map.w - 12 * u, h: map.h - 12 * u },
    { rotationDeg: options.headingDeg, ...(options.colors ? { colors: options.colors } : {}) },
  );
  shapes.push(...floor.shapes);

  const [hx, hy] = floor.project(options.here);
  const r = 9 * u;
  shapes.push({ type: 'circle', x: hx, y: hy, r: r * 1.9, fill: '#f6c9cc' });
  shapes.push({ type: 'circle', x: hx, y: hy, r, fill: HERE, stroke: '#ffffff' });
  shapes.push({
    type: 'path',
    rings: [
      [
        [hx, hy - r * 3.2],
        [hx + r * 0.9, hy - r * 1.6],
        [hx - r * 0.9, hy - r * 1.6],
      ],
    ],
    closed: true,
    fill: HERE,
  });
  const labelSize = 11 * u;
  const labelWidth = textWidth(options.texts.here, labelSize, true) + 12 * u;
  const labelX = Math.min(Math.max(hx - labelWidth / 2, map.x + 4), map.x + map.w - labelWidth - 4);
  const labelY = Math.min(hy + r * 2.4, map.y + map.h - labelSize * 1.8);
  shapes.push({
    type: 'path',
    rings: [
      [
        [labelX, labelY],
        [labelX + labelWidth, labelY],
        [labelX + labelWidth, labelY + labelSize * 1.6],
        [labelX, labelY + labelSize * 1.6],
      ],
    ],
    closed: true,
    fill: HERE,
  });
  text(options.texts.here, labelX + labelWidth / 2, labelY + labelSize * 1.15, labelSize, {
    anchor: 'middle',
    bold: true,
    color: '#ffffff',
  });

  const nx = map.x + map.w - 26 * u;
  const ny = map.y + 30 * u;
  const arrow: [number, number][] = [
    [nx, ny - 16 * u],
    [nx + 7 * u, ny + 8 * u],
    [nx, ny + 3 * u],
    [nx - 7 * u, ny + 8 * u],
  ];
  shapes.push({ type: 'circle', x: nx, y: ny, r: 20 * u, fill: '#ffffff', stroke: '#d5d9de' });
  shapes.push({
    type: 'path',
    rings: [arrow.map((point) => rotate(point, nx, ny, -options.headingDeg))],
    closed: true,
    fill: INK,
  });
  const [lx, ly] = rotate([nx, ny - 26 * u], nx, ny, -options.headingDeg);
  text(options.texts.north, lx, ly + 4 * u, 10 * u, { anchor: 'middle', bold: true });

  const legendY = map.y + map.h + 18 * u;
  const presentKinds = LEGEND_KINDS.filter((kind) =>
    features.features.some((f) => f.properties.kind === kind),
  );
  let legendX = margin;
  text(options.texts.legend, legendX, legendY + 3 * u, 9 * u, { bold: true });
  legendX += textWidth(options.texts.legend, 9 * u, true) + 12 * u;
  for (const kind of presentKinds) {
    const label = options.kindLabels[kind] ?? kind;
    if (kind === 'exit' || kind === 'facility') {
      shapes.push({
        type: 'circle',
        x: legendX + 5 * u,
        y: legendY,
        r: 4 * u,
        fill: kind === 'exit' ? '#1b7f4b' : '#2f6fa7',
      });
    } else {
      shapes.push({
        type: 'path',
        rings: [
          [
            [legendX, legendY - 5 * u],
            [legendX + 12 * u, legendY - 5 * u],
            [legendX + 12 * u, legendY + 5 * u],
            [legendX, legendY + 5 * u],
          ],
        ],
        closed: true,
        fill: kind === 'corridor' ? '#eceeea' : kind === 'unit' ? '#ffffff' : '#e3e7ee',
        stroke: '#8a929b',
        width: 0.6,
      });
    }
    text(label, legendX + 16 * u, legendY + 3 * u, 9 * u);
    legendX += 16 * u + textWidth(label, 9 * u) + 14 * u;
  }

  const bottomY = legendY + 22 * u;
  const qrSide = Math.min(width * 0.36, height - bottomY - margin - 40 * u);
  const qrX = width - margin - qrSide;
  shapes.push(...qrShapes(options.qr, qrX, bottomY, qrSide));
  options.texts.scan.forEach((line, index) => {
    text(line, qrX + qrSide / 2, bottomY + qrSide + (14 + index * 14) * u, 12 * u, {
      anchor: 'middle',
      bold: index === 0,
    });
  });
  const shortUrl = options.url.replace(/^https?:\/\//, '');
  const urlSize = Math.min(7 * u, qrSide / Math.max(textWidth(shortUrl, 1), 1));
  text(
    shortUrl,
    qrX + qrSide / 2,
    bottomY + qrSide + (18 + options.texts.scan.length * 14) * u,
    urlSize,
    { anchor: 'middle', color: MUTED },
  );

  const listWidth = qrX - margin - 20 * u;
  text(options.texts.locations, margin, bottomY + 12 * u, 13 * u, { bold: true });
  const lineHeight = 15 * u;
  const rows = Math.max(1, Math.floor((height - margin - bottomY - 30 * u) / lineHeight));
  const columns = options.locations.length > rows ? 2 : 1;
  const columnWidth = listWidth / columns;
  options.locations.slice(0, rows * columns).forEach((name, index) => {
    const column = Math.floor(index / rows);
    const row = index % rows;
    const x = margin + column * columnWidth;
    const y = bottomY + 34 * u + row * lineHeight;
    shapes.push({ type: 'circle', x: x + 3 * u, y: y - 3.5 * u, r: 2 * u, fill: accent });
    text(fitText(name, 10.5 * u, columnWidth - 16 * u), x + 10 * u, y, 10.5 * u);
  });

  return {
    width,
    height,
    title: `${options.texts.here} — ${options.place}`,
    shapes,
    metresPerPoint: 1 / floor.scale,
  };
}

export interface StickerItem {
  name: string;
  qr: QrMatrix;
}

export function buildStickerSheets(
  items: readonly StickerItem[],
  options: { caption: string; venueName: string; sizeMm?: number },
): PrintLayout[] {
  const [width, height] = paperPoints('A4', 'portrait');
  const mm = 72 / 25.4;
  const size = (options.sizeMm ?? 50) * mm;
  const gap = 6 * mm;
  const columns = Math.max(1, Math.floor((width - 20 * mm + gap) / (size + gap)));
  const rows = Math.max(1, Math.floor((height - 20 * mm + gap) / (size + gap)));
  const left = (width - (columns * size + (columns - 1) * gap)) / 2;
  const top = (height - (rows * size + (rows - 1) * gap)) / 2;
  const perPage = columns * rows;
  const pages: PrintLayout[] = [];
  for (let start = 0; start < items.length; start += perPage) {
    const shapes: PrintShape[] = [];
    items.slice(start, start + perPage).forEach((item, index) => {
      const x = left + (index % columns) * (size + gap);
      const y = top + Math.floor(index / columns) * (size + gap);
      shapes.push({
        type: 'path',
        rings: [
          [
            [x, y],
            [x + size, y],
            [x + size, y + size],
            [x, y + size],
          ],
        ],
        closed: true,
        fill: '#ffffff',
        stroke: '#c4c9cf',
        width: 0.5,
      });
      const qrSide = size * 0.66;
      shapes.push(...qrShapes(item.qr, x + (size - qrSide) / 2, y + size * 0.04, qrSide));
      const nameSize = Math.min(9, size / 15);
      shapes.push({
        type: 'text',
        x: x + size / 2,
        y: y + size * 0.04 + qrSide + nameSize + 2,
        size: nameSize,
        text: fitText(item.name, nameSize, size - 8, true),
        anchor: 'middle',
        bold: true,
        color: INK,
      });
      shapes.push({
        type: 'text',
        x: x + size / 2,
        y: y + size - size * 0.06,
        size: nameSize * 0.75,
        text: fitText(options.caption, nameSize * 0.75, size - 8),
        anchor: 'middle',
        color: MUTED,
      });
    });
    pages.push({
      width,
      height,
      title: `${options.venueName} — QR`,
      shapes,
      metresPerPoint: 0,
    });
  }
  return pages;
}
