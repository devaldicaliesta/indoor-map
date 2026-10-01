# @indoor/routing

Lihat `docs/03-arsitektur.md` → "Tanggung jawab tiap paket".

**Tanggung jawab:** Pembangun graf dari snapshot, A*, aturan konektor/aksesibel/penutupan, generator instruksi.

**Tidak boleh berisi:** React, Supabase, MapLibre. Hanya boleh bergantung pada `@indoor/domain`.

Paket ini diekspor langsung dari sumber TypeScript (`exports` → `src/index.ts`), sehingga app memakainya tanpa build terpisah.

## Rute dan instruksi

```ts
const graph = buildGraph(snapshot.graph, { floors: snapshot.floors, features: snapshot.features.features });
const route = findRoute(graph, from, to, { accessible, closures, now: Date.now() });
if (route.ok) {
  const steps = routeSteps(route, snapshot.floors);
  const texts = steps.map((step) =>
    instructionText(step, {
      templates: snapshot.instructionTemplates,
      language: 'id',
      floors: snapshot.floors,
      buildings: snapshot.buildings,
      origin: 'Lobi Utama',
      destination: 'Radiologi',
    }),
  );
}
```

- `routeSteps` tidak bergantung bahasa: `start`, `straight` (ruas yang berbeda arah < 15° digabung), `slight_left`/`slight_right` (15–30°), `turn_left`/`turn_right` (> 30°), naik/turun lift/eskalator/tangga menurut level lantai, `exit_building`/`enter_building` dari pintu gedung, lalu `arrive`. Simpangan gambar jalur < 1 m tidak dihitung sebagai belokan.
- Setiap langkah membawa `floorId` (untuk konektor dan pintu gedung: lantai tujuan), `buildingId`, `coordinates` untuk disorot di peta, dan `distanceM` (hanya langkah lurus).
- `instructionText` mengisi `{origin}`, `{destination}`, `{floor}`, `{building}`, dan `{distance}` (hanya aksi `straight`, kelipatan 5 m terdekat, minimal 5 m). Teks yang kosong di satu bahasa memakai bahasa lain; placeholder lain dibiarkan apa adanya.
