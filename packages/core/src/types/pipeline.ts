import type { ICubismAdapter } from './adapter.js';
import type { IAssetResolver, ResolvedAsset } from './asset-resolver.js';
import type { InternalModel, InternalModelOptions } from './internal-model.js';
import type { ModelSettings, ModelSettingsJSON, ModelSource } from './model.js';

/** Context passed through the loading pipeline */
export interface LoadContext {
  /** Original source provided by the user */
  source: ModelSource;

  /** Options provided by the user */
  options: InternalModelOptions;

  /** Available adapters, injected by the loader */
  adapters: ICubismAdapter[];

  /** Asset resolver, injected by the loader */
  assetResolver: IAssetResolver;

  /** Populated during resolution stage */
  resolvedAsset?: ResolvedAsset;

  /** Raw JSON fetched from the model settings file */
  settingsJSON?: ModelSettingsJSON;

  /** Normalized model settings */
  settings?: ModelSettings;

  /** The adapter selected for this model */
  adapter?: ICubismAdapter;

  /** The final internal model */
  model?: InternalModel;

  /** Emit a progress event */
  onProgress: (stage: string, progress: number, total: number) => void;
}

/** A single step in the loading pipeline */
export type LoadMiddleware = (
  context: LoadContext,
  next: () => Promise<void>,
) => Promise<void>;
