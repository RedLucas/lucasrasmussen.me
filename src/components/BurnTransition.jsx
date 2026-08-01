import { useEffect, useRef } from 'react';
import vertSource from '../shaders/burn.vert?raw';
import fragSource from '../shaders/burn.frag?raw';
import styles from './BurnTransition.module.scss';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';

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

// Clones an element (and, for the one pseudo-element that matters here, its
// ::before) with every computed style value inlined, so it renders correctly
// once serialized into a sandboxed SVG document that has no access to this
// page's stylesheets or CSS Modules class names. ::after is skipped — the
// grain texture it draws is a 0.04-opacity nicety, invisible during a burn.
function cloneWithComputedStyles(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent);
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const clone = document.createElementNS(XHTML_NS, node.tagName.toLowerCase());
  const computed = getComputedStyle(node);
  let cssText = '';
  for (let i = 0; i < computed.length; i += 1) {
    const prop = computed.item(i);
    cssText += `${prop}:${computed.getPropertyValue(prop)};`;
  }
  clone.setAttribute('style', cssText);

  const before = getComputedStyle(node, '::before');
  if (before.content !== 'none' && before.content !== '""') {
    const marker = document.createElementNS(XHTML_NS, 'div');
    let beforeCss = '';
    for (let i = 0; i < before.length; i += 1) {
      const prop = before.item(i);
      beforeCss += `${prop}:${before.getPropertyValue(prop)};`;
    }
    marker.setAttribute('style', beforeCss);
    clone.appendChild(marker);
  }

  node.childNodes.forEach((child) => {
    const childClone = cloneWithComputedStyles(child);
    if (childClone) clone.appendChild(childClone);
  });

  return clone;
}

// Captures exactly what's currently visible in a scrollable node (not its
// full, possibly-taller scrollHeight) — a viewport-sized window offset by
// the current scroll position, matching what the user actually sees the
// instant they close.
async function captureNode(node) {
  const width = node.clientWidth;
  const height = node.clientHeight;
  const scrollTop = node.scrollTop;

  const clone = cloneWithComputedStyles(node);
  clone.setAttribute(
    'style',
    `${clone.getAttribute('style')}position:relative;top:${-scrollTop}px;overflow:visible;`,
  );

  const viewport = document.createElementNS(XHTML_NS, 'div');
  viewport.setAttribute('style', `width:${width}px;height:${height}px;overflow:hidden;`);
  viewport.appendChild(clone);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  const foreignObject = document.createElementNS(SVG_NS, 'foreignObject');
  foreignObject.setAttribute('width', '100%');
  foreignObject.setAttribute('height', '100%');
  foreignObject.appendChild(viewport);
  svg.appendChild(foreignObject);

  const svgString = new XMLSerializer().serializeToString(svg);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  const image = new Image();
  image.width = width;
  image.height = height;
  image.src = dataUrl;
  await image.decode();
  return image;
}

// A point anywhere on the page, in plain 0..1 uv space — the shader itself
// aspect-corrects it (see burn.frag), so this doesn't need to know the
// captured resume's actual width/height ratio.
function randomOrigin() {
  return [Math.random(), Math.random()];
}

// Burns away a snapshot of `sourceNode` with a WebGL shader, seeded
// differently every time so the pattern never repeats. If anything along the
// way fails — no WebGL, a capture error, a lost context — this fails open by
// calling `onComplete` immediately, so a browser quirk degrades to today's
// instant close rather than leaving the modal stuck.
// Rendered only while a burn is in progress — App.jsx mounts this
// conditionally rather than passing an `active` flag, so every burn gets a
// fresh instance (and a fresh `completedRef`) rather than one persistent
// instance whose one-shot guard would only ever fire once, across the site's
// entire lifetime.
export default function BurnTransition({ sourceNodeRef, onComplete, onReady, durationMs = 1100 }) {
  const canvasRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const complete = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    };

    // Reading .current here, inside an effect, is the safe place to do it —
    // not during render (see App.jsx, which passes the ref itself rather
    // than its current value for exactly this reason).
    const sourceNode = sourceNodeRef.current;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      complete();
      return undefined;
    }

    if (!sourceNode) {
      complete();
      return undefined;
    }

    const canvas = canvasRef.current;
    const gl =
      canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false }) ??
      canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });

    if (!gl) {
      complete();
      return undefined;
    }

    let program;
    let texture;
    let buffer;
    let frame = 0;
    let start = null;
    let elapsedAtPause = 0;
    let cancelled = false;

    const onContextLost = (event) => {
      event.preventDefault();
      complete();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    const setup = async () => {
      try {
        program = createProgram(gl);
      } catch {
        complete();
        return;
      }

      const image = await captureNode(sourceNode).catch(() => null);
      if (cancelled) return;
      if (!image) {
        complete();
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(sourceNode.clientWidth * dpr));
      const height = Math.max(1, Math.round(sourceNode.clientHeight * dpr));
      canvas.width = width;
      canvas.height = height;

      try {
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      } catch {
        // Safari can taint the canvas on certain SVG content; treat any
        // upload failure the same as "can't do this" and fail open.
        complete();
        return;
      }
      if (cancelled) return;

      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

      const aPosition = gl.getAttribLocation(program, 'aPosition');
      const uResolution = gl.getUniformLocation(program, 'uResolution');
      const uProgress = gl.getUniformLocation(program, 'uProgress');
      const uSeed = gl.getUniformLocation(program, 'uSeed');
      const uOrigin = gl.getUniformLocation(program, 'uOrigin');
      const uTexture = gl.getUniformLocation(program, 'uTexture');

      gl.viewport(0, 0, width, height);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uResolution, width, height);
      gl.uniform1f(uSeed, Math.random() * 100);
      gl.uniform2fv(uOrigin, randomOrigin());
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uTexture, 0);

      // Runs well past 1 so both the char/fade zone AND the smoke trail
      // behind it (which now lingers noticeably longer after each patch
      // finishes charring — see burn.frag's slower decay) have time to
      // fully clear before the completion handler tears everything down.
      const finishAt = 2.1;

      const loop = (now) => {
        if (cancelled) return;
        if (start === null) start = now;
        const elapsed = elapsedAtPause + (now - start) / 1000;
        const progress = elapsed / (durationMs / 1000);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uProgress, progress);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        if (progress >= finishAt) {
          complete();
          return;
        }
        frame = requestAnimationFrame(loop);
      };

      const onVisibility = () => {
        if (document.hidden) {
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          if (start !== null) elapsedAtPause += (performance.now() - start) / 1000;
          start = null;
        } else if (!frame && !cancelled) {
          frame = requestAnimationFrame(loop);
        }
      };
      document.addEventListener('visibilitychange', onVisibility);

      // Everything that can fail (compile, capture, texture upload) has
      // already succeeded by this point — only now is it safe for the
      // caller to hide the real DOM/modal chrome, so there's never a gap
      // where nothing is visible while capture is still in flight.
      onReady?.();
      frame = requestAnimationFrame(loop);

      return () => document.removeEventListener('visibilitychange', onVisibility);
    };

    let cleanupVisibility;
    setup().then((cleanup) => {
      cleanupVisibility = cleanup;
    });

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      cleanupVisibility?.();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (buffer) gl.deleteBuffer(buffer);
      if (texture) gl.deleteTexture(texture);
      if (program) gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [sourceNodeRef, onComplete, onReady, durationMs]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
