# @live2d-loader/core

Framework-agnostic core engine for [live2d-loader](https://github.com/AdingApkgg/live2d-loader). Provides the loading pipeline, model management, event system, and render loop — with zero UI dependencies.

## Install

```bash
npm install @live2d-loader/core
```

## Usage

```ts
import { createLive2DLoader } from '@live2d-loader/core';

const loader = createLive2DLoader({
  adapters: [/* your adapters */],
  renderer: /* your renderer */,
});

loader.mount(canvas);
await loader.loadModel('https://cdn.example.com/model/index.json');

loader.on('load:complete', (e) => console.log('Loaded:', e.modelId));
loader.on('hit', (e) => console.log('Hit:', e.hitArea));
```

## API

- `createLive2DLoader(options)` — Create a loader instance
- `loader.mount(canvas)` — Attach to a canvas and start rendering
- `loader.loadModel(source, options?)` — Load a model by URL
- `loader.removeModel(id)` — Remove a loaded model
- `loader.on(event, listener)` / `loader.off(event, listener)` — Event subscription
- `loader.destroy()` — Release all resources

See the [main README](https://github.com/AdingApkgg/live2d-loader#readme) for full documentation.

## License

[MIT](https://github.com/AdingApkgg/live2d-loader/blob/main/LICENSE)
