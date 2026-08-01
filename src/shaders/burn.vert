// Full-screen triangle. Larger than the viewport on purpose: one triangle
// clipped to the screen beats two triangles meeting on a seam.
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
