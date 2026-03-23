import type { ModelManager } from './model-manager.js';
import { EventBus } from './events.js';

/**
 * Handles pointer interaction with the canvas.
 * Translates DOM events to model-space hit testing and focus tracking.
 */
export class InteractionManager {
  private canvas: HTMLCanvasElement | null = null;
  private isPointerOver = false;
  private boundHandlers = {
    pointerMove: this.onPointerMove.bind(this),
    pointerDown: this.onPointerDown.bind(this),
    pointerEnter: this.onPointerEnter.bind(this),
    pointerLeave: this.onPointerLeave.bind(this),
  };

  /** Normalized pointer position (-1 to 1), used for focus/gaze tracking */
  pointerX = 0;
  pointerY = 0;

  constructor(
    private modelManager: ModelManager,
    private eventBus: EventBus,
  ) {}

  /** Attach event listeners to a canvas element */
  attach(canvas: HTMLCanvasElement): void {
    this.detach();
    this.canvas = canvas;

    canvas.addEventListener('pointermove', this.boundHandlers.pointerMove);
    canvas.addEventListener('pointerdown', this.boundHandlers.pointerDown);
    canvas.addEventListener('pointerenter', this.boundHandlers.pointerEnter);
    canvas.addEventListener('pointerleave', this.boundHandlers.pointerLeave);
  }

  /** Remove event listeners */
  detach(): void {
    if (!this.canvas) return;

    this.canvas.removeEventListener('pointermove', this.boundHandlers.pointerMove);
    this.canvas.removeEventListener('pointerdown', this.boundHandlers.pointerDown);
    this.canvas.removeEventListener('pointerenter', this.boundHandlers.pointerEnter);
    this.canvas.removeEventListener('pointerleave', this.boundHandlers.pointerLeave);
    this.canvas = null;
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  private onPointerDown(e: PointerEvent): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    const hit = this.modelManager.hitTest(x, y);
    if (hit) {
      this.eventBus.emit('hit', {
        modelId: hit.modelId,
        hitArea: hit.hitArea,
        x,
        y,
      });
    }
  }

  private onPointerEnter(_e: PointerEvent): void {
    this.isPointerOver = true;
    for (const modelId of this.modelManager.getModelIds()) {
      this.eventBus.emit('pointer:enter', { modelId });
    }
  }

  private onPointerLeave(_e: PointerEvent): void {
    this.isPointerOver = false;
    this.pointerX = 0;
    this.pointerY = 0;
    for (const modelId of this.modelManager.getModelIds()) {
      this.eventBus.emit('pointer:leave', { modelId });
    }
  }

  destroy(): void {
    this.detach();
  }
}
