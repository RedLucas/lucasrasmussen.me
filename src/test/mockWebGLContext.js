import { vi } from 'vitest';

// jsdom has no real WebGL, so every canvas.getContext('webgl2'/'webgl') call
// resolves to null and every theme/BurnTransition component takes its own
// documented fail-open path (`if (!gl) return undefined;`). That path is
// worth testing on its own, but it leaves the actual setup/resize/draw/
// teardown logic — the bulk of these components — entirely unexercised.
// This is a minimal stand-in WebGL context implementing just the calls this
// codebase actually makes, so that logic can run for real under a test.
export function createMockGLContext() {
  return {
    // Shader/program lifecycle — every "compile" call succeeds.
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    deleteProgram: vi.fn(),
    useProgram: vi.fn(),

    // Buffers/attributes/uniforms.
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    deleteBuffer: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    getUniformLocation: vi.fn(() => ({})),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform2fv: vi.fn(),
    uniform1i: vi.fn(),

    // Textures.
    createTexture: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    pixelStorei: vi.fn(),
    activeTexture: vi.fn(),
    deleteTexture: vi.fn(),

    // Draw/frame state.
    viewport: vi.fn(),
    enable: vi.fn(),
    blendFunc: vi.fn(),
    clear: vi.fn(),
    drawArrays: vi.fn(),

    getExtension: vi.fn(() => ({ loseContext: vi.fn() })),

    // Constants referenced by name in this codebase's shader/GL calls.
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    TRIANGLES: 8,
    COLOR_BUFFER_BIT: 9,
    TEXTURE_2D: 10,
    TEXTURE0: 11,
    RGBA: 12,
    UNSIGNED_BYTE: 13,
    TEXTURE_MIN_FILTER: 14,
    TEXTURE_MAG_FILTER: 15,
    LINEAR: 16,
    TEXTURE_WRAP_S: 17,
    TEXTURE_WRAP_T: 18,
    CLAMP_TO_EDGE: 19,
    BLEND: 20,
    SRC_ALPHA: 21,
    ONE_MINUS_SRC_ALPHA: 22,
    UNPACK_FLIP_Y_WEBGL: 23,
  };
}

// Stubs HTMLCanvasElement.prototype.getContext for the duration of a test
// file so every canvas in the tree gets a fresh mock GL context instead of
// jsdom's `null`. Returns the stub for assertions plus a restore function.
export function stubCanvasGetContext() {
  const contexts = [];
  const original = HTMLCanvasElement.prototype.getContext;
  const spy = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(function stubbedGetContext(type) {
      if (type !== 'webgl2' && type !== 'webgl') return original.call(this, type);
      const gl = createMockGLContext();
      contexts.push(gl);
      return gl;
    });
  return { contexts, restore: () => spy.mockRestore() };
}
