import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import {
  Live2DLoader,
  createLive2DLoader,
  type ICubismAdapter,
} from '@live2d-loader/core';
import { WebGLRenderer } from '@live2d-loader/renderer-webgl';

/**
 * <live2d-model> — Core Web Component for rendering a single Live2D model.
 *
 * @example
 * ```html
 * <live2d-model
 *   src="https://cdn.example.com/models/shizuku/model3.json"
 *   width="300"
 *   height="400"
 * ></live2d-model>
 * ```
 *
 * @fires load - Model has finished loading
 * @fires error - An error occurred during loading
 * @fires hit - A hit area was clicked
 */
@customElement('live2d-model')
export class Live2DModelElement extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
      position: relative;
      overflow: hidden;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    .loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.05);
      transition: opacity 0.3s ease;
    }
    .loading-overlay[hidden] {
      opacity: 0;
      pointer-events: none;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-top-color: rgba(0, 0, 0, 0.4);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  /** URL to the model settings file (model.json or model3.json) */
  @property({ type: String })
  src = '';

  /** Canvas width in pixels */
  @property({ type: Number })
  width = 300;

  /** Canvas height in pixels */
  @property({ type: Number })
  height = 400;

  /** Custom path to Cubism Core runtime */
  @property({ type: String, attribute: 'cubism-core' })
  cubismCore = '';

  @state()
  private loading = false;

  @state()
  private errorMessage = '';

  @query('canvas')
  private canvas!: HTMLCanvasElement;

  private loader: Live2DLoader | null = null;
  private currentModelId: string | null = null;

  /**
   * Externally provided adapters.
   * Must be set before the element connects to the DOM,
   * or use `configure()` method.
   */
  adapters: ICubismAdapter[] = [];

  override render() {
    return html`
      <canvas width=${this.width} height=${this.height}></canvas>
      <div class="loading-overlay" ?hidden=${!this.loading}>
        <div class="spinner"></div>
      </div>
    `;
  }

  override firstUpdated() {
    this.initLoader();
  }

  override updated(changed: PropertyValues) {
    if (changed.has('src') && this.loader && changed.get('src') !== undefined) {
      this.loadCurrentModel();
    }
    if (changed.has('width') || changed.has('height')) {
      this.loader?.resize(this.width, this.height);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyLoader();
  }

  /** Configure the element with adapters and optional renderer */
  configure(options: {
    adapters: ICubismAdapter[];
    cubismCorePath?: string;
  }): void {
    this.adapters = options.adapters;
    if (options.cubismCorePath) {
      this.cubismCore = options.cubismCorePath;
    }
    if (this.isConnected && !this.loader) {
      this.initLoader();
    }
  }

  /** Get the underlying Live2DLoader instance */
  getLoader(): Live2DLoader | null {
    return this.loader;
  }

  private initLoader(): void {
    if (!this.canvas || this.adapters.length === 0) return;

    const renderer = new WebGLRenderer();
    this.loader = createLive2DLoader({
      adapters: this.adapters,
      renderer,
    });

    this.loader.mount(this.canvas);

    this.loader.on('hit', (e) => {
      this.dispatchEvent(new CustomEvent('hit', {
        detail: e,
        bubbles: true,
        composed: true,
      }));
    });

    if (this.src) {
      this.loadCurrentModel();
    }
  }

  private async loadCurrentModel(): Promise<void> {
    if (!this.loader || !this.src) return;

    if (this.currentModelId) {
      this.loader.removeModel(this.currentModelId);
      this.currentModelId = null;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      this.currentModelId = await this.loader.loadModel(this.src, {
        cubismCorePath: this.cubismCore || undefined,
      });

      this.dispatchEvent(new CustomEvent('load', {
        detail: { modelId: this.currentModelId },
        bubbles: true,
        composed: true,
      }));
    } catch (err) {
      this.errorMessage = err instanceof Error ? err.message : String(err);
      this.dispatchEvent(new CustomEvent('error', {
        detail: { error: this.errorMessage },
        bubbles: true,
        composed: true,
      }));
    } finally {
      this.loading = false;
    }
  }

  private destroyLoader(): void {
    this.loader?.destroy();
    this.loader = null;
    this.currentModelId = null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'live2d-model': Live2DModelElement;
  }
}
