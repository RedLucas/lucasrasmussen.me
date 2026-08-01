import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import BurnTransition from './BurnTransition';
import { stubCanvasGetContext, type CanvasGetContextStub } from '../test/mockWebGLContext';
import { createMatchMediaMock } from '../test/mockMatchMedia';

// jsdom doesn't declare HTMLImageElement.prototype.decode at all, so it has
// to be assigned through a narrow cast rather than spied on directly.
type ImageWithDecode = { decode?: () => Promise<void> };

// jsdom has no WebGL, so every real path through setup() bails at
// `if (!gl) { complete(); return undefined; }` — these tests exercise the
// component's fail-open contract (always eventually calling onComplete
// rather than leaving the caller stuck) instead of the actual shader.
describe('BurnTransition', () => {
  afterEach(() => {
    // Restore the jsdom-default matchMedia stub other tests rely on.
    window.matchMedia = () => createMatchMediaMock(false);
  });

  it('calls onComplete immediately when prefers-reduced-motion is set', async () => {
    window.matchMedia = () => createMatchMediaMock(true);
    const onComplete = vi.fn();
    const sourceNodeRef = { current: document.createElement('div') };
    render(<BurnTransition sourceNodeRef={sourceNodeRef} onComplete={onComplete} />);
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it('calls onComplete immediately when the source node ref is empty', async () => {
    const onComplete = vi.fn();
    const sourceNodeRef = { current: null };
    render(<BurnTransition sourceNodeRef={sourceNodeRef} onComplete={onComplete} />);
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it('fails open and calls onComplete when WebGL is unavailable (as under jsdom)', async () => {
    const onComplete = vi.fn();
    const onReady = vi.fn();
    const sourceNodeRef = { current: document.createElement('div') };
    render(
      <BurnTransition sourceNodeRef={sourceNodeRef} onComplete={onComplete} onReady={onReady} />,
    );
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    // Setup never got far enough to hide the live resume behind the canvas.
    expect(onReady).not.toHaveBeenCalled();
  });

  it('renders a hidden canvas', () => {
    const sourceNodeRef = { current: document.createElement('div') };
    const { container } = render(
      <BurnTransition sourceNodeRef={sourceNodeRef} onComplete={() => {}} />,
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not call onComplete more than once across an unmount', async () => {
    const onComplete = vi.fn();
    const sourceNodeRef = { current: document.createElement('div') };
    const { unmount } = render(
      <BurnTransition sourceNodeRef={sourceNodeRef} onComplete={onComplete} />,
    );
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(() => unmount()).not.toThrow();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  describe('with a mocked WebGL context', () => {
    let stub: CanvasGetContextStub;
    let decodeMock: Mock<() => Promise<void>>;

    beforeEach(() => {
      stub = stubCanvasGetContext();
      // jsdom has no HTMLImageElement.prototype.decode at all (so it can't
      // be spied on, only defined outright) — the actual captured snapshot
      // content doesn't matter to a mocked GL context, so this just needs
      // to resolve for setup() to proceed past capture.
      decodeMock = vi.fn().mockResolvedValue(undefined);
      (HTMLImageElement.prototype as ImageWithDecode).decode = decodeMock;
    });

    afterEach(() => {
      stub.restore();
      delete (HTMLImageElement.prototype as ImageWithDecode).decode;
    });

    it('captures the source node, uploads a texture, draws, and completes the burn', async () => {
      const onComplete = vi.fn();
      const onReady = vi.fn();
      const sourceNode = document.createElement('div');
      sourceNode.textContent = 'résumé content';
      const sourceNodeRef = { current: sourceNode };

      render(
        <BurnTransition
          sourceNodeRef={sourceNodeRef}
          onComplete={onComplete}
          onReady={onReady}
          durationMs={10}
        />,
      );

      await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
      const ctx = stub.contexts[0]!;
      expect(ctx.texImage2D).toHaveBeenCalled();
      await waitFor(() => expect(ctx.drawArrays).toHaveBeenCalled());

      await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    });

    it('cleans up the buffer/texture/program on unmount mid-burn', async () => {
      const sourceNode = document.createElement('div');
      const sourceNodeRef = { current: sourceNode };
      const { unmount } = render(
        <BurnTransition sourceNodeRef={sourceNodeRef} onComplete={() => {}} durationMs={100000} />,
      );

      await waitFor(() => expect(stub.contexts[0]?.drawArrays).toHaveBeenCalled());
      const ctx = stub.contexts[0]!;
      unmount();
      expect(ctx.deleteBuffer).toHaveBeenCalled();
      expect(ctx.deleteTexture).toHaveBeenCalled();
      expect(ctx.deleteProgram).toHaveBeenCalled();
      expect(ctx.getExtension).toHaveBeenCalledWith('WEBGL_lose_context');
    });

    it('fails open if capturing the source node throws', async () => {
      decodeMock.mockRejectedValue(new Error('decode failed'));
      const onComplete = vi.fn();
      const sourceNodeRef = { current: document.createElement('div') };
      render(<BurnTransition sourceNodeRef={sourceNodeRef} onComplete={onComplete} />);
      await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    });
  });
});
