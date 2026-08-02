import { useEffect, useRef, type RefObject } from 'react';
import vertSource from '../shaders/burn.vert?raw';
import fragSource from '../shaders/burn.frag?raw';
import styles from './BurnTransition.module.scss';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';

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
function cloneWithComputedStyles(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent ?? '');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const element = node as Element;
  const clone = document.createElementNS(XHTML_NS, element.tagName.toLowerCase());
  const computed = getComputedStyle(element);
  let cssText = '';
  for (let i = 0; i < computed.length; i += 1) {
    const prop = computed.item(i);
    cssText += `${prop}:${computed.getPropertyValue(prop)};`;
  }
  clone.setAttribute('style', cssText);

  const before = getComputedStyle(element, '::before');
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

  element.childNodes.forEach((child) => {
    const childClone = cloneWithComputedStyles(child);
    if (childClone) clone.appendChild(childClone);
  });

  return clone;
}

// Captures exactly what's currently visible in a scrollable node (not its
// full, possibly-taller scrollHeight) — a viewport-sized window offset by
// the current scroll position, matching what the user actually sees the
// instant they close.
async function captureNode(node: HTMLElement): Promise<HTMLImageElement> {
  const width = node.clientWidth;
  const height = node.clientHeight;
  const scrollTop = node.scrollTop;

  const clone = cloneWithComputedStyles(node) as Element;
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
function randomOrigin(): [number, number] {
  return [Math.random(), Math.random()];
}

export interface BurnTransitionProps {
  sourceNodeRef: RefObject<HTMLElement | null>;
  onComplete: () => void;
  onReady?: () => void;
  durationMs?: number;
}

// Burns away a snapshot of `sourceNode` with a WebGL shader, seeded
// differently every time so the pattern never repeats. If anything along the
// way fails — no WebGL, a capture error, a lost context — this fails open by
// calling `onComplete` immediately, so a browser quirk degrades to today's
// instant close rather than leaving the modal stuck.
// Rendered only while a burn is in progress — App.tsx mounts this
// conditionally rather than passing an `active` flag, so every burn gets a
// fresh instance (and a fresh `completedRef`) rather than one persistent
// instance whose one-shot guard would only ever fire once, across the site's
// entire lifetime.
export default function BurnTransition({
  sourceNodeRef,
  onComplete,
  onReady,
  durationMs = 1100,
}: BurnTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const complete = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    };

    // Reading .current here, inside an effect, is the safe place to do it —
    // not during render (see App.tsx, which passes the ref itself rather
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
    if (!canvas) {
      complete();
      return undefined;
    }

    const gl: GL | null =
      canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false }) ??
      canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });

    if (!gl) {
      complete();
      return undefined;
    }

    let program: WebGLProgram | undefined;
    let texture: WebGLTexture | undefined;
    let buffer: WebGLBuffer | undefined;
    let frame = 0;
    let start: number | null = null;
    let elapsedAtPause = 0;
    let cancelled = false;

    const onContextLost = (event: Event) => {
      event.preventDefault();
      complete();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    const setup = async (): Promise<(() => void) | undefined> => {
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

      // The canvas covers the whole viewport, not just the résumé's own box
      // (see BurnTransition.module.scss) — the modal it used to be sized to
      // has overflow:hidden, which clipped the smoke dead at the paper's
      // edges. uRect (below) tells the shader where that paper actually is
      // within this larger canvas.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(window.innerWidth * dpr));
      const height = Math.max(1, Math.round(window.innerHeight * dpr));
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
      const uRect = gl.getUniformLocation(program, 'uRect');
      const uProgress = gl.getUniformLocation(program, 'uProgress');
      const uSeed = gl.getUniformLocation(program, 'uSeed');
      const uOrigin = gl.getUniformLocation(program, 'uOrigin');
      const uFinishAt = gl.getUniformLocation(program, 'uFinishAt');
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

      // Where the résumé itself sits within this viewport-sized canvas, in
      // the same bottom-up 0..1 space gl_FragCoord uses (getBoundingClientRect
      // is top-down from the viewport, hence the y flip). Computed once,
      // same as the canvas size above — this is a one-shot close transition,
      // not something that needs to track a mid-burn window resize.
      const nodeRect = sourceNode.getBoundingClientRect();
      const rectX0 = (nodeRect.left * dpr) / width;
      const rectX1 = ((nodeRect.left + nodeRect.width) * dpr) / width;
      const rectY0 = 1 - ((nodeRect.top + nodeRect.height) * dpr) / height;
      const rectY1 = 1 - (nodeRect.top * dpr) / height;
      gl.uniform4f(uRect, rectX0, rectY0, rectX1, rectY1);

      // Runs way past 1 so smoke keeps drifting long after the paper itself
      // has fully burned away (which still finishes around progress 1, at
      // the same pace as before) before burn.frag's own final dissolve (the
      // last ~15% of this range) kicks in — smoke no longer decays on its
      // own, so this cutoff is sized for "let it hang in the air for a
      // while, then one clean fade," not "wait for per-pixel decay to
      // finish."
      const finishAt = 9;
      gl.uniform1f(uFinishAt, finishAt);

      const loop = (now: number) => {
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

    let cleanupVisibility: (() => void) | undefined;
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
