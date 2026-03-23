import type { LoadMiddleware } from '../../types/pipeline.js';
import type { ModelSettingsJSON, ModelListJSON } from '../../types/model.js';

/** Fetch the model settings JSON from the resolved URL */
export const fetchModelJSON: LoadMiddleware = async (ctx, next) => {
  if (ctx.settings) {
    await next();
    return;
  }

  if (!ctx.resolvedAsset) {
    throw new Error('[Live2DLoader] No resolved asset to fetch.');
  }

  ctx.onProgress('fetch-json', 0, 1);

  let url = ctx.resolvedAsset.url;

  if (url.endsWith('/')) {
    url = await resolveSettingsFile(url);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `[Live2DLoader] Failed to fetch model settings: ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();

  // Check if this is a model list/catalog (stevenjoezhang/live2d-widget format)
  if (isModelListJSON(json)) {
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    const modelUrl = await resolveModelFromList(json, baseUrl);

    const modelResp = await fetch(modelUrl);
    if (!modelResp.ok) {
      throw new Error(
        `[Live2DLoader] Failed to fetch model from list: ${modelResp.status} ${modelResp.statusText} (${modelUrl})`,
      );
    }

    ctx.settingsJSON = (await modelResp.json()) as ModelSettingsJSON;
    ctx.resolvedAsset.url = modelUrl;
    ctx.resolvedAsset.baseUrl = modelUrl.substring(0, modelUrl.lastIndexOf('/') + 1);
  } else {
    ctx.settingsJSON = json as ModelSettingsJSON;
    ctx.resolvedAsset.url = url;
    ctx.resolvedAsset.baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
  }

  ctx.onProgress('fetch-json', 1, 1);
  await next();
};

function isModelListJSON(json: unknown): json is ModelListJSON {
  return (
    typeof json === 'object' &&
    json !== null &&
    'models' in json &&
    Array.isArray((json as any).models) &&
    (json as any).models.length > 0 &&
    Array.isArray((json as any).models[0])
  );
}

/**
 * Pick a model from a model list and resolve to its settings URL.
 * Tries `{base}/model/{path}/index.json`, then `{base}/{path}/index.json`,
 * then `{base}/model/{path}/model.json`, etc.
 */
async function resolveModelFromList(list: ModelListJSON, baseUrl: string): Promise<string> {
  const firstGroup = list.models[0]!;
  const modelPath = firstGroup[0]!;

  const candidates = [
    `${baseUrl}model/${modelPath}/index.json`,
    `${baseUrl}${modelPath}/index.json`,
    `${baseUrl}model/${modelPath}/model.json`,
    `${baseUrl}${modelPath}/model.json`,
    `${baseUrl}model/${modelPath}/model3.json`,
    `${baseUrl}${modelPath}/model3.json`,
  ];

  for (const candidateUrl of candidates) {
    try {
      const resp = await fetch(candidateUrl, { method: 'HEAD' });
      if (resp.ok) return candidateUrl;
    } catch {
      // try next
    }
  }

  throw new Error(
    `[Live2DLoader] Could not resolve model "${modelPath}" from model list. ` +
      `Tried:\n${candidates.map((c) => `  - ${c}`).join('\n')}`,
  );
}

async function resolveSettingsFile(baseUrl: string): Promise<string> {
  const candidates = ['model3.json', 'model.json', 'index.json', 'model_list.json'];

  for (const name of candidates) {
    const url = baseUrl + name;
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      if (resp.ok) return url;
    } catch {
      // try next
    }
  }

  throw new Error(
    `[Live2DLoader] Could not find model settings file in ${baseUrl}. ` +
      `Tried: ${candidates.join(', ')}`,
  );
}
