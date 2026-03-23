import type { CubismVersion, ModelSettings } from './model.js';

/**
 * Internal model state managed by an adapter.
 * The `coreModel` is opaque to the core layer — only the
 * adapter that created it knows how to interact with it.
 */
export interface InternalModel {
  /** Unique ID for this model instance */
  id: string;

  /** The Cubism version this model was created for */
  version: CubismVersion;

  /** Normalized settings used to create this model */
  settings: ModelSettings;

  /**
   * The underlying Cubism runtime model object.
   * Opaque — typed as `unknown` because the core layer
   * doesn't depend on any Cubism SDK types.
   */
  coreModel: unknown;

  /** Loaded texture data, indexed by texture slot */
  textures: Array<{ image: HTMLImageElement | ImageBitmap }>;

  /** Current model matrix (4x4, column-major) */
  modelMatrix: Float32Array;

  /** Whether the model is fully loaded and ready to render */
  ready: boolean;
}

/** Options for creating an internal model */
export interface InternalModelOptions {
  /** Override the auto-detected Cubism version */
  cubismVersion?: CubismVersion;

  /** Custom path to Cubism Core runtime */
  cubismCorePath?: string;

  /** Base URL for resolving relative asset paths */
  baseUrl?: string;

  /**
   * WebGL context for adapters that need direct GL access (e.g. Cubism 2).
   * Automatically injected by ModelManager from the renderer.
   */
  gl?: WebGLRenderingContext | WebGL2RenderingContext;
}
