// Ambient WebGL Gradient Background (vanilla-JS port of the "Velaris" shader component)
// Renders an animated simplex-noise gradient with vignette + film grain behind a container's
// content. Pure vanilla WebGL so it plugs into this app's framework-free architecture.

const VERTEX_SHADER_SRC = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;
varying vec2 vUv;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3  u_colors[4];
uniform vec3  u_bg;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float ratio = u_resolution.x / u_resolution.y;
  vec2 p = uv - 0.5;
  p.x *= ratio;

  float t = u_time * 0.1;

  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);

  vec3 col = u_bg;

  float dist = length(p) * 1.5;
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);

  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);

  float glow = smoothstep(0.8, 0.0, dist) * 0.3;
  col += u_colors[1] * glow;

  col = mix(col * 0.2, col, vignette);

  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.1;

  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255
  ];
}

/**
 * Mounts an animated WebGL gradient canvas as an absolutely-positioned background layer
 * inside `container` (which must be position:relative and non-static in CSS).
 */
export class ShaderBackground {
  constructor(container, options = {}) {
    this.container = container;
    this.bg = options.bg || "#121b10";
    this.colors = options.colors || ["#ACC8A2", "#78a873", "#22321f", "#000000"];
    this.speed = options.speed ?? 1.4;
    this.grain = options.grain ?? 0.25;

    this.canvas = null;
    this.gl = null;
    this.raf = null;
    this.resizeObserver = null;
  }

  init() {
    if (!this.container) return false;

    const canvas = document.createElement("canvas");
    canvas.className = "shader-bg-canvas";
    this.container.insertBefore(canvas, this.container.firstChild);
    this.canvas = canvas;

    const gl = canvas.getContext("webgl");
    if (!gl) return false;
    this.gl = gl;

    const createShader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC));
    gl.linkProgram(program);
    gl.useProgram(program);
    this.program = program;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    this.locs = {
      res: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      grain: gl.getUniformLocation(program, "u_grain"),
      colors: gl.getUniformLocation(program, "u_colors"),
      bg: gl.getUniformLocation(program, "u_bg")
    };

    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);

    const render = (t) => {
      const { gl, locs, canvas } = this;
      gl.uniform2f(locs.res, canvas.width, canvas.height);
      gl.uniform1f(locs.time, t * 0.001 * this.speed);
      gl.uniform1f(locs.grain, this.grain);
      gl.uniform3f(locs.bg, ...hexToRgb(this.bg));

      const flat = new Float32Array(this.colors.slice(0, 4).flatMap(hexToRgb));
      gl.uniform3fv(locs.colors, flat);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      this.raf = requestAnimationFrame(render);
    };
    this.raf = requestAnimationFrame(render);

    return true;
  }

  resize() {
    if (!this.canvas || !this.gl || !this.container) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.container.clientWidth * dpr;
    this.canvas.height = this.container.clientHeight * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}
