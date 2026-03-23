import type { LoadMiddleware } from '../../types/pipeline.js';

/** Load all texture images for the model */
export const loadTextures: LoadMiddleware = async (ctx, next) => {
  if (!ctx.settings) {
    throw new Error('[Live2DLoader] No model settings available for texture loading.');
  }

  const texturePaths = ctx.settings.textures;
  ctx.onProgress('load-textures', 0, texturePaths.length);

  const textures = await Promise.all(
    texturePaths.map(async (url, index) => {
      const image = await loadImage(url);
      ctx.onProgress('load-textures', index + 1, texturePaths.length);
      return { image };
    }),
  );

  // Store textures on context for the createModel step
  (ctx as any)._textures = textures;

  await next();
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`[Live2DLoader] Failed to load texture: ${url}`));
    img.src = url;
  });
}
