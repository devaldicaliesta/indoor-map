import { type LibraryModel, parseModelRef } from '@indoor/domain';
import {
  type CustomLayerInterface,
  type CustomRenderMethodInput,
  type Map as MapLibreMap,
  MercatorCoordinate,
} from 'maplibre-gl';
import {
  Camera,
  DirectionalLight,
  Group,
  HemisphereLight,
  Matrix4,
  type Object3D,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LABEL_LAYER_ID } from './layers/labels';
import {
  MODELS_LAYER_ID,
  type ModelsLayerController,
  type ModelUrl,
  type PlacedModel,
} from './models';
import { libraryModel } from './models-library';

const DEG = Math.PI / 180;

function placeModels(models: readonly PlacedModel[]) {
  const first = models[0];
  if (!first) return null;
  const origin = MercatorCoordinate.fromLngLat(first.lngLat, 0);
  const metre = origin.meterInMercatorCoordinateUnits();
  const transform = new Matrix4()
    .makeTranslation(origin.x, origin.y, origin.z)
    .scale(new Vector3(metre, -metre, metre))
    .multiply(new Matrix4().makeRotationX(Math.PI / 2));
  const offsets = models.map((model) => {
    const at = MercatorCoordinate.fromLngLat(model.lngLat, 0);
    return { east: (at.x - origin.x) / metre, south: (at.y - origin.y) / metre };
  });
  return { transform, offsets };
}

export function createModelsLayer(
  map: MapLibreMap,
  modelUrl: ModelUrl | undefined,
): ModelsLayerController {
  const scene = new Scene();
  const camera = new Camera();
  const root = new Group();
  scene.add(root);
  scene.add(new HemisphereLight('#ffffff', '#8a8f96', 2.2));
  const sun = new DirectionalLight('#ffffff', 1.6);
  sun.position.set(-40, 80, -30);
  scene.add(sun);

  const library = new Map<LibraryModel, Group>();
  const uploads = new Map<string, Promise<Object3D | null>>();
  const loader = new GLTFLoader();
  let transform = new Matrix4();
  let renderer: WebGLRenderer | null = null;
  let models: readonly PlacedModel[] = [];
  let generation = 0;

  const builtin = (key: LibraryModel): Object3D => {
    let template = library.get(key);
    if (!template) {
      template = libraryModel(key);
      library.set(key, template);
    }
    return template.clone();
  };

  const upload = (path: string): Promise<Object3D | null> => {
    let pending = uploads.get(path);
    if (!pending) {
      pending = modelUrl
        ? loader.loadAsync(modelUrl(path)).then(
            (gltf) => gltf.scene,
            () => null,
          )
        : Promise.resolve(null);
      uploads.set(path, pending);
    }
    return pending.then((template) => template?.clone() ?? null);
  };

  function report() {
    const shown = root.children.filter((holder) => holder.children.length > 0).length;
    map.getContainer().dataset.models = String(shown);
  }

  function rebuild() {
    const current = ++generation;
    root.clear();
    const placed = placeModels(models);
    if (!placed) {
      report();
      map.triggerRepaint();
      return;
    }
    transform = placed.transform;
    models.forEach((model, index) => {
      const offset = placed.offsets[index];
      if (!offset) return;
      const holder = new Group();
      holder.name = model.id;
      holder.position.set(offset.east, model.baseHeight, offset.south);
      holder.rotation.y = -model.rotation * DEG;
      holder.scale.setScalar(model.scale);
      root.add(holder);
      const ref = parseModelRef(model.model);
      if (ref?.kind === 'builtin') {
        holder.add(builtin(ref.key));
      } else if (ref?.kind === 'upload') {
        void upload(ref.path).then((object) => {
          if (object && current === generation) {
            holder.add(object);
            report();
            map.triggerRepaint();
          }
        });
      }
    });
    report();
    map.triggerRepaint();
  }

  const layer: CustomLayerInterface = {
    id: MODELS_LAYER_ID,
    type: 'custom',
    renderingMode: '3d',
    onAdd(_map, gl) {
      renderer = new WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false;
    },
    onRemove() {
      renderer?.dispose();
      renderer = null;
    },
    render(_gl, options: CustomRenderMethodInput) {
      if (!renderer || root.children.length === 0) return;
      camera.projectionMatrix = new Matrix4()
        .fromArray(options.defaultProjectionData.mainMatrix)
        .multiply(transform);
      renderer.resetState();
      renderer.clearDepth();
      renderer.render(scene, camera);
    },
  };

  const attached = () => map.getLayer(MODELS_LAYER_ID) !== undefined;

  return {
    setModels(next) {
      models = next;
      if (next.length > 0 && !attached()) {
        map.addLayer(layer, map.getLayer(LABEL_LAYER_ID) ? LABEL_LAYER_ID : undefined);
      }
      if (next.length === 0 && attached()) map.removeLayer(MODELS_LAYER_ID);
      rebuild();
    },
    remove() {
      if (attached()) map.removeLayer(MODELS_LAYER_ID);
      root.clear();
      generation++;
    },
  };
}
