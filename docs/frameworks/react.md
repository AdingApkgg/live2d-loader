# React

## Install

```bash
# npm
npm install @live2d-loader/core @live2d-loader/element @live2d-loader/renderer-webgl @live2d-loader/adapter-cubism2

# yarn
yarn add @live2d-loader/core @live2d-loader/element @live2d-loader/renderer-webgl @live2d-loader/adapter-cubism2

# pnpm
pnpm add @live2d-loader/core @live2d-loader/element @live2d-loader/renderer-webgl @live2d-loader/adapter-cubism2

# bun
bun add @live2d-loader/core @live2d-loader/element @live2d-loader/renderer-webgl @live2d-loader/adapter-cubism2
```

## Web Component Usage

Web Components work in React, but React (before v19) does not automatically pass props/events to custom elements. Use `ref` to call `configure()` and listen to events.

```tsx
import { useEffect, useRef } from 'react';
import '@live2d-loader/element';
import type { Live2DModelElement } from '@live2d-loader/element';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

function Live2DModel({ src }: { src: string }) {
  const ref = useRef<Live2DModelElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.configure({ adapters: [new Cubism2Adapter()] });

    const onLoad = (e: Event) => {
      console.log('Model loaded:', (e as CustomEvent).detail.modelId);
    };
    el.addEventListener('load', onLoad);
    return () => el.addEventListener('load', onLoad);
  }, []);

  return <live2d-model ref={ref} src={src} width={300} height={400} />;
}
```

### TypeScript JSX Declaration

Add this to a `.d.ts` file (e.g. `src/custom-elements.d.ts`) so TypeScript recognizes the custom element in JSX:

```ts
import type { Live2DModelElement } from '@live2d-loader/element';

declare namespace JSX {
  interface IntrinsicElements {
    'live2d-model': React.DetailedHTMLProps<
      React.HTMLAttributes<Live2DModelElement> & {
        src?: string;
        width?: number;
        height?: number;
        'cubism-core'?: string;
      },
      Live2DModelElement
    >;
  }
}
```

> **React 19+**: React 19 natively supports custom elements — props are passed as properties, and events work with `onLoad`, `onError`, etc. The `ref` approach still works but is no longer required for basic usage.

## Core API Usage

For full control, use the Core API directly with a canvas ref:

```tsx
import { useEffect, useRef } from 'react';
import { createLive2DLoader } from '@live2d-loader/core';
import { WebGLRenderer } from '@live2d-loader/renderer-webgl';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

function Live2DCanvas({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loader = createLive2DLoader({
      adapters: [new Cubism2Adapter()],
      renderer: new WebGLRenderer(),
    });

    loader.mount(canvas);
    loader.loadModel(src);

    return () => loader.destroy();
  }, [src]);

  return <canvas ref={canvasRef} width={300} height={400} />;
}
```

## Notes

- Always call `loader.destroy()` in the cleanup function to prevent memory leaks.
- The Cubism SDK core is loaded from CDN at runtime — no additional bundler configuration needed.
- If using both Cubism 2 and Cubism 5 models, pass both adapters: `[new Cubism2Adapter(), new Cubism5Adapter()]`.
