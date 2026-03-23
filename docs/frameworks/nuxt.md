# Nuxt

## Install

```bash
npm install @live2d-loader/core @live2d-loader/element @live2d-loader/renderer-webgl @live2d-loader/adapter-cubism2
```

## Configure Nuxt

Web Components use browser APIs (Canvas, WebGL) that don't exist in SSR. Configure Nuxt accordingly.

### `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('live2d-'),
    },
  },
});
```

## Web Component Usage

Use `<ClientOnly>` to prevent SSR rendering, and import the element in a client-only plugin or inside `onMounted`:

### Plugin approach (`plugins/live2d.client.ts`)

```ts
import '@live2d-loader/element';

export default defineNuxtPlugin(() => {});
```

The `.client.ts` suffix ensures this only runs on the client.

### Component

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Live2DModelElement } from '@live2d-loader/element';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

const modelRef = ref<Live2DModelElement>();

onMounted(() => {
  modelRef.value?.configure({ adapters: [new Cubism2Adapter()] });
});
</script>

<template>
  <ClientOnly>
    <live2d-model
      ref="modelRef"
      src="https://cdn.example.com/model/index.json"
      :width="300"
      :height="400"
    />
  </ClientOnly>
</template>
```

## Core API Usage

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const canvasRef = ref<HTMLCanvasElement>();
let loader: any = null;

onMounted(async () => {
  const { createLive2DLoader } = await import('@live2d-loader/core');
  const { WebGLRenderer } = await import('@live2d-loader/renderer-webgl');
  const { Cubism2Adapter } = await import('@live2d-loader/adapter-cubism2');

  if (!canvasRef.value) return;

  loader = createLive2DLoader({
    adapters: [new Cubism2Adapter()],
    renderer: new WebGLRenderer(),
  });

  loader.mount(canvasRef.value);
  await loader.loadModel('https://cdn.example.com/model/index.json');
});

onBeforeUnmount(() => {
  loader?.destroy();
});
</script>

<template>
  <ClientOnly>
    <canvas ref="canvasRef" width="300" height="400" />
  </ClientOnly>
</template>
```

## Notes

- **Always use `<ClientOnly>`** — Live2D rendering requires Canvas/WebGL which are browser-only APIs.
- Use dynamic `import()` inside `onMounted` for the Core API to avoid SSR import issues.
- The `.client.ts` plugin pattern is the cleanest way to register the Web Component.
