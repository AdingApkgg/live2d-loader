import type { Live2DLoaderOptions } from './types/loader.js';
import type { ModelSource } from './types/model.js';
import type { InternalModelOptions } from './types/internal-model.js';
import type { Live2DEventMap, Live2DEventName } from './types/events.js';
import { EventBus } from './events.js';
import { ModelManager } from './model-manager.js';
import { MotionManager } from './motion-manager.js';
import { InteractionManager } from './interaction-manager.js';
import { DefaultAssetResolver } from './asset-resolver.js';

/**
 * Main entry point — the facade that ties everything together.
 *
 * Usage:
 * ```ts
 * const loader = createLive2DLoader({
 *   adapters: [cubism5Adapter],
 *   renderer: new WebGLRenderer(),
 *   canvas: document.querySelector('canvas')!,
 * });
 * await loader.loadModel('https://cdn.example.com/models/shizuku/');
 * ```
 */
export class Live2DLoader {
  readonly events: EventBus;
  readonly models: ModelManager;
  readonly motions: MotionManager;
  readonly interactions: InteractionManager;

  private canvas: HTMLCanvasElement | null = null;
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;
  private running = false;

  constructor(private options: Live2DLoaderOptions) {
    this.events = new EventBus();

    const assetResolver = options.assetResolver ?? new DefaultAssetResolver();

    this.models = new ModelManager(
      options.adapters,
      options.renderer,
      assetResolver,
      this.events,
      options.middleware,
    );

    this.motions = new MotionManager(this.events);
    this.interactions = new InteractionManager(this.models, this.events);
  }

  /** Initialize the loader with a canvas element */
  mount(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.options.renderer.initialize(canvas);
    this.interactions.attach(canvas);

    if (this.options.autoStart !== false) {
      this.start();
    }
  }

  /** Load a model and add it to the scene */
  async loadModel(source: ModelSource, options?: InternalModelOptions): Promise<string> {
    return this.models.loadModel(source, options);
  }

  /** Remove a model by ID */
  removeModel(modelId: string): void {
    this.motions.stopIdleMotion(modelId);
    this.models.removeModel(modelId);
  }

  /** Start the render loop */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.tick(this.lastTimestamp);
  }

  /** Stop the render loop */
  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Resize the renderer */
  resize(width: number, height: number): void {
    this.options.renderer.resize(width, height);
  }

  /** Subscribe to events */
  on<K extends Live2DEventName>(
    event: K,
    listener: (payload: Live2DEventMap[K]) => void,
  ): this {
    this.events.on(event, listener);
    return this;
  }

  /** Unsubscribe from events */
  off<K extends Live2DEventName>(
    event: K,
    listener: (payload: Live2DEventMap[K]) => void,
  ): this {
    this.events.off(event, listener);
    return this;
  }

  /** Release all resources */
  destroy(): void {
    this.stop();
    this.interactions.destroy();
    this.motions.destroy();
    this.models.destroy();
    this.options.renderer.destroy();
    this.events.removeAllListeners();
  }

  private renderErrorCount = 0;
  private static MAX_RENDER_ERRORS = 5;

  private tick = (timestamp: number): void => {
    if (!this.running) return;

    const deltaTime = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    try {
      this.models.update(deltaTime);
      this.models.draw();
      this.events.emit('render:frame', { deltaTime });
      this.renderErrorCount = 0;
    } catch (err) {
      this.renderErrorCount++;
      const error = err instanceof Error ? err : new Error(String(err));
      this.events.emit('render:error', { error });

      if (this.renderErrorCount >= Live2DLoader.MAX_RENDER_ERRORS) {
        console.error('[Live2DLoader] Too many consecutive render errors, stopping render loop.');
        this.running = false;
        return;
      }
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}

/** Create a new Live2D loader instance */
export function createLive2DLoader(options: Live2DLoaderOptions): Live2DLoader {
  return new Live2DLoader(options);
}
