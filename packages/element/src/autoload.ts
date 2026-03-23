/**
 * Autoload script — include via <script> tag for zero-config setup.
 *
 * Usage:
 * ```html
 * <script src="https://cdn.example.com/@live2d-loader/element/autoload.js"></script>
 * <script>
 *   window.live2dWidgetConfig = {
 *     position: 'right',
 *     models: [{ name: 'Shizuku', src: 'https://...' }],
 *     tips: ['Hello!', 'Welcome~'],
 *   };
 * </script>
 * ```
 */

import './live2d-model.js';
import './live2d-widget.js';

interface Live2DWidgetAutoConfig {
  position?: 'left' | 'right';
  modelWidth?: number;
  modelHeight?: number;
  models?: Array<{ name: string; src: string; cubismCorePath?: string }>;
  src?: string;
  cubismCore?: string;
  tips?: string[];
}

declare global {
  interface Window {
    live2dWidgetConfig?: Live2DWidgetAutoConfig;
  }
}

function init() {
  const config = window.live2dWidgetConfig ?? {};

  if (document.querySelector('live2d-widget')) return;

  const widget = document.createElement('live2d-widget');

  if (config.position) widget.setAttribute('position', config.position);
  if (config.modelWidth) widget.setAttribute('model-width', String(config.modelWidth));
  if (config.modelHeight) widget.setAttribute('model-height', String(config.modelHeight));
  if (config.src) widget.setAttribute('src', config.src);
  if (config.cubismCore) widget.setAttribute('cubism-core', config.cubismCore);
  if (config.models) widget.setAttribute('models', JSON.stringify(config.models));
  if (config.tips) widget.setAttribute('tips', JSON.stringify(config.tips));

  document.body.appendChild(widget);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
