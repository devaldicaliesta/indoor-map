import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// MapLibre 6 mencari worker di sebelah file modulnya sendiri; setelah di-bundle Vite file itu
// tidak ikut, sehingga peta build produksi kosong. Worker di-bundle sendiri lewat `?worker&url`.
// Diimpor sekali di entry app, sebelum peta pertama dibuat.
setWorkerUrl(workerUrl);
