import type { LoadMiddleware } from '../../types/pipeline.js';

/** Create the internal model using the selected adapter */
export const createModel: LoadMiddleware = async (ctx, next) => {
  const adapter = ctx.adapter;
  const settings = ctx.settings;

  if (!adapter || !settings) {
    throw new Error('[Live2DLoader] Adapter and settings are required to create a model.');
  }

  ctx.onProgress('create-model', 0, 1);

  const model = await adapter.createModel(settings, ctx.options);

  // Attach loaded textures
  const textures = (ctx as any)._textures;
  if (textures) {
    model.textures = textures;
  }

  model.ready = true;
  ctx.model = model;

  ctx.onProgress('create-model', 1, 1);
  await next();
};
