import { useEffect, useRef } from 'react';
import vertSource from '../shaders/landscape.vert?raw';
import fragSource from '../shaders/landscape.frag?raw';
import styles from './LandscapeBg.module.scss';

// Ridge silhouettes have hard edges, so full retina resolution is visibly
// sharper than a plain gradient would justify. Capped at 2 (rather than the
// full devicePixelRatio) since 3x+ displays see essentially no further
// improvement for the added fragment cost.
const MAX_DPR = 2;
const DAY_MS = 86400000;

// Fraction of the current UTC day elapsed (0..1) — real wall-clock time, not
// performance.now(), so every visitor's sun sits at the same height at a
// given moment regardless of when their own session started.
function dayFraction() {
  return (Date.now() % DAY_MS) / DAY_MS;
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log ?? 'shader compile failed');
  }
  return shader;
}

function createProgram(gl) {
  const vert = compile(gl, gl.VERTEX_SHADER, vertSource);
  const frag = compile(gl, gl.FRAGMENT_SHADER, fragSource);
  const program = gl.createProgram();
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
export default function LandscapeBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl =
      canvas.getContext('webgl2', { antialias: false, alpha: false }) ??
      canvas.getContext('webgl', { antialias: false, alpha: false });

    if (!gl) return undefined;

    let program;
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
    const uDayFraction = gl.getUniformLocation(program, 'uDayFraction');

    gl.useProgram(program);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(uSeed, Math.random() * 100);

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
      gl.uniform1f(uDayFraction, dayFraction());
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now) => {
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

    const onContextLost = (event) => {
      event.preventDefault();
      stop();
    };

    canvas.addEventListener('webglcontextlost', onContextLost);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    reduceMotion.addEventListener('change', onMotionChange);

    draw();
    play();

    return () => {
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

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
