/** Blend modes matching Live2D Cubism specifications */
export enum BlendMode {
  Normal = 0,
  Additive = 1,
  Multiplicative = 2,
}

/** A single drawable mesh to render */
export interface DrawableMesh {
  index: number;
  textureIndex: number;
  vertexPositions: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
  opacity: number;
  blendMode: BlendMode;
  invertedMask: boolean;
  renderOrder: number;
  /** True if this drawable changed since last frame */
  dynamicFlag: boolean;
  /** Mask indices for clipping */
  maskIndices: number[];
  /** Visibility flag */
  visible: boolean;
}

/** Texture data loaded and ready for the renderer */
export interface TextureData {
  index: number;
  image: HTMLImageElement | ImageBitmap;
  width: number;
  height: number;
}

/** Per-model renderer handle */
export interface IModelRenderer {
  /**
   * Bind loaded textures.
   * Called once after textures are loaded.
   */
  setTextures(textures: TextureData[]): void;

  /**
   * Update and draw model drawables for the current frame.
   */
  draw(drawables: DrawableMesh[], modelMatrix: Float32Array): void;

  /** Release GPU resources for this model */
  destroy(): void;
}

/** Top-level renderer that manages a canvas/context */
export interface IRenderer {
  /** Initialize the renderer with a canvas element */
  initialize(canvas: HTMLCanvasElement): void;

  /** Create a per-model renderer */
  createModelRenderer(): IModelRenderer;

  /** Clear the canvas for a new frame */
  beginFrame(): void;

  /** Finalize the current frame (flush, present) */
  endFrame(): void;

  /** Resize the rendering viewport */
  resize(width: number, height: number): void;

  /**
   * Expose the underlying WebGL context.
   * Required by some adapters (Cubism 2) that need direct GL access.
   */
  getGL?(): WebGLRenderingContext | WebGL2RenderingContext | null;

  /** Release all GPU resources */
  destroy(): void;
}
