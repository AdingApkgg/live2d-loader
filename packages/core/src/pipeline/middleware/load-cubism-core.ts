import type { LoadMiddleware } from '../../types/pipeline.js';

/** Dynamically load the Cubism Core runtime if not already present */
export const loadCubismCore: LoadMiddleware = async (ctx, next) => {
  const adapter = ctx.adapter;
  if (!adapter) {
    throw new Error('[Live2DLoader] No adapter selected before loading Cubism Core.');
  }

  ctx.onProgress('load-core', 0, 1);

  if (!adapter.isCoreLoaded()) {
    const corePath = ctx.options.cubismCorePath ?? adapter.defaultCorePath;
    await adapter.loadCore(corePath);
  }

  ctx.onProgress('load-core', 1, 1);
  await next();
};
