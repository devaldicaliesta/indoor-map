// Import worker Vite (`?worker&url`); map-core tidak memakai tipe `vite/client`.
declare module 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url' {
  const url: string;
  export default url;
}
