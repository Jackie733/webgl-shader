import { useEffect, useRef } from 'react';

// JSDoc Type Definitions for better Intellisense and documentation.

/**
 * @typedef {object} WebGLAttribute
 * @property {string} name - The name of the attribute in the GLSL shader.
 * @property {number} size - The number of components per vertex attribute (1, 2, 3, or 4).
 * @property {number} type - The data type of each component (e.g., gl.FLOAT).
 * @property {boolean} [normalized=false] - Whether integer data values should be normalized.
 */

/**
 * @typedef {object} WebGLVertexLayout
 * @property {WebGLAttribute[]} attributes - An array of attribute descriptions.
 * @property {number} stride - The byte size of a complete vertex. 0 means attributes are tightly packed.
 */

/**
 * @typedef {object} WebGLDrawConfig
 * @property {number} mode - The drawing mode (e.g., gl.TRIANGLES, gl.POINTS).
 * @property {number} count - The number of vertices to draw.
 * @property {number} [offset=0] - The starting index of the vertex to draw.
 */

/**
 * @callback OnRenderCallback
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {WebGLProgram} program - The compiled and linked WebGL program.
 * @param {number} time - The high-resolution timestamp from requestAnimationFrame.
 * @returns {void}
 */

/**
 * @typedef {object} WebGLOptions
 * @property {string} vertexShaderSource - The source code for the vertex shader.
 * @property {string} fragmentShaderSource - The source code for the fragment shader.
 * @property {WebGLVertexLayout} vertexLayout - The layout description of the vertex data.
 * @property {Float32Array} vertices - The vertex data.
 * @property {WebGLDrawConfig} drawConfig - The instructions for drawing.
 * @property {OnRenderCallback} [onRender] - A callback function executed on each animation frame.
 */

/**
 * Initializes and links a WebGL program from vertex and fragment shader sources.
 * @private
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {string} vertexShaderSource - Vertex shader GLSL source.
 * @param {string} fragmentShaderSource - Fragment shader GLSL source.
 * @returns {WebGLProgram|null} The linked WebGL program or null if an error occurs.
 */
function initWebGLProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const createShader = (type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * A custom React hook to encapsulate WebGL rendering logic.
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - A ref to the canvas element.
 * @param {WebGLOptions} options - The configuration options for WebGL rendering.
 */
export function useWebGL(canvasRef, options) {
  const glRef = useRef(null);
  const programRef = useRef(null);

  // Initialization Effect: Runs when shaders, vertices, or layout change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported!');
      return;
    }
    glRef.current = gl;

    const program = initWebGLProgram(
      gl,
      options.vertexShaderSource,
      options.fragmentShaderSource
    );
    if (!program) return;
    programRef.current = program;

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, options.vertices, gl.STATIC_DRAW);

    let offset = 0;
    const FSIZE = options.vertices.BYTES_PER_ELEMENT;

    options.vertexLayout.attributes.forEach((attr) => {
      const location = gl.getAttribLocation(program, attr.name);
      if (location < 0) {
        console.warn(`Attribute '${attr.name}' not found in shader.`);
        return;
      }

      gl.vertexAttribPointer(
        location,
        attr.size,
        attr.type,
        attr.normalized || false,
        options.vertexLayout.stride,
        offset
      );
      gl.enableVertexAttribArray(location);

      // The offset for the next attribute is calculated based on the current one's size
      offset += attr.size * FSIZE;
    });
  }, [
    canvasRef,
    options.vertexShaderSource,
    options.fragmentShaderSource,
    options.vertices,
    options.vertexLayout,
  ]);

  // Render Loop Effect: Runs when draw/render configurations change.
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    let animationFrameId;

    const render = (time) => {
      gl.canvas.width = gl.canvas.clientWidth;
      gl.canvas.height = gl.canvas.clientHeight;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.clearColor(0.1, 0.1, 0.1, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // Execute the user-provided render callback to update uniforms
      if (options.onRender) {
        options.onRender(gl, program, time);
      }

      // Execute the draw call using user-provided config
      gl.drawArrays(
        options.drawConfig.mode,
        options.drawConfig.offset || 0,
        options.drawConfig.count
      );

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    // Cleanup function to cancel animation frame on component unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [options.drawConfig, options.onRender]);
}
