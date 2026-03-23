# @live2d-loader/element

Lit Web Components for [live2d-loader](https://github.com/AdingApkgg/live2d-loader). Provides `<live2d-model>` and `<live2d-widget>` custom elements for declarative Live2D rendering.

## Install

```bash
npm install @live2d-loader/element
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

### Autoload (CDN one-liner)

```html
<script src="https://cdn.jsdelivr.net/npm/@live2d-loader/element/dist/autoload.js"></script>
<script>
  window.live2dWidgetConfig = {
    src: 'https://cdn.example.com/model/index.json',
    position: 'right',
  };
</script>
```

See the [main README](https://github.com/AdingApkgg/live2d-loader#readme) for full documentation.

## License

[MIT](https://github.com/AdingApkgg/live2d-loader/blob/main/LICENSE)
