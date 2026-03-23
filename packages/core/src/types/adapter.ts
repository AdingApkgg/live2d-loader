import type { CubismVersion, ModelSettings } from './model.js';
import type { DrawableMesh } from './renderer.js';
import type { InternalModel, InternalModelOptions } from './internal-model.js';

/** Adapter for a specific Cubism SDK version */
export interface ICubismAdapter {
  /** Which Cubism version this adapter handles */
  readonly version: CubismVersion;

  /**
   * Default CDN path for the Cubism Core script.
   * Used when the user doesn't specify a custom path.
   */
  readonly defaultCorePath: string;

  /**
   * Dynamically load the Cubism Core runtime.
   * @param corePath - URL or path to the core script (optional, uses default)
   */
  loadCore(corePath?: string): Promise<void>;

  /** Check if the Cubism Core is already loaded in the global scope */
  isCoreLoaded(): boolean;

  /**
   * Detect whether this adapter can handle the given model settings JSON.
   * Used for auto-detection of Cubism version.
   */
  canHandle(json: unknown): boolean;

  /**
   * Create an internal model from normalized settings.
   * Handles moc loading, model initialization, etc.
   * @param settings - Normalized model settings
   * @param options - Options including optional GL context
   */
  createModel(settings: ModelSettings, options?: InternalModelOptions): Promise<InternalModel>;

  /**
   * Update the model for the current frame.
   * Applies physics, motion blending, etc.
   * @param model - The internal model state
   * @param deltaTime - Time since last frame in seconds
   */
  updateModel(model: InternalModel, deltaTime: number): void;

  /**
   * Extract the current drawable meshes from the model
   * for the renderer to draw. Not called if `drawModel` is implemented.
   */
  getDrawables(model: InternalModel): DrawableMesh[];

  /**
   * Optional: let the adapter render the model directly
   * (e.g. Cubism 2 SDK has a built-in renderer).
   * Return true if handled, false to fall back to getDrawables().
   */
  drawModel?(model: InternalModel): boolean;

  /**
   * Optional: set up textures on the internal SDK model.
   * Called after texture images are loaded, before first render.
   * Cubism 2 needs WebGL textures set on the model object.
   */
  setupTextures?(model: InternalModel, gl: WebGLRenderingContext | WebGL2RenderingContext): void;

  /**
   * Perform hit testing on the model.
   * @returns The name of the hit area, or null if no hit.
   */
  hitTest(model: InternalModel, x: number, y: number): string | null;

  /** Release a model's resources */
  destroyModel(model: InternalModel): void;
}
