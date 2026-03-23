import type { MotionDefinition } from './types/model.js';
import { EventBus } from './events.js';

export type MotionPriority = 'idle' | 'normal' | 'force';

/**
 * Manages motion playback and expression switching.
 * Works with the adapter layer to apply motions to models.
 */
export class MotionManager {
  private currentMotion = new Map<string, { group: string; index: number }>();
  private idleMotionGroup = 'idle';
  private idleTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private eventBus: EventBus,
    private idleInterval: number = 5000,
  ) {}

  /**
   * Start a motion on a model.
   * The actual motion application is delegated to the adapter.
   */
  startMotion(
    modelId: string,
    group: string,
    index: number,
    _priority: MotionPriority = 'normal',
  ): void {
    this.currentMotion.set(modelId, { group, index });
    this.eventBus.emit('motion:start', { modelId, group, index });
  }

  /** Notify that a motion has ended */
  endMotion(modelId: string, group: string, index: number): void {
    this.currentMotion.delete(modelId);
    this.eventBus.emit('motion:end', { modelId, group, index });
  }

  /** Set the expression for a model */
  setExpression(modelId: string, name: string): void {
    this.eventBus.emit('expression:set', { modelId, name });
  }

  /** Start random idle motion on a timer */
  startIdleMotion(modelId: string, motionGroups: Record<string, MotionDefinition[]>): void {
    this.stopIdleMotion(modelId);

    const idleMotions = motionGroups[this.idleMotionGroup];
    if (!idleMotions || idleMotions.length === 0) return;

    const tick = () => {
      const index = Math.floor(Math.random() * idleMotions.length);
      this.startMotion(modelId, this.idleMotionGroup, index, 'idle');

      this.idleTimers.set(modelId, setTimeout(tick, this.idleInterval + Math.random() * 2000));
    };

    this.idleTimers.set(modelId, setTimeout(tick, this.idleInterval));
  }

  /** Stop idle motion timer */
  stopIdleMotion(modelId: string): void {
    const timer = this.idleTimers.get(modelId);
    if (timer) {
      clearTimeout(timer);
      this.idleTimers.delete(modelId);
    }
  }

  /** Get current motion for a model */
  getCurrentMotion(modelId: string): { group: string; index: number } | undefined {
    return this.currentMotion.get(modelId);
  }

  /** Set the idle motion group name */
  setIdleMotionGroup(group: string): void {
    this.idleMotionGroup = group;
  }

  destroy(): void {
    for (const timer of this.idleTimers.values()) {
      clearTimeout(timer);
    }
    this.idleTimers.clear();
    this.currentMotion.clear();
  }
}
