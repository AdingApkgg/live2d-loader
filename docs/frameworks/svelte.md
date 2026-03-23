# Svelte

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

Svelte natively supports custom elements. No special configuration required.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import '@live2d-loader/element';
  import type { Live2DModelElement } from '@live2d-loader/element';
  import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

  export let src: string;
  let modelEl: Live2DModelElement;

  onMount(() => {
    modelEl.configure({ adapters: [new Cubism2Adapter()] });
  });

  function handleLoad(e: CustomEvent) {
    console.log('Model loaded:', e.detail.modelId);
  }
</script>

<live2d-model
  bind:this={modelEl}
  {src}
  width={300}
  height={400}
  on:load={handleLoad}
/>
```

## Core API Usage

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createLive2DLoader } from '@live2d-loader/core';
  import { WebGLRenderer } from '@live2d-loader/renderer-webgl';
  import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

  export let src: string;
  let canvas: HTMLCanvasElement;
  let loader: ReturnType<typeof createLive2DLoader>;

  onMount(async () => {
    loader = createLive2DLoader({
      adapters: [new Cubism2Adapter()],
      renderer: new WebGLRenderer(),
    });

    loader.mount(canvas);
    await loader.loadModel(src);
  });

  onDestroy(() => {
    loader?.destroy();
  });
</script>

<canvas bind:this={canvas} width={300} height={400} />
```

## SvelteKit (SSR)

For SvelteKit, use dynamic import to avoid SSR issues:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  export let src: string;
  let canvas: HTMLCanvasElement;

  onMount(async () => {
    const { createLive2DLoader } = await import('@live2d-loader/core');
    const { WebGLRenderer } = await import('@live2d-loader/renderer-webgl');
    const { Cubism2Adapter } = await import('@live2d-loader/adapter-cubism2');

    const loader = createLive2DLoader({
      adapters: [new Cubism2Adapter()],
      renderer: new WebGLRenderer(),
    });

    loader.mount(canvas);
    await loader.loadModel(src);

    return () => loader.destroy();
  });
</script>

{#if browser}
  <canvas bind:this={canvas} width={300} height={400} />
{/if}
```

## Notes

- Svelte passes attributes and events to custom elements natively — no configuration needed.
- Use `bind:this` instead of `ref` to get element references.
- For SvelteKit SSR, use `browser` guard or dynamic imports in `onMount`.
