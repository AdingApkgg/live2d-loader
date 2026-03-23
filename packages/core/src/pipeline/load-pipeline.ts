import type { LoadContext, LoadMiddleware } from '../types/pipeline.js';
import type { ModelSource } from '../types/model.js';
import type { InternalModel, InternalModelOptions } from '../types/internal-model.js';
import type { ICubismAdapter } from '../types/adapter.js';
import type { IAssetResolver } from '../types/asset-resolver.js';
import type { EventBus } from '../events.js';

import { resolveURL } from './middleware/resolve-url.js';
import { fetchModelJSON } from './middleware/fetch-model-json.js';
import { detectVersion } from './middleware/detect-version.js';
import { loadCubismCore } from './middleware/load-cubism-core.js';
import { loadTextures } from './middleware/load-textures.js';
import { createModel } from './middleware/create-model.js';

/**
 * Middleware-based model loading pipeline.
 * Each step can be replaced, extended, or wrapped.
 */
export class LoadPipeline {
  private middleware: LoadMiddleware[];

  constructor(customMiddleware?: LoadMiddleware[]) {
    this.middleware = customMiddleware ?? [
      resolveURL,
      fetchModelJSON,
      detectVersion,
      loadCubismCore,
      loadTextures,
      createModel,
    ];
  }

  /** Insert middleware before the pipeline runs */
  use(mw: LoadMiddleware): this {
    this.middleware.push(mw);
    return this;
  }

  /** Insert middleware at a specific position */
  useAt(index: number, mw: LoadMiddleware): this {
    this.middleware.splice(index, 0, mw);
    return this;
  }

  /** Execute the pipeline to load a model */
  async load(
    source: ModelSource,
    options: InternalModelOptions,
    adapters: ICubismAdapter[],
    assetResolver: IAssetResolver,
    eventBus: EventBus,
  ): Promise<InternalModel> {
    const context: LoadContext = {
      source,
      options,
      adapters,
      assetResolver,
      onProgress: (stage, progress, total) => {
        eventBus.emit('load:progress', {
          stage: stage as any,
          progress,
          total,
        });
      },
    };

    await this.execute(context, 0);

    if (!context.model) {
      throw new Error('[Live2DLoader] Pipeline completed but no model was created.');
    }

    return context.model;
  }

  private async execute(context: LoadContext, index: number): Promise<void> {
    if (index >= this.middleware.length) return;

    const mw = this.middleware[index]!;
    await mw(context, () => this.execute(context, index + 1));
  }
}
