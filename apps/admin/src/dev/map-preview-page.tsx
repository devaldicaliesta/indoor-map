import { MapPreview } from './map-preview';

export function MapPreviewPage() {
  return (
    <MapPreview
      labels={{
        zoomIn: 'Perbesar',
        zoomOut: 'Perkecil',
        resetNorth: 'Arahkan ke utara',
        viewMode: 'Mode tampilan',
        mode2d: '2D',
        mode3d: '3D',
        floor: 'Ganti lantai',
        synthetic: '1.000 fitur',
        floorSwitcher: 'Lantai',
      }}
    />
  );
}
