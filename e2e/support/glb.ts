const pad4 = (length: number) => (4 - (length % 4)) % 4;

export function pyramidGlb(height = 3): Buffer {
  const apex = [0, height, 0];
  const base = [
    [-1, 0, -1],
    [1, 0, -1],
    [1, 0, 1],
    [-1, 0, 1],
  ];
  const triangles: number[][][] = [];
  for (let i = 0; i < 4; i++) {
    const a = base[i] as number[];
    const b = base[(i + 1) % 4] as number[];
    triangles.push([a, apex, b]);
  }
  triangles.push(
    [base[0], base[1], base[2]] as number[][],
    [base[0], base[2], base[3]] as number[][],
  );
  const positions = new Float32Array(triangles.flat(2));
  const bin = Buffer.from(positions.buffer);
  const json = {
    asset: { version: '2.0', generator: 'PanduArah E2E' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'Piramida' }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [
      {
        doubleSided: true,
        pbrMetallicRoughness: { baseColorFactor: [0.85, 0.3, 0.2, 1], metallicFactor: 0 },
      },
    ],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: bin.length, target: 34962 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: 'VEC3',
        min: [-1, 0, -1],
        max: [1, height, 1],
      },
    ],
  };
  const jsonText = JSON.stringify(json);
  const jsonChunk = Buffer.concat([
    Buffer.from(jsonText),
    Buffer.alloc(pad4(jsonText.length), 0x20),
  ]);
  const binChunk = Buffer.concat([bin, Buffer.alloc(pad4(bin.length))]);
  const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const chunkHeader = (length: number, type: number) => {
    const out = Buffer.alloc(8);
    out.writeUInt32LE(length, 0);
    out.writeUInt32LE(type, 4);
    return out;
  };
  return Buffer.concat([
    header,
    chunkHeader(jsonChunk.length, 0x4e4f534a),
    jsonChunk,
    chunkHeader(binChunk.length, 0x004e4942),
    binChunk,
  ]);
}
