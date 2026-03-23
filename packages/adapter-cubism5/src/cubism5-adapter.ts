import type {
  ICubismAdapter,
  CubismVersion,
  ModelSettings,
  InternalModel,
  InternalModelOptions,
  DrawableMesh,
  BlendMode,
} from '@live2d-loader/core';

/**
 * Global types for the Cubism 5 Core runtime.
 * These are injected into the global scope when the Core script loads.
 */
declare global {
  interface Window {
    Live2DCubismCore?: CubismCoreNamespace;
  }
}

interface CubismCoreNamespace {
  Version: { csmGetVersion(): number };
  Moc: { fromArrayBuffer(buf: ArrayBuffer): CubismMoc | null };
  Model: { fromMoc(moc: CubismMoc): CubismCoreModel | null };
}

interface CubismMoc {
  _ptr: number;
}

interface CubismCoreModel {
  parameters: {
    count: number;
    ids: string[];
    values: Float32Array;
    minimumValues: Float32Array;
    maximumValues: Float32Array;
    defaultValues: Float32Array;
  };
  parts: {
    count: number;
    ids: string[];
    opacities: Float32Array;
  };
  drawables: {
    count: number;
    ids: string[];
    textureIndices: Int32Array;
    renderOrders: Int32Array;
    vertexPositions: Float32Array[];
    vertexUvs: Float32Array[];
    indices: Uint16Array[];
    opacities: Float32Array;
    constantFlags: Uint8Array;
    dynamicFlags: Uint8Array;
    maskCounts: Int32Array;
    masks: Int32Array[];
  };
  update(): void;
  release(): void;
}

const _BLEND_NORMAL = 0;
const BLEND_ADDITIVE = 1 << 0;
const BLEND_MULTIPLICATIVE = 1 << 1;
const IS_VISIBLE = 1 << 0;
const _VISIBILITY_CHANGED = 1 << 0;
const _OPACITY_CHANGED = 1 << 1;
const _DRAW_ORDER_CHANGED = 1 << 2;
const _RENDER_ORDER_CHANGED = 1 << 3;
const _VERTEX_POSITIONS_CHANGED = 1 << 4;

export class Cubism5Adapter implements ICubismAdapter {
  readonly version: CubismVersion = 'cubism5';

  readonly defaultCorePath =
    'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js';

  isCoreLoaded(): boolean {
    return typeof window !== 'undefined' && !!window.Live2DCubismCore;
  }

  async loadCore(corePath?: string): Promise<void> {
    if (this.isCoreLoaded()) return;

    const url = corePath ?? this.defaultCorePath;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        if (this.isCoreLoaded()) {
          resolve();
        } else {
          reject(new Error('[Cubism5Adapter] Core script loaded but Live2DCubismCore not found in global scope.'));
        }
      };
      script.onerror = () => reject(new Error(`[Cubism5Adapter] Failed to load Cubism Core from: ${url}`));
      document.head.appendChild(script);
    });
  }

  canHandle(json: unknown): boolean {
    if (typeof json !== 'object' || json === null) return false;
    return 'FileReferences' in json;
  }

  async createModel(settings: ModelSettings, _options?: InternalModelOptions): Promise<InternalModel> {
    const core = window.Live2DCubismCore;
    if (!core) {
      throw new Error('[Cubism5Adapter] Cubism Core is not loaded.');
    }

    const mocResponse = await fetch(settings.moc);
    if (!mocResponse.ok) {
      throw new Error(`[Cubism5Adapter] Failed to fetch .moc3 file: ${settings.moc}`);
    }
    const mocBuffer = await mocResponse.arrayBuffer();

    const moc = core.Moc.fromArrayBuffer(mocBuffer);
    if (!moc) {
      throw new Error('[Cubism5Adapter] Failed to create Moc from buffer.');
    }

    const coreModel = core.Model.fromMoc(moc);
    if (!coreModel) {
      throw new Error('[Cubism5Adapter] Failed to create Model from Moc.');
    }

    const modelMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);

    return {
      id: '',
      version: 'cubism5',
      settings,
      coreModel,
      textures: [],
      modelMatrix,
      ready: false,
    };
  }

  updateModel(model: InternalModel, _deltaTime: number): void {
    const coreModel = model.coreModel as CubismCoreModel;
    coreModel.update();
  }

  getDrawables(model: InternalModel): DrawableMesh[] {
    const cm = model.coreModel as CubismCoreModel;
    const d = cm.drawables;
    const meshes: DrawableMesh[] = [];

    for (let i = 0; i < d.count; i++) {
      const constFlags = d.constantFlags[i]!;
      const dynFlags = d.dynamicFlags[i]!;

      let blendMode: BlendMode;
      if (constFlags & BLEND_ADDITIVE) {
        blendMode = 1; // Additive
      } else if (constFlags & BLEND_MULTIPLICATIVE) {
        blendMode = 2; // Multiplicative
      } else {
        blendMode = 0; // Normal
      }

      const maskIndices: number[] = [];
      if (d.maskCounts[i]! > 0 && d.masks[i]) {
        for (let m = 0; m < d.maskCounts[i]!; m++) {
          maskIndices.push(d.masks[i]![m]!);
        }
      }

      meshes.push({
        index: i,
        textureIndex: d.textureIndices[i]!,
        vertexPositions: d.vertexPositions[i]!,
        uvs: d.vertexUvs[i]!,
        indices: d.indices[i]!,
        opacity: d.opacities[i]!,
        blendMode,
        invertedMask: false,
        renderOrder: d.renderOrders[i]!,
        dynamicFlag: dynFlags !== 0,
        maskIndices,
        visible: (dynFlags & IS_VISIBLE) !== 0 || d.opacities[i]! > 0,
      });
    }

    meshes.sort((a, b) => a.renderOrder - b.renderOrder);
    return meshes;
  }

  hitTest(model: InternalModel, x: number, y: number): string | null {
    const settings = model.settings;
    if (!settings.hitAreas || settings.hitAreas.length === 0) return null;

    const cm = model.coreModel as CubismCoreModel;
    const d = cm.drawables;

    for (const area of settings.hitAreas) {
      const drawIndex = d.ids.indexOf(area.id);
      if (drawIndex < 0) continue;

      const verts = d.vertexPositions[drawIndex];
      if (!verts) continue;

      if (isPointInMesh(x, y, verts)) {
        return area.name;
      }
    }

    return null;
  }

  destroyModel(model: InternalModel): void {
    const coreModel = model.coreModel as CubismCoreModel;
    coreModel.release();
    model.coreModel = null;
    model.ready = false;
  }
}

function isPointInMesh(px: number, py: number, vertices: Float32Array): boolean {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < vertices.length; i += 2) {
    const vx = vertices[i]!;
    const vy = vertices[i + 1]!;
    if (vx < minX) minX = vx;
    if (vx > maxX) maxX = vx;
    if (vy < minY) minY = vy;
    if (vy > maxY) maxY = vy;
  }

  return px >= minX && px <= maxX && py >= minY && py <= maxY;
}
