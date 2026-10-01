/**
 * canvasScheduler.ts — Shared single-rAF animation scheduler
 *
 * Instead of each canvas renderer spawning its own requestAnimationFrame loop,
 * all renderers register a callback here. The scheduler maintains exactly ONE
 * rAF loop globally and dispatches the timestamp to every registered callback.
 *
 * The loop auto-starts when the first callback registers and auto-stops when
 * the last one unregisters — zero overhead when nothing is animating.
 */

type SchedulerCallback = (timestamp: number) => void;

const callbacks = new Map<string, SchedulerCallback>();
let rafId: number | null = null;

function tick(timestamp: number) {
    for (const fn of callbacks.values()) {
        fn(timestamp);
    }
    if (callbacks.size > 0) {
        rafId = requestAnimationFrame(tick);
    } else {
        rafId = null;
    }
}

/**
 * Register a per-frame callback under a unique ID.
 * If this is the first callback, the single rAF loop starts automatically.
 */
export function registerCallback(id: string, fn: SchedulerCallback): void {
    callbacks.set(id, fn);
    if (rafId === null) {
        rafId = requestAnimationFrame(tick);
    }
}

/**
 * Unregister a callback by ID.
 * When the last callback is removed the rAF loop stops automatically.
 */
export function unregisterCallback(id: string): void {
    callbacks.delete(id);
    if (callbacks.size === 0 && rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}
