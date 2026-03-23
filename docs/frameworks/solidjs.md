# SolidJS

## Install

```bash
npm install @live2d-loader/core @live2d-loader/element @live2d-loader/renderer-webgl @live2d-loader/adapter-cubism2
```

## Web Component Usage

SolidJS has first-class support for custom elements. Props are set as properties and events work naturally.

```tsx
import { onMount, onCleanup } from 'solid-js';
import '@live2d-loader/element';
import type { Live2DModelElement } from '@live2d-loader/element';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

function Live2DModel(props: { src: string }) {
  let ref: Live2DModelElement;

  onMount(() => {
    ref.configure({ adapters: [new Cubism2Adapter()] });
  });

  return (
    <live2d-model
      ref={ref!}
      attr:src={props.src}
      attr:width={300}
      attr:height={400}
      on:load={(e: CustomEvent) => console.log('Loaded:', e.detail.modelId)}
    />
  );
}
```

### Type Declaration (`src/custom-elements.d.ts`)

```ts
import 'solid-js';
import type { Live2DModelElement } from '@live2d-loader/element';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'live2d-model': {
        ref?: Live2DModelElement | ((el: Live2DModelElement) => void);
        'attr:src'?: string;
        'attr:width'?: number;
        'attr:height'?: number;
        'attr:cubism-core'?: string;
        'on:load'?: (e: CustomEvent) => void;
        'on:error'?: (e: CustomEvent) => void;
        'on:hit'?: (e: CustomEvent) => void;
      };
    }
  }
}
```

## Core API Usage

```tsx
import { onMount, onCleanup } from 'solid-js';
import { createLive2DLoader } from '@live2d-loader/core';
import { WebGLRenderer } from '@live2d-loader/renderer-webgl';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

function Live2DCanvas(props: { src: string }) {
  let canvas: HTMLCanvasElement;

  onMount(async () => {
    const loader = createLive2DLoader({
      adapters: [new Cubism2Adapter()],
      renderer: new WebGLRenderer(),
    });

    loader.mount(canvas);
    await loader.loadModel(props.src);

    onCleanup(() => loader.destroy());
  });

  return <canvas ref={canvas!} width={300} height={400} />;
}
```

## Notes

- SolidJS uses `attr:` prefix to set HTML attributes and `on:` prefix for custom events on custom elements.
- No special bundler configuration needed.
- For SolidStart (SSR), wrap the component with `clientOnly()` from `solid-start`.
