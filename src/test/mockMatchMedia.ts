// A fully-typed stand-in for `window.matchMedia`'s return value. jsdom
// doesn't implement matchMedia at all (see setup.ts's default stub), and
// individual tests that need to flip `matches` (e.g. simulating
// prefers-reduced-motion) need every member of the real MediaQueryList
// interface present, not just the couple this codebase actually reads, or
// TypeScript (correctly) rejects the assignment to `window.matchMedia`.
export function createMatchMediaMock(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
}
