# Next.js

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

## Web Component Usage (App Router)

Next.js uses SSR by default. Web Components and Canvas/WebGL require the browser, so you must use `'use client'` and dynamic imports.

### Create a client component (`components/Live2DModel.tsx`)

```tsx
'use client';

import { useEffect, useRef } from 'react';
import type { Live2DModelElement } from '@live2d-loader/element';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

export default function Live2DModel({ src }: { src: string }) {
  const ref = useRef<Live2DModelElement>(null);

  useEffect(() => {
    import('@live2d-loader/element');
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const timer = setTimeout(() => {
      el.configure({ adapters: [new Cubism2Adapter()] });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return <live2d-model ref={ref} src={src} width={300} height={400} />;
}
```

### Use with dynamic import (recommended)

```tsx
import dynamic from 'next/dynamic';

const Live2DModel = dynamic(() => import('@/components/Live2DModel'), {
  ssr: false,
});

export default function Page() {
  return <Live2DModel src="https://cdn.example.com/model/index.json" />;
}
```

### TypeScript JSX Declaration (`src/custom-elements.d.ts`)

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

## Core API Usage

```tsx
'use client';

import { useEffect, useRef } from 'react';

export default function Live2DCanvas({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let loader: any;

    (async () => {
      const { createLive2DLoader } = await import('@live2d-loader/core');
      const { WebGLRenderer } = await import('@live2d-loader/renderer-webgl');
      const { Cubism2Adapter } = await import('@live2d-loader/adapter-cubism2');

      if (!canvasRef.current) return;

      loader = createLive2DLoader({
        adapters: [new Cubism2Adapter()],
        renderer: new WebGLRenderer(),
      });

      loader.mount(canvasRef.current);
      await loader.loadModel(src);
    })();

    return () => loader?.destroy();
  }, [src]);

  return <canvas ref={canvasRef} width={300} height={400} />;
}
```

## Notes

- **`'use client'` is required** for any component using live2d-loader.
- **`dynamic(..., { ssr: false })`** is the recommended way to load the component — it completely skips SSR.
- Use dynamic `import()` inside `useEffect` to avoid importing browser-only modules during SSR.
- Works with both Pages Router and App Router.
