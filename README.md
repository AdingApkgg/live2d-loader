# live2d-loader

A layered, pluggable Live2D model loader for the web. Supports both **Cubism 2** (legacy `.moc`) and **Cubism 4/5** (modern `.moc3`) models with a unified API.

> **Note:** This is an unofficial community project and is not affiliated with Live2D Inc.

## Features

- **Dual Cubism support** — Load Cubism 2 and Cubism 4/5 models through a single API
- **Pluggable architecture** — Swap adapters and renderers independently
- **Web Components** — Drop-in `<live2d-model>` and `<live2d-widget>` custom elements built with Lit
- **Zero-config embed** — One `<script>` tag to add a Live2D widget to any site
- **Dynamic core loading** — Cubism SDK cores are loaded from CDN at runtime, never bundled
- **TypeScript-first** — Full type definitions with strict mode
- **Tree-shakeable** — ESM + CJS dual output, publish only what you use

## Architecture

```
@live2d-loader/element        Lit Web Components (UI layer)
        │
@live2d-loader/core           Pure TS engine (framework-agnostic)
        │
   ┌────┴────────────┐
   │                  │
adapter-cubism2    adapter-cubism5
                      │
   ┌────┴────────────┐
   │                  │
renderer-webgl     renderer-pixi
```

## Packages

| Package | Description |
|---------|-------------|
| [`@live2d-loader/core`](./packages/core) | Framework-agnostic engine with pipeline, events, and model management |
| [`@live2d-loader/element`](./packages/element) | Lit Web Components: `<live2d-model>` and `<live2d-widget>` |
| [`@live2d-loader/adapter-cubism2`](./packages/adapter-cubism2) | Adapter for Cubism 2.x models (`.moc`) |
| [`@live2d-loader/adapter-cubism5`](./packages/adapter-cubism5) | Adapter for Cubism 4/5 models (`.moc3`) |
| [`@live2d-loader/renderer-webgl`](./packages/renderer-webgl) | Built-in WebGL2 renderer, zero dependencies |
| [`@live2d-loader/renderer-pixi`](./packages/renderer-pixi) | PixiJS 8 renderer (alternative) |

## Quick Start

### Core API

```bash
# npm
npm install @live2d-loader/core @live2d-loader/renderer-webgl @live2d-loader/adapter-cubism2

# yarn
yarn add @live2d-loader/core @live2d-loader/renderer-webgl @live2d-loader/adapter-cubism2

# pnpm
pnpm add @live2d-loader/core @live2d-loader/renderer-webgl @live2d-loader/adapter-cubism2

# bun
bun add @live2d-loader/core @live2d-loader/renderer-webgl @live2d-loader/adapter-cubism2
```

```ts
import { createLive2DLoader } from '@live2d-loader/core';
import { WebGLRenderer } from '@live2d-loader/renderer-webgl';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

const loader = createLive2DLoader({
  adapters: [new Cubism2Adapter()],
  renderer: new WebGLRenderer(),
});

loader.mount(document.querySelector('canvas')!);
await loader.loadModel('https://cdn.example.com/model/index.json');
```

### Web Component

```bash
# npm
npm install @live2d-loader/element @live2d-loader/adapter-cubism2

# yarn
yarn add @live2d-loader/element @live2d-loader/adapter-cubism2

# pnpm
pnpm add @live2d-loader/element @live2d-loader/adapter-cubism2

# bun
bun add @live2d-loader/element @live2d-loader/adapter-cubism2
```

```html
<live2d-model
  src="https://cdn.example.com/model/index.json"
  width="300"
  height="400"
></live2d-model>
```

```ts
import '@live2d-loader/element';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

const el = document.querySelector('live2d-model');
el.configure({ adapters: [new Cubism2Adapter()] });
```

### CDN

No build tools needed — load directly from a CDN.

#### Script Tag (autoload)

Drop a single `<script>` into any HTML page to embed a Live2D widget:

```html
<!-- jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/@live2d-loader/element/dist/autoload.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@live2d-loader/element/dist/autoload.js"></script>
```

Configure the widget via a global variable (place **before** the script tag or in a separate `<script>`):

```html
<script>
  window.live2dWidgetConfig = {
    src: 'https://cdn.example.com/model/index.json',
    position: 'right',
  };
</script>
```

#### ES Module

Use `<script type="module">` for modern browsers, Deno, or other ESM runtimes:

```html
<script type="module">
  // esm.sh
  import 'https://esm.sh/@live2d-loader/element';

  // esm.run (jsdelivr ESM)
  import 'https://esm.run/@live2d-loader/element';

  // jsdelivr (+esm)
  import 'https://cdn.jsdelivr.net/npm/@live2d-loader/element/+esm';

  // unpkg (?module)
  import 'https://unpkg.com/@live2d-loader/element?module';
</script>
```

#### Version Pinning

Lock to a specific version to avoid unexpected breaking changes:

```
https://cdn.jsdelivr.net/npm/@live2d-loader/element@0.1.0/dist/autoload.js
https://unpkg.com/@live2d-loader/element@0.1.0/dist/autoload.js
https://esm.sh/@live2d-loader/element@0.1.0
```

## Framework Guides

The `<live2d-model>` Web Component works in all frameworks. See the guide for your framework:

| Framework | Guide | Key Notes |
|-----------|-------|-----------|
| React | [docs/frameworks/react.md](./docs/frameworks/react.md) | Use `ref` for `configure()`; JSX type declaration needed |
| Vue | [docs/frameworks/vue.md](./docs/frameworks/vue.md) | Add `isCustomElement` compiler option |
| Nuxt | [docs/frameworks/nuxt.md](./docs/frameworks/nuxt.md) | Wrap with `<ClientOnly>` for SSR |
| Next.js | [docs/frameworks/nextjs.md](./docs/frameworks/nextjs.md) | Use `'use client'` + `dynamic(..., { ssr: false })` |
| SolidJS | [docs/frameworks/solidjs.md](./docs/frameworks/solidjs.md) | Native custom element support |
| Svelte | [docs/frameworks/svelte.md](./docs/frameworks/svelte.md) | Works out of the box |
| Angular | [docs/frameworks/angular.md](./docs/frameworks/angular.md) | Add `CUSTOM_ELEMENTS_SCHEMA` |

You can also use the Core API (`createLive2DLoader`) directly with a `<canvas>` in any framework — see each guide for examples.

## Events

The loader emits typed events you can subscribe to:

```ts
loader.on('load:start', (e) => console.log('Loading:', e.source));
loader.on('load:complete', (e) => console.log('Loaded:', e.modelId));
loader.on('load:error', (e) => console.error('Error:', e.error));
loader.on('hit', (e) => console.log('Hit area:', e.hitArea));
loader.on('render:frame', (e) => { /* per-frame callback */ });
```

## Development

This is a pnpm monorepo. Prerequisites: Node.js >= 18, pnpm >= 9.

```bash
pnpm install
pnpm run dev       # Start playground dev server
pnpm run build     # Build all packages
pnpm run typecheck # Type-check all packages
```

## License

[MIT](./LICENSE) &copy; [AdingApkgg](https://github.com/AdingApkgg)
