import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';
import { stubCanvasGetContext, type CanvasGetContextStub } from '../test/mockWebGLContext';
import { createMatchMediaMock } from '../test/mockMatchMedia';
import type { BackgroundThemeComponentProps } from '../backgrounds';
import LandscapeBg from './LandscapeBg';
import DesertBg from './DesertBg';
import TundraBg from './TundraBg';
import RainforestBg from './RainforestBg';
import OceanBg from './OceanBg';

const themes: [string, ComponentType<BackgroundThemeComponentProps>][] = [
  ['LandscapeBg (Sunset)', LandscapeBg],
  ['DesertBg', DesertBg],
  ['TundraBg', TundraBg],
  ['RainforestBg', RainforestBg],
  ['OceanBg', OceanBg],
];

describe.each(themes)('%s', (_name, Component) => {
  it('renders a canvas and fails open when WebGL is unavailable (jsdom default)', () => {
    const { container, unmount } = render(<Component spaceMode={false} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });

  describe('with a mocked WebGL context', () => {
    let stub: CanvasGetContextStub;

    beforeEach(() => {
      stub = stubCanvasGetContext();
    });

    afterEach(() => {
      stub.restore();
    });

    it('compiles the shader program and draws at least one frame', async () => {
      render(<Component spaceMode={false} />);
      await waitFor(() => expect(stub.contexts[0]?.drawArrays).toHaveBeenCalled());
      const ctx = stub.contexts[0]!;
      expect(ctx.createProgram).toHaveBeenCalled();
      expect(ctx.linkProgram).toHaveBeenCalled();
      expect(ctx.viewport).toHaveBeenCalled();
      expect(ctx.uniform1f).toHaveBeenCalled(); // uSeed, at minimum
    });

    it('cleans up buffers/program/context on unmount', async () => {
      const { unmount } = render(<Component spaceMode={false} />);
      await waitFor(() => expect(stub.contexts[0]?.drawArrays).toHaveBeenCalled());
      const ctx = stub.contexts[0]!;
      unmount();
      expect(ctx.deleteBuffer).toHaveBeenCalled();
      expect(ctx.deleteProgram).toHaveBeenCalled();
      expect(ctx.getExtension).toHaveBeenCalledWith('WEBGL_lose_context');
    });

    it('redraws with an updated uSpaceT uniform when spaceMode toggles', async () => {
      const { rerender } = render(<Component spaceMode={false} />);
      await waitFor(() => expect(stub.contexts[0]?.drawArrays).toHaveBeenCalled());
      const ctx = stub.contexts[0]!;
      const callsBefore = ctx.uniform1f.mock.calls.length;

      rerender(<Component spaceMode={true} />);
      await waitFor(() => expect(ctx.uniform1f.mock.calls.length).toBeGreaterThan(callsBefore));
    });

    it('pauses the render loop while the document is hidden, resuming when visible again', async () => {
      render(<Component spaceMode={false} />);
      await waitFor(() => expect(stub.contexts[0]?.drawArrays).toHaveBeenCalled());
      const ctx = stub.contexts[0]!;

      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      const callsWhileHidden = ctx.drawArrays.mock.calls.length;
      await new Promise((resolve) => setTimeout(resolve, 40));
      expect(ctx.drawArrays.mock.calls.length).toBe(callsWhileHidden);

      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
      await waitFor(() =>
        expect(ctx.drawArrays.mock.calls.length).toBeGreaterThan(callsWhileHidden),
      );
    });

    it('draws once but never schedules a render loop under prefers-reduced-motion', async () => {
      const original = window.matchMedia;
      window.matchMedia = () => createMatchMediaMock(true);

      render(<Component spaceMode={false} />);
      await waitFor(() => expect(stub.contexts[0]?.drawArrays).toHaveBeenCalled());
      const ctx = stub.contexts[0]!;
      const callsAfterMount = ctx.drawArrays.mock.calls.length;

      await new Promise((resolve) => setTimeout(resolve, 40));
      expect(ctx.drawArrays.mock.calls.length).toBe(callsAfterMount);

      window.matchMedia = original;
    });
  });
});
