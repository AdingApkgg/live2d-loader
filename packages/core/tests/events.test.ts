import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src/events.js';

describe('EventBus', () => {
  it('registers and emits events', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('load:start', handler);
    bus.emit('load:start', { source: 'test.json' } as any);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ source: 'test.json' });
  });

  it('removes listeners with off', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('load:start', handler);
    bus.off('load:start', handler);
    bus.emit('load:start', { source: 'test.json' } as any);

    expect(handler).not.toHaveBeenCalled();
  });

  it('fires once listener only once', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.once('load:start', handler);
    bus.emit('load:start', { source: '1' } as any);
    bus.emit('load:start', { source: '2' } as any);

    expect(handler).toHaveBeenCalledOnce();
  });

  it('removes all listeners for an event', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.on('load:start', h1);
    bus.on('load:start', h2);
    bus.removeAllListeners('load:start');
    bus.emit('load:start', { source: 'test' } as any);

    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('removes all listeners globally', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.on('load:start', h1);
    bus.on('load:complete', h2);
    bus.removeAllListeners();
    bus.emit('load:start', { source: 'test' } as any);
    bus.emit('load:complete', { modelId: '1' } as any);

    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('catches errors in listeners without breaking', () => {
    const bus = new EventBus();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const badHandler = vi.fn(() => {
      throw new Error('boom');
    });
    const goodHandler = vi.fn();

    bus.on('load:start', badHandler);
    bus.on('load:start', goodHandler);
    bus.emit('load:start', { source: 'test' } as any);

    expect(badHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
