# Vue

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

## Configure Vue to Recognize Custom Elements

Tell Vue's template compiler to treat `live2d-*` tags as custom elements instead of Vue components.

### Vite (`vite.config.ts`)

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('live2d-'),
        },
      },
    }),
  ],
});
```

## Web Component Usage

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import '@live2d-loader/element';
import type { Live2DModelElement } from '@live2d-loader/element';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

const modelRef = ref<Live2DModelElement>();
const modelSrc = 'https://cdn.example.com/model/index.json';

onMounted(() => {
  modelRef.value?.configure({ adapters: [new Cubism2Adapter()] });
});

function onLoad(e: Event) {
  console.log('Model loaded:', (e as CustomEvent).detail.modelId);
}
</script>

<template>
  <live2d-model
    ref="modelRef"
    :src="modelSrc"
    :width="300"
    :height="400"
    @load="onLoad"
  />
</template>
```

Vue passes attributes and listens to events on custom elements natively. The `ref` is only needed to call `configure()`.

## Core API Usage

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { createLive2DLoader, type Live2DLoader } from '@live2d-loader/core';
import { WebGLRenderer } from '@live2d-loader/renderer-webgl';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

const canvasRef = ref<HTMLCanvasElement>();
let loader: ReturnType<typeof createLive2DLoader> | null = null;

onMounted(async () => {
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
  <canvas ref="canvasRef" width="300" height="400" />
</template>
```

## Notes

- Vue has excellent custom element support — attributes and events work naturally in templates.
- Always destroy the loader in `onBeforeUnmount` to prevent memory leaks.
- The `isCustomElement` config is required to prevent Vue from warning about unregistered components.
