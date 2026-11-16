import { type FeatureKind, labelPoint } from '@indoor/domain';
import type { Position } from 'geojson';
import { DEFAULT_FILL, DEFAULT_OUTLINE, POINT_COLOR, POINT_STYLE, VACANT_UNIT } from './defaults';
import type { FloorFeatureCollection } from './map';
import type { MapDisplay } from './style';

export type PaperSize = 'A3' | 'A4';
export type PaperOrientation = 'landscape' | 'portrait';

const PAPER_MM: Record<PaperSize, readonly [number, number]> = { A3: [420, 297], A4: [297, 210] };
const PT_PER_MM = 72 / 25.4;
const EARTH_M_PER_DEG = 111_320;

export interface PrintOptions {
  title: string;
  subtitle?: string;
  footer?: string;
  paper: PaperSize;
  orientation: PaperOrientation;
  kindLabels: Partial<Record<FeatureKind, string>>;
  legendTitle: string;
  northLabel: string;
  colors?: MapDisplay['colors'];
}

export type PrintColor = string;
export type PrintShape =
  | {
      type: 'path';
      rings: [number, number][][];
      closed: boolean;
      fill?: PrintColor;
      stroke?: PrintColor;
      width?: number;
    }
  | { type: 'circle'; x: number; y: number; r: number; fill: PrintColor; stroke?: PrintColor }
  | {
      type: 'text';
      x: number;
      y: number;
      size: number;
      text: string;
      anchor: 'start' | 'middle' | 'end';
      bold?: boolean;
      color: PrintColor;
    };

export interface PrintLayout {
  width: number;
  height: number;
  title: string;
  shapes: PrintShape[];
  metresPerPoint: number;
}

const INK = '#1f2328';
const MUTED = '#545b64';
const LINE = '#8a929b';
const EXIT_COLOR = POINT_STYLE.exit?.color ?? '#1b7f4b';
const FACILITY_COLOR = '#2f6fa7';

const AREA_ORDER: FeatureKind[] = [
  'outdoor_area',
  'non_walkable',
  'corridor',
  'unit',
  'elevator',
  'escalator',
  'stairs',
];
const POINT_ORDER: FeatureKind[] = ['door', 'exit', 'facility', 'landmark'];
const LEGEND_ORDER: FeatureKind[] = [...AREA_ORDER, 'wall', ...POINT_ORDER];

export function textWidth(text: string, size: number, bold = false): number {
  let units = 0;
  for (const char of text) {
    if (char === ' ') units += 0.28;
    else if (/[il.,:;'|!]/.test(char)) units += 0.25;
    else if (/[mwMW]/.test(char)) units += 0.85;
    else if (/[A-Z0-9]/.test(char)) units += 0.66;
    else units += 0.54;
  }
  return units * size * (bold ? 1.06 : 1);
}

export function paperPoints(paper: PaperSize, orientation: PaperOrientation): [number, number] {
  const [long, short] = PAPER_MM[paper];
  const [w, h] = orientation === 'landscape' ? [long, short] : [short, long];
  return [w * PT_PER_MM, h * PT_PER_MM];
}

function niceLength(target: number): number {
  const power = 10 ** Math.floor(Math.log10(target));
  const steps = [1, 2, 5, 10];
  let best = power;
  for (const step of steps) if (step * power <= target) best = step * power;
  return best;
}

function areaFill(kind: FeatureKind, vacant: boolean, colors: MapDisplay['colors']): string {
  if (kind === 'unit' && vacant) return VACANT_UNIT.fill;
  return colors?.[kind] ?? DEFAULT_FILL[kind] ?? '#eceeea';
}

function areaStroke(kind: FeatureKind, vacant: boolean): string | undefined {
  if (kind === 'unit' && vacant) return VACANT_UNIT.outline;
  return DEFAULT_OUTLINE[kind];
}

function pointFill(kind: FeatureKind, colors: MapDisplay['colors']): string {
  if (kind === 'exit') return colors?.exit ?? EXIT_COLOR;
  if (kind === 'facility') return FACILITY_COLOR;
  return colors?.[kind] ?? POINT_STYLE[kind]?.color ?? POINT_COLOR;
}

function polygonsOf(geometry: FloorFeatureCollection['features'][number]['geometry']) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function linesOf(geometry: FloorFeatureCollection['features'][number]['geometry']) {
  if (geometry.type === 'LineString') return [geometry.coordinates];
  if (geometry.type === 'MultiLineString') return geometry.coordinates;
  if (geometry.type === 'Polygon') return geometry.coordinates;
  return [];
}

function visitPositions(value: unknown, visit: (p: Position) => void) {
  if (Array.isArray(value) && typeof value[0] === 'number') visit(value as Position);
  else if (Array.isArray(value)) for (const item of value) visitPositions(item, visit);
}

export function buildPrintLayout(
  features: FloorFeatureCollection,
  options: PrintOptions,
): PrintLayout {
  const [width, height] = paperPoints(options.paper, options.orientation);
  const margin = 36;
  const legendWidth = options.orientation === 'landscape' ? 190 : 0;
  const headerHeight = options.subtitle ? 74 : 56;
  const legendRows = LEGEND_ORDER.filter((kind) =>
    features.features.some((f) => f.properties.kind === kind),
  );
  const bottomLegend = legendWidth === 0 ? Math.ceil(legendRows.length / 3) * 20 + 40 : 0;
  const footerHeight = 24;
  const map = {
    x: margin,
    y: margin + headerHeight,
    w: width - margin * 2 - legendWidth - (legendWidth ? 18 : 0),
    h: height - margin * 2 - headerHeight - footerHeight - bottomLegend,
  };
  const shapes: PrintShape[] = [];

  shapes.push({
    type: 'text',
    x: margin,
    y: margin + 24,
    size: 24,
    text: options.title,
    anchor: 'start',
    bold: true,
    color: INK,
  });
  if (options.subtitle) {
    shapes.push({
      type: 'text',
      x: margin,
      y: margin + 46,
      size: 13,
      text: options.subtitle,
      anchor: 'start',
      color: MUTED,
    });
  }
  shapes.push({
    type: 'path',
    rings: [
      [
        [margin, margin + headerHeight - 10],
        [width - margin, margin + headerHeight - 10],
      ],
    ],
    closed: false,
    stroke: LINE,
    width: 0.75,
  });

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const feature of features.features) {
    if (!('coordinates' in feature.geometry)) continue;
    visitPositions(feature.geometry.coordinates, ([x = 0, y = 0]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  }
  const hasData = Number.isFinite(minX);
  const lat0 = hasData ? (minY + maxY) / 2 : 0;
  const lng0 = hasData ? (minX + maxX) / 2 : 0;
  const kx = EARTH_M_PER_DEG * Math.cos((lat0 * Math.PI) / 180);
  const ky = EARTH_M_PER_DEG;
  const spanX = Math.max((maxX - minX) * kx, 1);
  const spanY = Math.max((maxY - minY) * ky, 1);
  const scale = hasData ? Math.min(map.w / spanX, map.h / spanY) * 0.94 : 1;
  const cx = map.x + map.w / 2;
  const cy = map.y + map.h / 2;
  const project = ([lng = 0, lat = 0]: Position): [number, number] => [
    cx + (lng - lng0) * kx * scale,
    cy - (lat - lat0) * ky * scale,
  ];

  const byKind = (kind: FeatureKind) => features.features.filter((f) => f.properties.kind === kind);

  for (const kind of AREA_ORDER) {
    for (const feature of byKind(kind)) {
      const vacant = feature.properties.unitStatus === 'vacant';
      const stroke = areaStroke(kind, vacant);
      for (const polygon of polygonsOf(feature.geometry)) {
        shapes.push({
          type: 'path',
          rings: polygon.map((ring) => ring.map(project)),
          closed: true,
          fill: areaFill(kind, vacant, options.colors),
          ...(stroke ? { stroke, width: 0.6 } : {}),
        });
      }
    }
  }
  const wallWidth = Math.max(1, 0.2 * scale);
  for (const feature of byKind('wall')) {
    shapes.push({
      type: 'path',
      rings: linesOf(feature.geometry).map((line) => line.map(project)),
      closed: false,
      stroke: options.colors?.wall ?? DEFAULT_OUTLINE.wall ?? LINE,
      width: wallWidth,
    });
  }
  for (const kind of POINT_ORDER) {
    for (const feature of byKind(kind)) {
      if (feature.geometry.type !== 'Point') continue;
      const [x, y] = project(feature.geometry.coordinates);
      const r = kind === 'door' ? 2 : kind === 'exit' ? 4 : 3.5;
      shapes.push({
        type: 'circle',
        x,
        y,
        r,
        fill: pointFill(kind, options.colors),
        stroke: '#ffffff',
      });
    }
  }

  const labelSize = 8;
  for (const feature of features.features) {
    const p = feature.properties;
    if (!(['unit', 'elevator', 'escalator', 'stairs'] as FeatureKind[]).includes(p.kind)) continue;
    const text = p.name ?? p.unitCode;
    if (!text) continue;
    const polygons = polygonsOf(feature.geometry);
    const largest = polygons[0];
    if (!largest) continue;
    const [x, y] = project(labelPoint(largest as [number, number][][]));
    const projected = (largest[0] ?? []).map(project);
    const xs = projected.map(([px]) => px);
    const roomWidth = Math.max(...xs) - Math.min(...xs);
    const size = Math.min(labelSize, (roomWidth * 0.9) / Math.max(textWidth(text, 1), 1));
    if (size < 6) continue;
    shapes.push({ type: 'text', x, y: y + size * 0.35, size, text, anchor: 'middle', color: INK });
  }

  const arrowX = map.x + map.w - 22;
  const arrowY = map.y + 14;
  shapes.push({
    type: 'path',
    rings: [
      [
        [arrowX, arrowY],
        [arrowX + 9, arrowY + 30],
        [arrowX, arrowY + 23],
        [arrowX - 9, arrowY + 30],
      ],
    ],
    closed: true,
    fill: INK,
  });
  shapes.push({
    type: 'text',
    x: arrowX,
    y: arrowY + 46,
    size: 12,
    text: options.northLabel,
    anchor: 'middle',
    bold: true,
    color: INK,
  });

  const metresPerPoint = 1 / scale;
  if (hasData) {
    const barMetres = niceLength((map.w / 5) * metresPerPoint);
    const barLength = barMetres * scale;
    const barX = map.x;
    const barY = map.y + map.h - 6;
    shapes.push({
      type: 'path',
      rings: [
        [
          [barX, barY - 5],
          [barX, barY],
          [barX + barLength, barY],
          [barX + barLength, barY - 5],
        ],
      ],
      closed: false,
      stroke: INK,
      width: 1.2,
    });
    shapes.push({
      type: 'text',
      x: barX + barLength + 6,
      y: barY + 1,
      size: 9,
      text: `${barMetres.toLocaleString('id-ID')} m`,
      anchor: 'start',
      color: INK,
    });
  }

  const legendItems = legendRows.map((kind) => ({
    kind,
    label: options.kindLabels[kind] ?? kind,
  }));
  const swatch = (kind: FeatureKind, x: number, y: number) => {
    if (kind === 'wall') {
      shapes.push({
        type: 'path',
        rings: [
          [
            [x, y + 6],
            [x + 18, y + 6],
          ],
        ],
        closed: false,
        stroke: options.colors?.wall ?? DEFAULT_OUTLINE.wall ?? LINE,
        width: 2.5,
      });
    } else if (POINT_ORDER.includes(kind)) {
      shapes.push({
        type: 'circle',
        x: x + 9,
        y: y + 6,
        r: 4,
        fill: pointFill(kind, options.colors),
        stroke: '#ffffff',
      });
    } else {
      shapes.push({
        type: 'path',
        rings: [
          [
            [x, y],
            [x + 18, y],
            [x + 18, y + 12],
            [x, y + 12],
          ],
        ],
        closed: true,
        fill: areaFill(kind, false, options.colors),
        stroke: areaStroke(kind, false) ?? LINE,
        width: 0.6,
      });
    }
  };
  if (legendWidth) {
    const lx = width - margin - legendWidth;
    let ly = map.y + 4;
    shapes.push({
      type: 'text',
      x: lx,
      y: ly + 10,
      size: 12,
      text: options.legendTitle,
      anchor: 'start',
      bold: true,
      color: INK,
    });
    ly += 24;
    for (const item of legendItems) {
      swatch(item.kind, lx, ly);
      shapes.push({
        type: 'text',
        x: lx + 26,
        y: ly + 10,
        size: 10,
        text: item.label,
        anchor: 'start',
        color: INK,
      });
      ly += 20;
    }
  } else {
    const ly0 = map.y + map.h + 14;
    shapes.push({
      type: 'text',
      x: margin,
      y: ly0 + 10,
      size: 12,
      text: options.legendTitle,
      anchor: 'start',
      bold: true,
      color: INK,
    });
    const column = (width - margin * 2) / 3;
    legendItems.forEach((item, index) => {
      const x = margin + (index % 3) * column;
      const y = ly0 + 22 + Math.floor(index / 3) * 20;
      swatch(item.kind, x, y);
      shapes.push({
        type: 'text',
        x: x + 26,
        y: y + 10,
        size: 10,
        text: item.label,
        anchor: 'start',
        color: INK,
      });
    });
  }

  if (options.footer) {
    shapes.push({
      type: 'text',
      x: margin,
      y: height - margin + 4,
      size: 8,
      text: options.footer,
      anchor: 'start',
      color: MUTED,
    });
  }

  return { width, height, title: options.title, shapes, metresPerPoint };
}

const round = (value: number) => Number(value.toFixed(2));

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function svgPath(rings: [number, number][][], closed: boolean): string {
  return rings
    .map(
      (ring) =>
        ring.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`).join('') +
        (closed ? 'Z' : ''),
    )
    .join('');
}

export function layoutToSvg(layout: PrintLayout): string {
  const body = layout.shapes.map((shape) => {
    if (shape.type === 'path') {
      return `<path d="${svgPath(shape.rings, shape.closed)}" fill="${shape.fill ?? 'none'}"${
        shape.closed && shape.rings.length > 1 ? ' fill-rule="evenodd"' : ''
      }${
        shape.stroke
          ? ` stroke="${shape.stroke}" stroke-width="${round(shape.width ?? 1)}" stroke-linejoin="round" stroke-linecap="round"`
          : ''
      }/>`;
    }
    if (shape.type === 'circle') {
      return `<circle cx="${round(shape.x)}" cy="${round(shape.y)}" r="${shape.r}" fill="${shape.fill}"${
        shape.stroke ? ` stroke="${shape.stroke}" stroke-width="0.8"` : ''
      }/>`;
    }
    return `<text x="${round(shape.x)}" y="${round(shape.y)}" font-size="${round(shape.size)}" text-anchor="${shape.anchor}" fill="${shape.color}"${
      shape.bold ? ' font-weight="700"' : ''
    }>${escapeXml(shape.text)}</text>`;
  });
  const w = round(layout.width);
  const h = round(layout.height);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${round(w / PT_PER_MM)}mm" height="${round(h / PT_PER_MM)}mm" viewBox="0 0 ${w} ${h}" font-family="Helvetica, Arial, sans-serif">`,
    `<title>${escapeXml(layout.title)}</title>`,
    `<rect width="${w}" height="${h}" fill="#ffffff"/>`,
    ...body,
    '</svg>',
    '',
  ].join('\n');
}

function rgb(hex: string): string {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value;
  const n = Number.parseInt(full.slice(0, 6), 16);
  const parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => round(c / 255));
  return parts.join(' ');
}

const WIN_ANSI_EXTRA: Record<string, number> = {
  '–': 0x96,
  '—': 0x97,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '…': 0x85,
  '€': 0x80,
};

function pdfString(text: string): string {
  let out = '';
  for (const char of text) {
    const code = WIN_ANSI_EXTRA[char] ?? char.codePointAt(0) ?? 63;
    const byte = code > 255 ? 63 : code;
    const c = String.fromCharCode(byte);
    out += c === '(' || c === ')' || c === '\\' ? `\\${c}` : c;
  }
  return `(${out})`;
}

export function layoutToPdf(layout: PrintLayout, producer = 'PanduArah'): Uint8Array {
  const h = layout.height;
  const ops: string[] = ['1 J 1 j'];
  for (const shape of layout.shapes) {
    if (shape.type === 'path') {
      const path = shape.rings
        .map(
          (ring) =>
            ring
              .map(([x, y], i) => `${round(x)} ${round(h - y)} ${i === 0 ? 'm' : 'l'}`)
              .join(' ') + (shape.closed ? ' h' : ''),
        )
        .join(' ');
      const paint =
        shape.fill && shape.stroke
          ? shape.rings.length > 1
            ? 'B*'
            : 'B'
          : shape.fill
            ? shape.rings.length > 1
              ? 'f*'
              : 'f'
            : 'S';
      ops.push(
        [
          shape.fill ? `${rgb(shape.fill)} rg` : '',
          shape.stroke ? `${rgb(shape.stroke)} RG ${round(shape.width ?? 1)} w` : '',
          path,
          paint,
        ]
          .filter(Boolean)
          .join(' '),
      );
    } else if (shape.type === 'circle') {
      const k = 0.5523 * shape.r;
      const x = shape.x;
      const y = h - shape.y;
      const r = shape.r;
      const curve = [
        `${round(x + r)} ${round(y)} m`,
        `${round(x + r)} ${round(y + k)} ${round(x + k)} ${round(y + r)} ${round(x)} ${round(y + r)} c`,
        `${round(x - k)} ${round(y + r)} ${round(x - r)} ${round(y + k)} ${round(x - r)} ${round(y)} c`,
        `${round(x - r)} ${round(y - k)} ${round(x - k)} ${round(y - r)} ${round(x)} ${round(y - r)} c`,
        `${round(x + k)} ${round(y - r)} ${round(x + r)} ${round(y - k)} ${round(x + r)} ${round(y)} c`,
      ].join(' ');
      ops.push(
        `${rgb(shape.fill)} rg ${shape.stroke ? `${rgb(shape.stroke)} RG 0.8 w ` : ''}${curve} ${
          shape.stroke ? 'B' : 'f'
        }`,
      );
    } else {
      const width = textWidth(shape.text, shape.size, shape.bold);
      const x =
        shape.anchor === 'middle'
          ? shape.x - width / 2
          : shape.anchor === 'end'
            ? shape.x - width
            : shape.x;
      ops.push(
        `BT /${shape.bold ? 'F2' : 'F1'} ${round(shape.size)} Tf ${rgb(shape.color)} rg ${round(x)} ${round(
          h - shape.y,
        )} Td ${pdfString(shape.text)} Tj ET`,
      );
    }
  }
  const content = ops.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${round(layout.width)} ${round(h)}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Title ${pdfString(layout.title)} /Producer ${pdfString(producer)} >>`,
  ];
  let pdf = '%PDF-1.4\n%âãÏÓ\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}
