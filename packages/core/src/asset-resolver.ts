import type { IAssetResolver, ResolvedAsset, BuiltinModelEntry } from './types/asset-resolver.js';

/**
 * Default asset resolver supporting:
 * - Full URLs (https://...)
 * - npm package references (@scope/package or package-name)
 * - Relative/local paths (./path or /path)
 * - Built-in model names (builtin:name)
 */
export class DefaultAssetResolver implements IAssetResolver {
  private builtins = new Map<string, BuiltinModelEntry>();

  /** CDN template for resolving npm packages (default: unpkg) */
  private npmCdnTemplate: string;

  constructor(options?: { npmCdnTemplate?: string }) {
    this.npmCdnTemplate = options?.npmCdnTemplate ?? 'https://unpkg.com/{package}/';
  }

  async resolve(source: string): Promise<ResolvedAsset> {
    if (source.startsWith('builtin:')) {
      return this.resolveBuiltin(source.slice('builtin:'.length));
    }

    if (this.isFullUrl(source)) {
      return this.resolveUrl(source);
    }

    if (source.startsWith('@') || /^[a-z][\w.-]*$/i.test(source)) {
      return this.resolveNpm(source);
    }

    return this.resolveLocal(source);
  }

  resolveRelative(relativePath: string, baseUrl: string): string {
    if (this.isFullUrl(relativePath)) return relativePath;

    const base = baseUrl.endsWith('/')
      ? baseUrl
      : baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    return new URL(relativePath, base).href;
  }

  registerBuiltin(name: string, url: string, description?: string): void {
    this.builtins.set(name, { name, url, description });
  }

  private isFullUrl(source: string): boolean {
    return /^https?:\/\//i.test(source);
  }

  private resolveUrl(url: string): ResolvedAsset {
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    return { url, baseUrl, sourceType: 'url' };
  }

  private resolveNpm(packageName: string): ResolvedAsset {
    const url = this.npmCdnTemplate.replace('{package}', packageName);
    return { url, baseUrl: url, sourceType: 'npm' };
  }

  private resolveLocal(path: string): ResolvedAsset {
    const normalized = path.startsWith('/') ? path : `./${path}`;
    const baseUrl = normalized.substring(0, normalized.lastIndexOf('/') + 1);
    return { url: normalized, baseUrl, sourceType: 'local' };
  }

  private resolveBuiltin(name: string): ResolvedAsset {
    const entry = this.builtins.get(name);
    if (!entry) {
      throw new Error(
        `[Live2DLoader] Built-in model "${name}" not found. Register it first with registerBuiltin().`,
      );
    }
    return this.resolveUrl(entry.url);
  }
}
