# @live2d-loader/adapter-cubism5

Cubism 4/5 adapter for [live2d-loader](https://github.com/AdingApkgg/live2d-loader). Loads modern `.moc3` models with the Cubism 5 SDK Core (loaded dynamically from CDN at runtime).

## Install

```bash
# npm
npm install @live2d-loader/adapter-cubism5

# yarn
yarn add @live2d-loader/adapter-cubism5

# pnpm
pnpm add @live2d-loader/adapter-cubism5

# bun
bun add @live2d-loader/adapter-cubism5
```

## Usage

```ts
import { createLive2DLoader } from '@live2d-loader/core';
import { WebGLRenderer } from '@live2d-loader/renderer-webgl';
import { Cubism5Adapter } from '@live2d-loader/adapter-cubism5';

const loader = createLive2DLoader({
  adapters: [new Cubism5Adapter()],
  renderer: new WebGLRenderer(),
});

loader.mount(canvas);
await loader.loadModel('https://cdn.example.com/model/model3.json');
```

See the [main README](https://github.com/AdingApkgg/live2d-loader#readme) for full documentation.

## License

[MIT](https://github.com/AdingApkgg/live2d-loader/blob/main/LICENSE)
