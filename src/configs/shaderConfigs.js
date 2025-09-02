// Shader 配置文件
import vertexShaderSource from '@/shaders/vertex.glsl';
import fragmentShaderSource from '@/shaders/fragment.glsl';

// 基础彩色矩形shader
export const coloredRectangleShader = {
  id: 'colored-rectangle',
  name: '彩色矩形',
  description: '基础的彩色矩形，支持鼠标交互和时间动画',
  vertexShaderSource,
  fragmentShaderSource,
  getVertices: () =>
    new Float32Array([
      -0.8,
      -0.8,
      1.0,
      0.0,
      0.0, // Bottom-left (Red)
      0.8,
      -0.8,
      0.0,
      1.0,
      0.0, // Bottom-right (Green)
      -0.8,
      0.8,
      0.0,
      0.0,
      1.0, // Top-left (Blue)
      0.8,
      0.8,
      1.0,
      1.0,
      0.0, // Top-right (Yellow)
    ]),
  getIndices: () => new Uint16Array([0, 1, 2, 2, 1, 3]),
  vertexLayout: {
    stride: 5 * 4, // 5 floats per vertex * 4 bytes per float
    attributes: [
      { name: 'a_position', size: 2, type: 0x1406 },
      { name: 'a_color', size: 3, type: 0x1406 },
    ],
  },
  uniforms: {
    u_time: { type: '1f', value: 0 },
    u_resolution: { type: '2f', value: [800, 600] },
    u_mouse: { type: '2f', value: [0, 0] },
  },
};

// 简单三角形shader
export const simpleTriangleShader = {
  id: 'simple-triangle',
  name: '简单三角形',
  description: '基础的单色三角形',
  vertexShaderSource: `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `,
  fragmentShaderSource: `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec3 color = vec3(
        0.5 + 0.5 * sin(u_time),
        0.5 + 0.5 * sin(u_time + 2.094),
        0.5 + 0.5 * sin(u_time + 4.188)
      );
      gl_FragColor = vec4(color * (1.0 - length(uv - 0.5)), 1.0);
    }
  `,
  getVertices: () =>
    new Float32Array([
      0.0,
      0.5, // Top
      -0.5,
      -0.5, // Bottom-left
      0.5,
      -0.5, // Bottom-right
    ]),
  getIndices: () => null, // No indices needed for simple triangle
  vertexLayout: {
    stride: 2 * 4, // 2 floats per vertex * 4 bytes per float
    attributes: [{ name: 'a_position', size: 2, type: 0x1406 }],
  },
  uniforms: {
    u_time: { type: '1f', value: 0 },
    u_resolution: { type: '2f', value: [800, 600] },
  },
};

// 波形shader
export const waveShader = {
  id: 'wave',
  name: '波形效果',
  description: '动态波形图案',
  vertexShaderSource: `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `,
  fragmentShaderSource: `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec2 mouse = u_mouse / u_resolution.xy;
      
      // 创建波形效果
      float wave1 = sin(uv.x * 10.0 + u_time) * 0.1;
      float wave2 = sin(uv.y * 8.0 + u_time * 1.5) * 0.1;
      float wave3 = sin(length(uv - mouse) * 20.0 - u_time * 3.0) * 0.05;
      
      float intensity = wave1 + wave2 + wave3;
      
      vec3 color1 = vec3(0.1, 0.3, 0.8);
      vec3 color2 = vec3(0.8, 0.1, 0.3);
      vec3 finalColor = mix(color1, color2, intensity + 0.5);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  getVertices: () =>
    new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
  getIndices: () => new Uint16Array([0, 1, 2, 2, 1, 3]),
  vertexLayout: {
    stride: 2 * 4, // 2 floats per vertex * 4 bytes per float
    attributes: [{ name: 'a_position', size: 2, type: 0x1406 }],
  },
  uniforms: {
    u_time: { type: '1f', value: 0 },
    u_resolution: { type: '2f', value: [800, 600] },
    u_mouse: { type: '2f', value: [0, 0] },
  },
};

// 分形shader
export const fractalShader = {
  id: 'fractal',
  name: '分形图案',
  description: 'Mandelbrot分形图案',
  vertexShaderSource: `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `,
  fragmentShaderSource: `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    void main() {
      vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / min(u_resolution.x, u_resolution.y);
      vec2 mouse = (u_mouse - u_resolution.xy * 0.5) / min(u_resolution.x, u_resolution.y);
      
      // 缩放和平移
      uv *= 2.0;
      uv += mouse * 0.5;
      
      vec2 z = uv;
      vec2 c = uv + vec2(sin(u_time * 0.1), cos(u_time * 0.1)) * 0.3;
      
      int maxIter = 100;
      int iter;
      
      for(int i = 0; i < 100; i++) {
        if(length(z) > 2.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iter = i;
      }
      
      float t = float(iter) / float(maxIter);
      vec3 color = hsv2rgb(vec3(t * 6.0 + u_time * 0.5, 0.8, t));
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  getVertices: () =>
    new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
  getIndices: () => new Uint16Array([0, 1, 2, 2, 1, 3]),
  vertexLayout: {
    stride: 2 * 4, // 2 floats per vertex * 4 bytes per float
    attributes: [{ name: 'a_position', size: 2, type: 0x1406 }],
  },
  uniforms: {
    u_time: { type: '1f', value: 0 },
    u_resolution: { type: '2f', value: [800, 600] },
    u_mouse: { type: '2f', value: [0, 0] },
  },
};

// 导出所有shader配置
export const shaderConfigs = [
  coloredRectangleShader,
  simpleTriangleShader,
  waveShader,
  fractalShader,
];

export default shaderConfigs;
