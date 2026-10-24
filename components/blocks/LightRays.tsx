'use client';

/**
 * Stage light: shafts of light from a point (top centre, a corner…) fanning in one direction,
 * slowly shimmering. Plain WebGL, one fragment shader, no library. Runs only while on screen,
 * and draws a single still frame for those who prefer reduced motion.
 */
import { useEffect, useRef } from 'react';

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uOrigin;   // in pixels, from the top left
uniform vec2 uDir;      // where the light points (normalised)
uniform float uSpread;  // the cone: 1 = a pencil, 0 = a half plane
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uIntensity;

float shafts(vec2 p, float a, float b, float speed) {
  vec2 d = p - uOrigin;
  float len = length(d);
  vec2 n = d / max(len, 1.0);
  float cone = smoothstep(1.0 - uSpread, 1.0, dot(n, uDir));
  float ang = atan(n.y, n.x);
  float s = 0.45 + 0.15 * sin(ang * a + uTime * speed) + 0.3 + 0.2 * cos(-ang * b + uTime * speed * 0.7);
  float fall = clamp(1.0 - len / (max(uRes.x, uRes.y) * 1.15), 0.0, 1.0);
  return clamp(s, 0.0, 1.0) * cone * fall * fall;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float r1 = shafts(p, 36.2214, 21.11349, 0.9);
  float r2 = shafts(p, 22.3991, 18.0234, 0.6);
  float glow = exp(-length(p - uOrigin) / (max(uRes.x, uRes.y) * 0.22));
  float light = (r1 * 0.55 + r2 * 0.4 + glow * 0.45) * uIntensity;
  vec3 col = mix(uColorB, uColorA, clamp(r1 + glow, 0.0, 1.0));
  gl_FragColor = vec4(col * light, light);
}
`;

const rgb = (hex: string) => {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export default function LightRays({
  origin = [0.5, -0.05],
  direction = [0, 1],
  spread = 0.45,
  colors = ['#ffd27a', '#eb6838'],
  intensity = 1,
  className = '',
}: {
  /** Where the light comes from, as fractions of the box (0–1; a little outside is fine). */
  origin?: [number, number];
  /** Where it points. */
  direction?: [number, number];
  spread?: number;
  /** The core and the edge of the light. */
  colors?: [string, string];
  /** How bright (1: full). */
  intensity?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  // the arrays arrive as new objects on every render: restart only when their values change
  const settings = JSON.stringify({ origin, direction, spread, colors, intensity });

  useEffect(() => {
    const { origin, direction, spread, colors, intensity } = JSON.parse(settings) as {
      origin: [number, number];
      direction: [number, number];
      spread: number;
      colors: [string, string];
      intensity: number;
    };
    const canvas = ref.current;
    const gl = canvas?.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    if (!canvas || !gl) return;
    const shader = (type: number, src: string) => {
      const sh = gl.createShader(type) as WebGLShader;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    // biome-ignore lint/correctness/useHookAtTopLevel: WebGL's useProgram, not a React hook
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const [dx, dy] = direction;
    const dl = Math.hypot(dx, dy) || 1;
    gl.uniform2f(u('uDir'), dx / dl, dy / dl);
    gl.uniform1f(u('uSpread'), spread);
    gl.uniform3fv(u('uColorA'), rgb(colors[0]));
    gl.uniform3fv(u('uColorB'), rgb(colors[1]));
    gl.uniform1f(u('uIntensity'), intensity);

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * scale);
      canvas.height = Math.round(canvas.clientHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u('uRes'), canvas.width, canvas.height);
      gl.uniform2f(u('uOrigin'), origin[0] * canvas.width, origin[1] * canvas.height);
    };
    resize();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let visible = true;
    const draw = (t: number) => {
      gl.uniform1f(u('uTime'), still ? 12 : t / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!still && visible) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    const seen = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(draw);
    });
    seen.observe(canvas);
    const sized = new ResizeObserver(resize);
    sized.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      seen.disconnect();
      sized.disconnect();
      // not loseContext(): the canvas keeps its context, and a remount (React's dev double run) reuses it
      gl.deleteProgram(program);
    };
  }, [settings]);

  return <canvas ref={ref} className={`pointer-events-none h-full w-full ${className}`} />;
}
