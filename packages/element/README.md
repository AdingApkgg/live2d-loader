# @live2d-loader/element

Lit Web Components for [live2d-loader](https://github.com/AdingApkgg/live2d-loader). Provides `<live2d-model>` and `<live2d-widget>` custom elements for declarative Live2D rendering.

## Install

```bash
# npm
npm install @live2d-loader/element

# yarn
yarn add @live2d-loader/element

# pnpm
pnpm add @live2d-loader/element

# bun
bun add @live2d-loader/element
```

## Usage

### `<live2d-model>` — Single model display

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

```html
<!-- jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/@live2d-loader/element/dist/autoload.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@live2d-loader/element/dist/autoload.js"></script>

<script>
  window.live2dWidgetConfig = {
    src: 'https://cdn.example.com/model/index.json',
    position: 'right',
  };
</script>
```

#### ES Module

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

```
https://cdn.jsdelivr.net/npm/@live2d-loader/element@0.1.0/dist/autoload.js
https://unpkg.com/@live2d-loader/element@0.1.0/dist/autoload.js
https://esm.sh/@live2d-loader/element@0.1.0
```

See the [main README](https://github.com/AdingApkgg/live2d-loader#readme) for full documentation.

## License

[MIT](https://github.com/AdingApkgg/live2d-loader/blob/main/LICENSE)
