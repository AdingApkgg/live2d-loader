/** Resolved asset ready for fetching */
export interface ResolvedAsset {
  /** Fully qualified URL for the asset */
  url: string;
  /** Base URL for resolving relative paths within the model */
  baseUrl: string;
  /** How the source was resolved */
  sourceType: 'url' | 'npm' | 'local' | 'builtin';
}

/** Configuration for built-in model registry */
export interface BuiltinModelEntry {
  name: string;
  url: string;
  description?: string;
}

/** Asset resolver — maps model sources to fetchable URLs */
export interface IAssetResolver {
  /**
   * Resolve a model source to a fetchable URL.
   * Handles CDN URLs, npm package names, local paths, and built-in names.
   */
  resolve(source: string): Promise<ResolvedAsset>;

  /**
   * Resolve a relative path within a model to an absolute URL.
   * Used for textures, motions, etc.
   */
  resolveRelative(relativePath: string, baseUrl: string): string;

  /**
   * Register a built-in model for easy loading by name.
   */
  registerBuiltin(name: string, url: string, description?: string): void;
}
