import type { LibraryModel } from '@indoor/domain';
import {
  BoxGeometry,
  type BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshLambertMaterial,
} from 'three';

const materials = new Map<string, MeshLambertMaterial>();

function material(color: string): MeshLambertMaterial {
  let found = materials.get(color);
  if (!found) {
    found = new MeshLambertMaterial({ color, flatShading: true });
    materials.set(color, found);
  }
  return found;
}

const COLORS = {
  concrete: '#b9bec4',
  steel: '#8a939c',
  dark: '#3d434a',
  glass: '#9cc3d9',
  wood: '#a87a4f',
  trunk: '#7a5634',
  leaf: '#4f8a3c',
  leafLight: '#6aa84f',
  terracotta: '#c0673f',
  taxi: '#f2c230',
  car: '#3f6fb5',
  tire: '#25282c',
  sign: '#2f6fa7',
  white: '#f4f5f6',
  awning: '#d0503c',
} as const;

function part(
  geometry: BufferGeometry,
  color: string,
  [x, y, z]: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
): Mesh {
  const mesh = new Mesh(geometry, material(color));
  mesh.position.set(x, y, z);
  mesh.rotation.set(...rotation);
  return mesh;
}

const box = (w: number, h: number, d: number) => new BoxGeometry(w, h, d);
const cylinder = (top: number, bottom: number, h: number, segments = 8) =>
  new CylinderGeometry(top, bottom, h, segments);

function stairs(): Mesh[] {
  const steps: Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const height = 0.18 * (i + 1);
    steps.push(part(box(1.2, height, 0.3), COLORS.concrete, [0, height / 2, 0.75 - i * 0.3]));
  }
  return steps;
}

function elevator(): Mesh[] {
  return [
    part(box(2, 2.6, 2), COLORS.steel, [0, 1.3, 0]),
    part(box(1, 2.1, 0.05), COLORS.dark, [0, 1.05, -1.01]),
    part(box(0.02, 2.1, 0.06), COLORS.white, [0, 1.05, -1.02]),
  ];
}

function escalator(): Mesh[] {
  const tilt = Math.atan2(3, 5);
  const length = Math.hypot(3, 5);
  return [
    part(box(1, 0.25, length), COLORS.steel, [0, 1.62, 0], [tilt, 0, 0]),
    part(box(0.08, 0.9, length), COLORS.glass, [-0.54, 2.07, 0], [tilt, 0, 0]),
    part(box(0.08, 0.9, length), COLORS.glass, [0.54, 2.07, 0], [tilt, 0, 0]),
    part(box(1.2, 0.1, 1), COLORS.dark, [0, 0.05, 2.9]),
    part(box(1.2, 0.1, 1), COLORS.dark, [0, 3.05, -2.9]),
  ];
}

function vehicle(body: string, extra: Mesh[] = []): Mesh[] {
  const wheels = [-1.3, 1.3].flatMap((z) =>
    [-0.85, 0.85].map((x) =>
      part(cylinder(0.33, 0.33, 0.25, 10), COLORS.tire, [x, 0.33, z], [0, 0, Math.PI / 2]),
    ),
  );
  return [
    part(box(1.8, 0.7, 4.4), body, [0, 0.65, 0]),
    part(box(1.6, 0.6, 2.2), body, [0, 1.3, 0.2]),
    part(box(1.62, 0.45, 1.8), COLORS.glass, [0, 1.3, 0.2]),
    ...wheels,
    ...extra,
  ];
}

function busStop(): Mesh[] {
  return [
    part(box(3.2, 0.1, 1.6), COLORS.steel, [0, 2.6, 0]),
    part(cylinder(0.05, 0.05, 2.6), COLORS.dark, [-1.5, 1.3, 0.6]),
    part(cylinder(0.05, 0.05, 2.6), COLORS.dark, [1.5, 1.3, 0.6]),
    part(box(3, 1.8, 0.05), COLORS.glass, [0, 1.4, 0.7]),
    part(box(2.4, 0.08, 0.45), COLORS.wood, [0, 0.45, 0.4]),
    part(box(0.6, 0.6, 0.05), COLORS.sign, [1.9, 2.4, -0.5]),
    part(cylinder(0.04, 0.04, 2.4), COLORS.dark, [1.9, 1.2, -0.5]),
  ];
}

function tree(): Mesh[] {
  return [
    part(cylinder(0.12, 0.18, 2, 6), COLORS.trunk, [0, 1, 0]),
    part(new IcosahedronGeometry(1.3, 0), COLORS.leaf, [0, 3, 0]),
    part(new IcosahedronGeometry(0.9, 0), COLORS.leafLight, [0.5, 3.7, 0.2]),
  ];
}

function plant(): Mesh[] {
  return [
    part(cylinder(0.28, 0.22, 0.45), COLORS.dark, [0, 0.22, 0]),
    part(new IcosahedronGeometry(0.45, 0), COLORS.leafLight, [0, 0.85, 0]),
  ];
}

function pot(): Mesh[] {
  return [
    part(cylinder(0.35, 0.25, 0.6), COLORS.terracotta, [0, 0.3, 0]),
    part(new ConeGeometry(0.3, 0.7, 6), COLORS.leaf, [0, 0.95, 0]),
  ];
}

function bench(): Mesh[] {
  return [
    part(box(1.6, 0.08, 0.45), COLORS.wood, [0, 0.45, 0]),
    part(box(1.6, 0.4, 0.06), COLORS.wood, [0, 0.75, 0.22]),
    part(box(0.08, 0.45, 0.4), COLORS.dark, [-0.7, 0.22, 0]),
    part(box(0.08, 0.45, 0.4), COLORS.dark, [0.7, 0.22, 0]),
  ];
}

function table(): Mesh[] {
  const legs = [-0.55, 0.55].flatMap((x) =>
    [-0.35, 0.35].map((z) => part(box(0.06, 0.72, 0.06), COLORS.dark, [x, 0.36, z])),
  );
  return [part(box(1.3, 0.06, 0.85), COLORS.wood, [0, 0.75, 0]), ...legs];
}

function kiosk(): Mesh[] {
  return [
    part(box(2.4, 1.1, 1.6), COLORS.white, [0, 0.55, 0]),
    part(box(2.5, 0.08, 1.7), COLORS.wood, [0, 1.14, 0]),
    part(cylinder(0.05, 0.05, 1.3), COLORS.dark, [-1.15, 1.8, -0.75]),
    part(cylinder(0.05, 0.05, 1.3), COLORS.dark, [1.15, 1.8, -0.75]),
    part(box(2.7, 0.08, 2), COLORS.awning, [0, 2.5, 0], [-0.12, 0, 0]),
  ];
}

function sign(): Mesh[] {
  return [
    part(cylinder(0.05, 0.05, 2.2), COLORS.dark, [0, 1.1, 0]),
    part(box(0.9, 0.6, 0.06), COLORS.sign, [0, 1.95, -0.05]),
    part(box(0.6, 0.12, 0.02), COLORS.white, [0, 1.95, -0.09]),
  ];
}

const BUILDERS: Record<LibraryModel, () => Mesh[]> = {
  stairs,
  elevator,
  escalator,
  taxi: () => vehicle(COLORS.taxi, [part(box(0.5, 0.18, 0.25), COLORS.white, [0, 1.7, 0.2])]),
  car: () => vehicle(COLORS.car),
  'bus-stop': busStop,
  tree,
  plant,
  pot,
  bench,
  table,
  kiosk,
  sign,
};

export function libraryModel(key: LibraryModel): Group {
  const group = new Group();
  group.name = key;
  for (const mesh of BUILDERS[key]()) group.add(mesh);
  return group;
}
