import { describe, it, expect } from 'vitest';
import { DefaultAssetResolver } from '../src/asset-resolver.js';

describe('DefaultAssetResolver', () => {
  const resolver = new DefaultAssetResolver();

  describe('resolve', () => {
    it('resolves full URLs', async () => {
      const result = await resolver.resolve('https://cdn.example.com/models/shizuku/model.json');
      expect(result.sourceType).toBe('url');
      expect(result.url).toBe('https://cdn.example.com/models/shizuku/model.json');
      expect(result.baseUrl).toBe('https://cdn.example.com/models/shizuku/');
    });

    it('resolves npm package names', async () => {
      const result = await resolver.resolve('@live2d-models/shizuku');
      expect(result.sourceType).toBe('npm');
      expect(result.url).toContain('@live2d-models/shizuku');
    });

    it('resolves local paths', async () => {
      const result = await resolver.resolve('/models/shizuku/model.json');
      expect(result.sourceType).toBe('local');
      expect(result.url).toBe('/models/shizuku/model.json');
      expect(result.baseUrl).toBe('/models/shizuku/');
    });

    it('resolves builtin models', async () => {
      resolver.registerBuiltin('test', 'https://cdn.example.com/models/test/model.json');
      const result = await resolver.resolve('builtin:test');
      expect(result.sourceType).toBe('url');
      expect(result.url).toBe('https://cdn.example.com/models/test/model.json');
    });

    it('throws for unregistered builtins', async () => {
      await expect(resolver.resolve('builtin:nonexistent')).rejects.toThrow('not found');
    });
  });

  describe('resolveRelative', () => {
    it('resolves relative paths against a base URL', () => {
      const result = resolver.resolveRelative(
        'textures/skin.png',
        'https://cdn.example.com/models/shizuku/model.json',
      );
      expect(result).toBe('https://cdn.example.com/models/shizuku/textures/skin.png');
    });

    it('returns absolute URLs unchanged', () => {
      const abs = 'https://other.cdn.com/texture.png';
      const result = resolver.resolveRelative(abs, 'https://cdn.example.com/models/model.json');
      expect(result).toBe(abs);
    });
  });

  describe('custom CDN template', () => {
    it('uses custom npm CDN template', async () => {
      const custom = new DefaultAssetResolver({
        npmCdnTemplate: 'https://cdn.jsdelivr.net/npm/{package}/',
      });
      const result = await custom.resolve('@live2d-models/shizuku');
      expect(result.url).toBe('https://cdn.jsdelivr.net/npm/@live2d-models/shizuku/');
    });
  });
});
