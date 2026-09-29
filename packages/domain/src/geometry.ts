import { z } from 'zod';

/** Posisi GeoJSON `[bujur, lintang]` dalam WGS84 (EPSG:4326). */
export const PositionSchema = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

const LinearRingSchema = z
  .array(PositionSchema)
  .min(4)
  .refine(
    (ring) => {
      const first = ring[0];
      const last = ring[ring.length - 1];
      return (
        first !== undefined && last !== undefined && first[0] === last[0] && first[1] === last[1]
      );
    },
    { message: 'Cincin poligon harus tertutup (titik awal sama dengan titik akhir)' },
  );

const PolygonCoordinatesSchema = z.array(LinearRingSchema).min(1);

export const PointSchema = z.object({ type: z.literal('Point'), coordinates: PositionSchema });
export const LineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(PositionSchema).min(2),
});
export const PolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: PolygonCoordinatesSchema,
});
export const MultiPolygonSchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(PolygonCoordinatesSchema).min(1),
});

export const GeometrySchema = z.discriminatedUnion('type', [
  PointSchema,
  LineStringSchema,
  PolygonSchema,
  MultiPolygonSchema,
]);

export type Position = z.infer<typeof PositionSchema>;
export type Point = z.infer<typeof PointSchema>;
export type LineString = z.infer<typeof LineStringSchema>;
export type Polygon = z.infer<typeof PolygonSchema>;
export type MultiPolygon = z.infer<typeof MultiPolygonSchema>;
export type Geometry = z.infer<typeof GeometrySchema>;
