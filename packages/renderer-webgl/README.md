# @live2d-loader/renderer-webgl

Built-in WebGL2 renderer for [live2d-loader](https://github.com/AdingApkgg/live2d-loader). Zero external dependencies.

## Install

```bash
npm install @live2d-loader/renderer-webgl
```

## Usage

```ts
import { createLive2DLoader } from '@live2d-loader/core';
import { WebGLRenderer } from '@live2d-loader/renderer-webgl';

const loader = createLive2DLoader({
  adapters: [/* your adapters */],
  renderer: new WebGLRenderer(),
});

loader.mount(canvas);
```

See the [main README](https://github.com/AdingApkgg/live2d-loader#readme) for full documentation.

## License

[MIT](https://github.com/AdingApkgg/live2d-loader/blob/main/LICENSE)
