import type { ICubismAdapter } from './types/adapter.js';
import type { InternalModel, InternalModelOptions } from './types/internal-model.js';
import type { IModelRenderer, IRenderer, TextureData } from './types/renderer.js';
import type { ModelSource } from './types/model.js';
import type { IAssetResolver } from './types/asset-resolver.js';
import type { LoadMiddleware } from './types/pipeline.js';
import { EventBus } from './events.js';
import { LoadPipeline } from './pipeline/load-pipeline.js';

/**
 * Manages loaded models and coordinates between adapters and renderers.
 * Each model gets its own renderer handle.
 */
export class ModelManager {
  private models = new Map<string, ManagedModel>();
  private pipeline: LoadPipeline;
  private modelIdCounter = 0;

  constructor(
    private adapters: ICubismAdapter[],
    private renderer: IRenderer,
    private assetResolver: IAssetResolver,
    private eventBus: EventBus,
    customMiddleware?: LoadMiddleware[],
  ) {
    this.pipeline = new LoadPipeline(customMiddleware);
  }

  /** Load a model from any supported source */
  async loadModel(source: ModelSource, options: InternalModelOptions = {}): Promise<string> {
    const sourceStr = typeof source === 'string' ? source : '(object)';
    this.eventBus.emit('load:start', { source: sourceStr });

    // Inject GL context for adapters that need it (e.g. Cubism 2)
    if (!options.gl && this.renderer.getGL) {
      const gl = this.renderer.getGL();
      if (gl) options = { ...options, gl };
    }

    try {
      const model = await this.pipeline.load(
        source,
        options,
        this.adapters,
        this.assetResolver,
        this.eventBus,
      );

      model.id = `model_${++this.modelIdCounter}`;

      const adapter = this.adapters.find((a) => a.version === model.version);
      if (!adapter) {
        throw new Error(`[Live2DLoader] No adapter for version ${model.version}`);
      }

      const modelRenderer = this.renderer.createModelRenderer();

      const textures: TextureData[] = model.textures.map((t, i) => ({
        index: i,
        image: t.image,
        width: t.image instanceof HTMLImageElement ? t.image.naturalWidth : t.image.width,
        height: t.image instanceof HTMLImageElement ? t.image.naturalHeight : t.image.height,
      }));
      modelRenderer.setTextures(textures);

      // Let adapter set up SDK-level textures (Cubism 2 needs WebGL textures on the model)
      if (adapter.setupTextures && this.renderer.getGL) {
        const gl = this.renderer.getGL();
        if (gl) adapter.setupTextures(model, gl);
      }

      this.models.set(model.id, { model, adapter, modelRenderer });

      this.eventBus.emit('load:complete', { modelId: model.id });
      this.eventBus.emit('model:ready', { modelId: model.id });

      return model.id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.eventBus.emit('load:error', { source: sourceStr, error });
      throw error;
    }
  }

  /** Update all models for a frame */
  update(deltaTime: number): void {
    for (const { model, adapter } of this.models.values()) {
      if (!model.ready) continue;
      adapter.updateModel(model, deltaTime);
    }
  }

  /** Draw all models */
  draw(): void {
    this.renderer.beginFrame();
    for (const { model, adapter, modelRenderer } of this.models.values()) {
      if (!model.ready) continue;

      // Some adapters (Cubism 2) handle rendering internally
      if (adapter.drawModel && adapter.drawModel(model)) {
        continue;
      }

      const drawables = adapter.getDrawables(model);
      modelRenderer.draw(drawables, model.modelMatrix);
    }
    this.renderer.endFrame();
  }

  /** Perform hit testing across all models */
  hitTest(x: number, y: number): { modelId: string; hitArea: string } | null {
    for (const { model, adapter } of this.models.values()) {
      if (!model.ready) continue;
      const hit = adapter.hitTest(model, x, y);
      if (hit) return { modelId: model.id, hitArea: hit };
    }
    return null;
  }

  /** Remove and destroy a model */
  removeModel(modelId: string): void {
    const managed = this.models.get(modelId);
    if (!managed) return;

    managed.modelRenderer.destroy();
    managed.adapter.destroyModel(managed.model);
    this.models.delete(modelId);

    this.eventBus.emit('model:destroy', { modelId });
  }

  /** Get a model by ID */
  getModel(modelId: string): InternalModel | undefined {
    return this.models.get(modelId)?.model;
  }

  /** Get all model IDs */
  getModelIds(): string[] {
    return [...this.models.keys()];
  }

  /** Destroy all models */
  destroy(): void {
    for (const id of this.models.keys()) {
      this.removeModel(id);
    }
  }
}

interface ManagedModel {
  model: InternalModel;
  adapter: ICubismAdapter;
  modelRenderer: IModelRenderer;
}
