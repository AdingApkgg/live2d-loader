import { createLive2DLoader } from '@live2d-loader/core';
import { WebGLRenderer } from '@live2d-loader/renderer-webgl';
import { Cubism5Adapter } from '@live2d-loader/adapter-cubism5';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';
import '@live2d-loader/element';
import type { Live2DModelElement } from '@live2d-loader/element';

const logPanel = document.getElementById('logPanel')!;
const modelUrlInput = document.getElementById('modelUrl') as HTMLInputElement;
const loadBtn = document.getElementById('loadBtn')!;
const demoCanvas = document.getElementById('demoCanvas') as HTMLCanvasElement;

const adapters = [new Cubism5Adapter(), new Cubism2Adapter()];

function log(type: 'info' | 'error' | 'event', message: string) {
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${type}] ${message}`;
  logPanel.appendChild(entry);
  logPanel.scrollTop = logPanel.scrollHeight;
}

// --- Core API demo ---
let currentLoader: ReturnType<typeof createLive2DLoader> | null = null;

loadBtn.addEventListener('click', async () => {
  const url = modelUrlInput.value.trim();
  if (!url) {
    log('error', 'Please enter a model URL');
    return;
  }

  if (currentLoader) {
    currentLoader.destroy();
    currentLoader = null;
  }

  const renderer = new WebGLRenderer();
  currentLoader = createLive2DLoader({
    adapters,
    renderer,
  });

  currentLoader.on('load:start', (e) => log('event', `Loading: ${e.source}`));
  currentLoader.on('load:progress', (e) => log('info', `  ${e.stage}: ${e.progress}/${e.total}`));
  currentLoader.on('load:complete', (e) => log('info', `Model loaded: ${e.modelId}`));
  currentLoader.on('load:error', (e) => log('error', `Load failed: ${e.error.message}`));
  currentLoader.on('hit', (e) => log('event', `Hit: ${e.hitArea} on ${e.modelId}`));
  currentLoader.on('render:error', (e) => log('error', `Render error: ${e.error.message}`));

  currentLoader.mount(demoCanvas);

  log('info', `Loading model from: ${url}`);
  try {
    const modelId = await currentLoader.loadModel(url);
    log('info', `Success! Model ID: ${modelId}`);
  } catch (err) {
    log('error', `Failed: ${err instanceof Error ? err.message : String(err)}`);
  }
});

// --- Web Component demo ---
const wcDemo = document.getElementById('wcDemo') as Live2DModelElement;
const wcModelUrlInput = document.getElementById('wcModelUrl') as HTMLInputElement;
const wcLoadBtn = document.getElementById('wcLoadBtn')!;

if (wcDemo) {
  wcDemo.configure({ adapters });

  wcLoadBtn.addEventListener('click', () => {
    const url = wcModelUrlInput.value.trim();
    if (!url) {
      log('error', '[WC] Please enter a model URL');
      return;
    }
    log('info', `[WC] Loading: ${url}`);
    wcDemo.setAttribute('src', url);
  });

  wcDemo.addEventListener('load', ((e: CustomEvent) => {
    log('event', `[WC] Model loaded: ${e.detail.modelId}`);
  }) as EventListener);

  wcDemo.addEventListener('error', ((e: CustomEvent) => {
    log('error', `[WC] Error: ${e.detail.error}`);
  }) as EventListener);

  wcDemo.addEventListener('hit', ((e: CustomEvent) => {
    log('event', `[WC] Hit: ${e.detail.hitArea}`);
  }) as EventListener);
}

log('info', 'Playground ready. Enter a model URL and click "Load Model".');
log('info', 'Try a Cubism 5 model3.json or Cubism 2 model.json URL.');
