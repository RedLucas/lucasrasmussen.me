import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createMatchMediaMock } from './mockMatchMedia';

// Vitest's `globals` option is left off (tests import their own describe/
// it/expect for explicitness), so Testing Library's usual auto-cleanup —
// which detects a global `afterEach` — never registers on its own. Wire it
// up explicitly instead, once, for every test file.
afterEach(() => cleanup());

// jsdom doesn't implement matchMedia at all. Every consumer in this codebase
// only reads `.matches` (and, for the space ramp / burn transition, adds a
// change listener), so a minimal stub covering that shape is enough — real
// behavior (actually honoring the OS preference) isn't something a unit test
// can exercise anyway.
window.matchMedia ??= () => createMatchMediaMock(false);

// jsdom doesn't implement requestAnimationFrame either. Every render loop in
// this codebase (LandscapeBg.tsx and siblings, BurnTransition.tsx) is driven
// by it, so a real (if coarser) scheduler is needed for that code to run
// under test at all — a plain setTimeout stand-in is enough since nothing
// here depends on true frame timing.
window.requestAnimationFrame ??= (callback: FrameRequestCallback) =>
  setTimeout(() => callback(performance.now()), 16);
window.cancelAnimationFrame ??= (id: number) => clearTimeout(id);
