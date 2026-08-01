import { useEffect, useRef } from 'react';
import vertSource from '../shaders/landscape.vert?raw';
import commonSource from '../shaders/common.glsl?raw';
import themeFragSource from '../shaders/landscape.frag?raw';
import { createSpaceRamp } from '../spaceRamp';
import { getSceneSeed } from '../seed';
import styles from './LandscapeBg.module.scss';
import type { BackgroundThemeComponentProps } from '../backgrounds';

// common.glsl isn't a real GLSL module — just a text prefix every theme
// concatenates ahead of its own scene-specific source before compiling.
const fragSource = `${commonSource}\n${themeFragSource}`;

// Ridge silhouettes have hard edges, so full retina resolution is visibly
// sharper than a plain gradient would justify — render at the device's
// actual pixel density rather than downsampling. Capped at 3 purely as a
// safety ceiling against pathological values (e.g. browser zoom inflating
// devicePixelRatio well past what any real display panel uses).
const MAX_DPR = 3;
// A stylized day, not a real 24-hour one — fast enough that the sun's drift
// is noticeable within a normal page visit, slow enough to still read as
// ambient rather than an obvious animation.
const SUN_CYCLE_MS = 3 * 60 * 1000;

// Phase of the current cycle elapsed (0..1) — real wall-clock time, not
// performance.now(), so every visitor's sun sits at the same height at a
// given moment regardless of when their own session started.
function sunCyclePhase(): number {
  return (Date.now() % SUN_CYCLE_MS) / SUN_CYCLE_MS;
}

type GL = WebGL2RenderingContext | WebGLRenderingContext;

function compile(gl: GL, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('failed to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log ?? 'shader compile failed');
  }
  return shader;
}

function createProgram(gl: GL): WebGLProgram {
  const vert = compile(gl, gl.VERTEX_SHADER, vertSource);
  const frag = compile(gl, gl.FRAGMENT_SHADER, fragSource);
  const program = gl.createProgram();
  if (!program) throw new Error('failed to create program');
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  // Attached shaders stay alive until the program is deleted, so they can be
  // released as soon as the link succeeds.
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(log ?? 'program link failed');
  }
  return program;
}

// If anything below fails the canvas is simply never painted. It stays
// transparent, so the app's gradient shows through untouched — no state and
// no fallback branch needed.
export default function LandscapeBg({ spaceMode = false }: BackgroundThemeComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read fresh inside the mount effect's rAF loop (which never re-runs while
  // this component stays mounted) rather than closing over the prop's
  // initial value — see createSpaceRamp's caller below.
  const spaceModeRef = useRef(spaceMode);
  // Holds the mount effect's own `draw`, so the effect below can force one
  // redraw right when spaceMode flips even if no rAF loop is running (e.g.
  // reduced motion) — otherwise the canvas would just keep showing whatever
  // it last drew until something else happened to trigger a frame.
  const drawRef = useRef<(() => void) | null>(null);

  // Writing a ref during render is disallowed (react-hooks/refs) — this
  // effect is the safe place, and runs before the "force a redraw" effect
  // below since effects commit in declaration order.
  useEffect(() => {
    spaceModeRef.current = spaceMode;
  }, [spaceMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl =
      canvas.getContext('webgl2', { antialias: false, alpha: false }) ??
      canvas.getContext('webgl', { antialias: false, alpha: false });

    if (!gl) return undefined;

    let program: WebGLProgram;
    try {
      program = createProgram(gl);
    } catch {
      // A driver that can't compile this leaves the gradient in place.
      return undefined;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const uResolution = gl.getUniformLocation(program, 'uResolution');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uSeed = gl.getUniformLocation(program, 'uSeed');
    const uSunPhase = gl.getUniformLocation(program, 'uSunPhase');
    const uSpaceT = gl.getUniformLocation(program, 'uSpaceT');
    const spaceT = createSpaceRamp(spaceModeRef.current);

    gl.useProgram(program);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(uSeed, getSceneSeed());

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolution, width, height);
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let start = performance.now();
    // Frozen time for reduced motion still renders the full scene, just
    // without the drift.
    let elapsed = 0;

    const draw = () => {
      resize();
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uSunPhase, sunCyclePhase());
      gl.uniform1f(uSpaceT, spaceT(spaceModeRef.current));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      elapsed = (now - start) / 1000;
      draw();
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const play = () => {
      if (frame || reduceMotion.matches || document.hidden) return;
      // Rebase so the scene doesn't jump forward by however long we paused.
      start = performance.now() - elapsed * 1000;
      frame = requestAnimationFrame(loop);
    };

    // Burning battery on an ambient background in a tab nobody is looking at
    // is pure waste.
    const onVisibility = () => (document.hidden ? stop() : play());
    const onMotionChange = () => (reduceMotion.matches ? (stop(), draw()) : play());
    const onResize = () => {
      if (!frame) draw();
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      stop();
    };

    canvas.addEventListener('webglcontextlost', onContextLost);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    reduceMotion.addEventListener('change', onMotionChange);

    drawRef.current = draw;
    draw();
    play();

    return () => {
      drawRef.current = null;
      stop();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      reduceMotion.removeEventListener('change', onMotionChange);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  // Forces a redraw the instant spaceMode changes, in case no rAF loop is
  // currently running to pick it up on its own (see drawRef's comment above).
  useEffect(() => {
    drawRef.current?.();
  }, [spaceMode]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
