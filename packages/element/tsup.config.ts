import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/autoload.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['@live2d-loader/core', '@live2d-loader/renderer-webgl'],
});
