import type { LoadMiddleware } from '../../types/pipeline.js';

/** Resolve the model source to a fetchable URL */
export const resolveURL: LoadMiddleware = async (ctx, next) => {
  ctx.onProgress('resolve', 0, 1);

  const source = ctx.source;

  if (typeof source === 'string') {
    ctx.resolvedAsset = await ctx.assetResolver.resolve(source);
  } else if (typeof source === 'object' && 'url' in source && typeof (source as any).url === 'string') {
    ctx.resolvedAsset = await ctx.assetResolver.resolve((source as any).url);
  } else if (typeof source === 'object' && 'version' in source) {
    // Already a ModelSettings object
    ctx.settings = source as any;
    ctx.resolvedAsset = {
      url: (source as any).url,
      baseUrl: (source as any).url.substring(0, (source as any).url.lastIndexOf('/') + 1),
      sourceType: 'url',
    };
  } else {
    throw new Error('[Live2DLoader] Invalid model source.');
  }

  ctx.onProgress('resolve', 1, 1);
  await next();
};
