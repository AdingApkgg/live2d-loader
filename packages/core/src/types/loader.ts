import type { ICubismAdapter } from './adapter.js';
import type { IAssetResolver } from './asset-resolver.js';
import type { IRenderer } from './renderer.js';
import type { LoadMiddleware } from './pipeline.js';

/** Configuration for creating a Live2D loader */
export interface Live2DLoaderOptions {
  /** Cubism adapters to register (order matters for auto-detection) */
  adapters: ICubismAdapter[];

  /** Renderer implementation */
  renderer: IRenderer;

  /** Asset resolver (optional, uses DefaultAssetResolver if omitted) */
  assetResolver?: IAssetResolver;

  /** Additional middleware to insert into the loading pipeline */
  middleware?: LoadMiddleware[];

  /** Canvas element to render into (required unless renderer is pre-initialized) */
  canvas?: HTMLCanvasElement;

  /** Whether to auto-start the render loop (default: true) */
  autoStart?: boolean;

  /** Target FPS for the render loop (default: 60, 0 = requestAnimationFrame) */
  targetFps?: number;
}
