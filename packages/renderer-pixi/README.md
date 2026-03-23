# @live2d-loader/renderer-pixi

PixiJS 8 renderer for [live2d-loader](https://github.com/AdingApkgg/live2d-loader). Alternative to the built-in WebGL renderer for projects already using PixiJS.

> **Note:** This package is currently a placeholder and not yet fully implemented.

## Install

```bash
# npm
npm install @live2d-loader/renderer-pixi pixi.js

# yarn
yarn add @live2d-loader/renderer-pixi pixi.js

# pnpm
pnpm add @live2d-loader/renderer-pixi pixi.js

# bun
bun add @live2d-loader/renderer-pixi pixi.js
```

## Usage

```ts
import { createLive2DLoader } from '@live2d-loader/core';
import { PixiRenderer } from '@live2d-loader/renderer-pixi';

const loader = createLive2DLoader({
  adapters: [/* your adapters */],
  renderer: new PixiRenderer(),
});

loader.mount(canvas);
```

See the [main README](https://github.com/AdingApkgg/live2d-loader#readme) for full documentation.

## License

[MIT](https://github.com/AdingApkgg/live2d-loader/blob/main/LICENSE)
