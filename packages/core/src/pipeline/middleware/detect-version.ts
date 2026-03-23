import type { LoadMiddleware } from '../../types/pipeline.js';
import type {
  ModelSettings,
  Cubism2ModelJSON,
  Cubism3ModelJSON,
  CubismVersion,
} from '../../types/model.js';

/** Detect the Cubism version and normalize settings */
export const detectVersion: LoadMiddleware = async (ctx, next) => {
  if (ctx.settings) {
    await next();
    return;
  }

  if (!ctx.settingsJSON) {
    throw new Error('[Live2DLoader] No settings JSON to detect version from.');
  }

  ctx.onProgress('detect-version', 0, 1);

  const json = ctx.settingsJSON;
  const baseUrl = ctx.resolvedAsset!.baseUrl;

  if (isCubism3JSON(json)) {
    ctx.settings = normalizeCubism3(json, ctx.resolvedAsset!.url, baseUrl);
  } else if (isCubism2JSON(json)) {
    ctx.settings = normalizeCubism2(json, ctx.resolvedAsset!.url, baseUrl);
  } else {
    const keys = Object.keys(json as object).join(', ');
    throw new Error(
      `[Live2DLoader] Unrecognized model settings format. ` +
        `Expected a Cubism 2 model.json (with "model" + "textures") or ` +
        `Cubism 3/4/5 model3.json (with "FileReferences"). ` +
        `Got keys: ${keys}`,
    );
  }

  if (ctx.options.cubismVersion) {
    ctx.settings.version = ctx.options.cubismVersion;
  }

  // Find a matching adapter
  const adapter = ctx.adapters.find((a) => a.canHandle(ctx.settingsJSON));
  if (!adapter) {
    const explicit = ctx.adapters.find((a) => a.version === ctx.settings!.version);
    if (!explicit) {
      throw new Error(
        `[Live2DLoader] No adapter found for Cubism version "${ctx.settings.version}". ` +
          `Registered adapters: ${ctx.adapters.map((a) => a.version).join(', ')}`,
      );
    }
    ctx.adapter = explicit;
  } else {
    ctx.adapter = adapter;
  }

  ctx.onProgress('detect-version', 1, 1);
  await next();
};

function isCubism2JSON(json: unknown): json is Cubism2ModelJSON {
  return (
    typeof json === 'object' &&
    json !== null &&
    'model' in json &&
    'textures' in json &&
    Array.isArray((json as any).textures)
  );
}

function isCubism3JSON(json: unknown): json is Cubism3ModelJSON {
  return typeof json === 'object' && json !== null && 'FileReferences' in json;
}

function normalizeCubism2(json: Cubism2ModelJSON, url: string, baseUrl: string): ModelSettings {
  return {
    version: 'cubism2',
    url,
    name: json.name,
    moc: resolveRel(json.model, baseUrl),
    textures: json.textures.map((t) => resolveRel(t, baseUrl)),
    motionGroups: Object.fromEntries(
      Object.entries(json.motions ?? {}).map(([group, entries]) => [
        group,
        entries.map((e) => ({
          file: resolveRel(e.file, baseUrl),
          sound: e.sound ? resolveRel(e.sound, baseUrl) : undefined,
          fadeInTime: e.fade_in,
          fadeOutTime: e.fade_out,
        })),
      ]),
    ),
    expressions: (json.expressions ?? []).map((e) => ({
      name: e.name,
      file: resolveRel(e.file, baseUrl),
    })),
    physics: json.physics ? resolveRel(json.physics, baseUrl) : undefined,
    pose: json.pose ? resolveRel(json.pose, baseUrl) : undefined,
    hitAreas: (json.hit_areas ?? []).map((h) => ({ name: h.name, id: h.id })),
    layout: json.layout,
  };
}

function normalizeCubism3(json: Cubism3ModelJSON, url: string, baseUrl: string): ModelSettings {
  const refs = json.FileReferences;
  const version: CubismVersion = (json.Version ?? 3) >= 4 ? 'cubism5' : 'cubism5';

  return {
    version,
    url,
    moc: resolveRel(refs.Moc, baseUrl),
    textures: refs.Textures.map((t) => resolveRel(t, baseUrl)),
    motionGroups: Object.fromEntries(
      Object.entries(refs.Motions ?? {}).map(([group, entries]) => [
        group,
        entries.map((e) => ({
          file: resolveRel(e.File, baseUrl),
          sound: e.Sound ? resolveRel(e.Sound, baseUrl) : undefined,
          fadeInTime: e.FadeInTime,
          fadeOutTime: e.FadeOutTime,
        })),
      ]),
    ),
    expressions: (refs.Expressions ?? []).map((e) => ({
      name: e.Name,
      file: resolveRel(e.File, baseUrl),
    })),
    physics: refs.Physics ? resolveRel(refs.Physics, baseUrl) : undefined,
    pose: refs.Pose ? resolveRel(refs.Pose, baseUrl) : undefined,
    hitAreas: (json.HitAreas ?? []).map((h) => ({ name: h.Name, id: h.Id })),
  };
}

function resolveRel(path: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return baseUrl + path;
}
