import { useEffect, useRef } from 'react';
import vertSource from '../shaders/landscape.vert?raw';
import commonSource from '../shaders/common.glsl?raw';
import themeFragSource from '../shaders/tundra.frag?raw';
import { createSpaceRamp } from '../spaceRamp.js';
import styles from './LandscapeBg.module.scss';

// common.glsl isn't a real GLSL module — just a text prefix every theme
// concatenates ahead of its own scene-specific source before compiling.
const fragSource = `${commonSource}\n${themeFragSource}`;

// See LandscapeBg.jsx's identical constant for the reasoning.
const MAX_DPR = 3;

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
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(log ?? 'program link failed');
  }
  return program;
}

// Same lifecycle shape as LandscapeBg.jsx (webgl2/webgl fallback,
// reduced-motion, visibility pause, context-loss, full teardown) — this
// scene is a fixed polar night, so there's no uSunPhase.
export default function TundraBg({ spaceMode = false }) {
  const canvasRef = useRef(null);
  const spaceModeRef = useRef(spaceMode);
  const drawRef = useRef(null);

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

    let program;
    try {
      program = createProgram(gl);
    } catch {
      return undefined;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const uResolution = gl.getUniformLocation(program, 'uResolution');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uSeed = gl.getUniformLocation(program, 'uSeed');
    const uSpaceT = gl.getUniformLocation(program, 'uSpaceT');
    const spaceT = createSpaceRamp(spaceModeRef.current);

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
    let elapsed = 0;

    const draw = () => {
      resize();
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uSpaceT, spaceT(spaceModeRef.current));
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
      start = performance.now() - elapsed * 1000;
      frame = requestAnimationFrame(loop);
    };

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

  useEffect(() => {
    drawRef.current?.();
  }, [spaceMode]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
