# @live2d-loader/adapter-cubism2

Cubism 2.x adapter for [live2d-loader](https://github.com/AdingApkgg/live2d-loader). Loads legacy `.moc` models with the Cubism 2 SDK (loaded dynamically from CDN at runtime).

## Install

```bash
# npm
npm install @live2d-loader/adapter-cubism2

# yarn
yarn add @live2d-loader/adapter-cubism2

# pnpm
pnpm add @live2d-loader/adapter-cubism2

# bun
bun add @live2d-loader/adapter-cubism2
```

## Usage

```ts
import { createLive2DLoader } from '@live2d-loader/core';
import { WebGLRenderer } from '@live2d-loader/renderer-webgl';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

const loader = createLive2DLoader({
  adapters: [new Cubism2Adapter()],
  renderer: new WebGLRenderer(),
});

loader.mount(canvas);
await loader.loadModel('https://cdn.example.com/model/index.json');
```

See the [main README](https://github.com/AdingApkgg/live2d-loader#readme) for full documentation.

## License

[MIT](https://github.com/AdingApkgg/live2d-loader/blob/main/LICENSE)
