import { LitElement, html, css, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ICubismAdapter } from '@live2d-loader/core';
import './live2d-model.js';
import type { Live2DModelElement } from './live2d-model.js';

/**
 * Tip message configuration
 */
interface _TipMessage {
  text: string;
  duration?: number;
}

/**
 * Model entry for multi-model switching
 */
export interface WidgetModelEntry {
  name: string;
  src: string;
  cubismCorePath?: string;
}

/**
 * <live2d-widget> — Complete mascot widget with chat bubble,
 * toolbar, model switching, and positioning.
 *
 * @example
 * ```html
 * <live2d-widget
 *   position="right"
 *   models='[{"name":"Shizuku","src":"https://..."}]'
 * ></live2d-widget>
 * ```
 */
@customElement('live2d-widget')
export class Live2DWidgetElement extends LitElement {
  static override styles = css`
    :host {
      --widget-size: 300px;
      --widget-bottom: 0px;
      --widget-side: 16px;
      --bubble-bg: #fff;
      --bubble-color: #333;
      --bubble-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
      --toolbar-bg: rgba(255, 255, 255, 0.9);
      --toolbar-color: #555;
      --toolbar-hover: #333;

      position: fixed;
      bottom: var(--widget-bottom);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
    }
    :host([position="right"]) {
      right: var(--widget-side);
    }
    :host([position="left"]) {
      left: var(--widget-side);
    }

    .bubble {
      pointer-events: auto;
      max-width: 260px;
      padding: 10px 16px;
      margin-bottom: 8px;
      background: var(--bubble-bg);
      color: var(--bubble-color);
      border-radius: 12px;
      box-shadow: var(--bubble-shadow);
      font-size: 13px;
      line-height: 1.5;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .bubble.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .model-container {
      pointer-events: auto;
      position: relative;
      cursor: grab;
    }
    .model-container:active {
      cursor: grabbing;
    }

    .toolbar {
      pointer-events: auto;
      display: flex;
      gap: 4px;
      padding: 4px 8px;
      margin-top: 4px;
      background: var(--toolbar-bg);
      border-radius: 20px;
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .model-container:hover + .toolbar,
    .toolbar:hover {
      opacity: 1;
    }

    .toolbar button {
      all: unset;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      color: var(--toolbar-color);
      cursor: pointer;
      font-size: 14px;
      transition: color 0.2s, background 0.2s;
    }
    .toolbar button:hover {
      color: var(--toolbar-hover);
      background: rgba(0, 0, 0, 0.06);
    }
    .toolbar button[title]::after {
      content: attr(title);
    }

    .settings-panel {
      pointer-events: auto;
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bubble-bg);
      border-radius: 12px;
      box-shadow: var(--bubble-shadow);
      padding: 12px 16px;
      min-width: 180px;
      font-size: 13px;
    }
    .settings-panel h4 {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 600;
    }
    .settings-panel label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 6px 0;
      cursor: pointer;
    }
    .settings-panel input[type="radio"] {
      margin: 0;
    }

    .hidden {
      display: none;
    }
  `;

  /** Widget position: left or right side of screen */
  @property({ type: String, reflect: true })
  position: 'left' | 'right' = 'right';

  /** Canvas width for the model */
  @property({ type: Number, attribute: 'model-width' })
  modelWidth = 300;

  /** Canvas height for the model */
  @property({ type: Number, attribute: 'model-height' })
  modelHeight = 350;

  /** JSON array of model entries */
  @property({ type: String, attribute: 'models' })
  modelsJSON = '';

  /** Single model source URL (convenience for single-model use) */
  @property({ type: String })
  src = '';

  /** Custom Cubism Core path */
  @property({ type: String, attribute: 'cubism-core' })
  cubismCore = '';

  /** Idle tip messages (JSON array of strings) */
  @property({ type: String, attribute: 'tips' })
  tipsJSON = '';

  @state() private tipText = '';
  @state() private tipVisible = false;
  @state() private showSettings = false;
  @state() private currentModelIndex = 0;
  @state() private isHidden = false;

  private models: WidgetModelEntry[] = [];
  private tipTimer: ReturnType<typeof setTimeout> | null = null;
  private idleTipTimer: ReturnType<typeof setTimeout> | null = null;
  private tips: string[] = [];
  adapters: ICubismAdapter[] = [];

  override connectedCallback() {
    super.connectedCallback();
    this.parseModels();
    this.parseTips();
    this.startIdleTips();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopIdleTips();
    if (this.tipTimer) clearTimeout(this.tipTimer);
  }

  override updated(changed: PropertyValues) {
    if (changed.has('modelsJSON')) this.parseModels();
    if (changed.has('tipsJSON')) this.parseTips();
  }

  override render() {
    if (this.isHidden) {
      return html`
        <div class="toolbar" style="opacity: 1;">
          <button @click=${this.show} title="Show">&#x1f441;</button>
        </div>
      `;
    }

    const currentModel = this.getCurrentModel();

    return html`
      <div class="bubble ${this.tipVisible ? 'visible' : ''}">
        ${this.tipText}
      </div>

      <div class="model-container">
        <live2d-model
          src=${currentModel?.src ?? this.src}
          width=${this.modelWidth}
          height=${this.modelHeight}
          cubism-core=${currentModel?.cubismCorePath ?? this.cubismCore}
          @load=${this.onModelLoad}
          @error=${this.onModelError}
          @hit=${this.onModelHit}
        ></live2d-model>
      </div>

      <div class="toolbar">
        ${this.models.length > 1 ? html`
          <button @click=${this.switchModel}>&#x1f504;</button>
        ` : nothing}
        <button @click=${this.captureScreenshot}>&#x1f4f7;</button>
        <button @click=${this.toggleSettings}>&#x2699;</button>
        <button @click=${this.hide}>&#x2716;</button>
      </div>

      ${this.showSettings ? html`
        <div class="settings-panel">
          <h4>Model</h4>
          ${this.models.map((m, i) => html`
            <label>
              <input type="radio" name="model"
                .checked=${i === this.currentModelIndex}
                @change=${() => this.selectModel(i)}
              />
              ${m.name}
            </label>
          `)}
        </div>
      ` : nothing}
    `;
  }

  /** Show a tip message in the chat bubble */
  showTip(text: string, duration = 3000): void {
    if (this.tipTimer) clearTimeout(this.tipTimer);

    this.tipText = text;
    this.tipVisible = true;

    this.tipTimer = setTimeout(() => {
      this.tipVisible = false;
    }, duration);
  }

  /** Configure adapters externally */
  configure(options: { adapters: ICubismAdapter[] }): void {
    this.adapters = options.adapters;
    this.updateModelElement();
  }

  private getCurrentModel(): WidgetModelEntry | undefined {
    return this.models[this.currentModelIndex];
  }

  private parseModels(): void {
    if (!this.modelsJSON) {
      if (this.src) {
        this.models = [{ name: 'Default', src: this.src }];
      }
      return;
    }
    try {
      this.models = JSON.parse(this.modelsJSON);
    } catch {
      console.warn('[live2d-widget] Invalid models JSON');
      this.models = [];
    }
  }

  private parseTips(): void {
    if (!this.tipsJSON) return;
    try {
      this.tips = JSON.parse(this.tipsJSON);
    } catch {
      this.tips = [];
    }
  }

  private switchModel(): void {
    if (this.models.length <= 1) return;
    this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
    const model = this.models[this.currentModelIndex]!;
    this.showTip(`Switched to ${model.name}`);
  }

  private selectModel(index: number): void {
    this.currentModelIndex = index;
    this.showSettings = false;
    const model = this.models[index]!;
    this.showTip(`Switched to ${model.name}`);
  }

  private toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  private hide(): void {
    this.isHidden = true;
    this.stopIdleTips();
  }

  private show(): void {
    this.isHidden = false;
    this.startIdleTips();
  }

  private captureScreenshot(): void {
    const modelEl = this.shadowRoot?.querySelector('live2d-model') as Live2DModelElement | null;
    if (!modelEl) return;

    const canvas = modelEl.shadowRoot?.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'live2d-screenshot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  private startIdleTips(): void {
    if (this.tips.length === 0) return;
    this.stopIdleTips();

    const tick = () => {
      const tip = this.tips[Math.floor(Math.random() * this.tips.length)]!;
      this.showTip(tip, 4000);
      this.idleTipTimer = setTimeout(tick, 8000 + Math.random() * 4000);
    };

    this.idleTipTimer = setTimeout(tick, 5000);
  }

  private stopIdleTips(): void {
    if (this.idleTipTimer) {
      clearTimeout(this.idleTipTimer);
      this.idleTipTimer = null;
    }
  }

  private onModelLoad(_e: Event): void {
    this.showTip('Hello! Nice to meet you~', 3000);
  }

  private onModelError(e: Event): void {
    const detail = (e as CustomEvent).detail;
    console.error('[live2d-widget] Model load error:', detail.error);
  }

  private onModelHit(e: Event): void {
    const detail = (e as CustomEvent).detail;
    const messages: Record<string, string[]> = {
      head: ['Hmm?', "That's my head!"],
      body: ['Hey~', "Don't touch me!"],
    };
    const area = detail.hitArea?.toLowerCase() ?? '';
    const pool = messages[area] ?? ['You poked me!'];
    this.showTip(pool[Math.floor(Math.random() * pool.length)]!);
  }

  private updateModelElement(): void {
    const modelEl = this.shadowRoot?.querySelector('live2d-model') as Live2DModelElement | null;
    if (modelEl && this.adapters.length > 0) {
      modelEl.configure({ adapters: this.adapters });
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'live2d-widget': Live2DWidgetElement;
  }
}
