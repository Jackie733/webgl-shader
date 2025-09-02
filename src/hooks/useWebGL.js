import { useEffect, useRef, useCallback, useMemo, useState } from 'react';

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
 * @property {boolean} [useElements=false] - Whether to use element array buffer for indexed drawing.
 */

/**
 * @typedef {object} WebGLUniform
 * @property {'1f'|'2f'|'3f'|'4f'|'1i'|'2i'|'3i'|'4i'|'Matrix2fv'|'Matrix3fv'|'Matrix4fv'} type - The uniform type.
 * @property {number|number[]|Float32Array} value - The uniform value.
 */

/**
 * @typedef {object} WebGLTextureConfig
 * @property {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageData} source - The texture source.
 * @property {number} [wrapS] - Texture wrap mode for S coordinate.
 * @property {number} [wrapT] - Texture wrap mode for T coordinate.
 * @property {number} [minFilter] - Texture minification filter.
 * @property {number} [magFilter] - Texture magnification filter.
 * @property {boolean} [generateMipmap=true] - Whether to generate mipmaps.
 * @property {boolean} [flipY=true] - Whether to flip Y coordinate.
 */

/**
 * @typedef {object} WebGLBlendConfig
 * @property {boolean} enabled - Whether blending is enabled.
 * @property {number} [srcFactor] - Source blending factor.
 * @property {number} [dstFactor] - Destination blending factor.
 * @property {number} [equation] - Blending equation.
 */

/**
 * @typedef {object} WebGLDepthConfig
 * @property {boolean} enabled - Whether depth testing is enabled.
 * @property {number} [func] - Depth test function.
 * @property {boolean} [mask=true] - Whether depth buffer is writable.
 */

/**
 * @callback OnRenderCallback
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {WebGLProgram} program - The compiled and linked WebGL program.
 * @param {number} time - The high-resolution timestamp from requestAnimationFrame.
 * @param {number} deltaTime - Time elapsed since last frame in milliseconds.
 * @returns {void}
 */

/**
 * @typedef {object} WebGLOptions
 * @property {string} vertexShaderSource - The source code for the vertex shader.
 * @property {string} fragmentShaderSource - The source code for the fragment shader.
 * @property {WebGLVertexLayout} vertexLayout - The layout description of the vertex data.
 * @property {Float32Array} vertices - The vertex data.
 * @property {Uint16Array|Uint32Array} [indices] - The index data for element drawing.
 * @property {WebGLDrawConfig} drawConfig - The instructions for drawing.
 * @property {Record<string, WebGLUniform>} [uniforms] - Uniform variables to set each frame.
 * @property {Record<string, WebGLTextureConfig>} [textures] - Texture configurations.
 * @property {WebGLBlendConfig} [blending] - Blending configuration.
 * @property {WebGLDepthConfig} [depth] - Depth testing configuration.
 * @property {OnRenderCallback} [onRender] - A callback function executed on each animation frame.
 * @property {boolean} [enableDebug=false] - Enable WebGL debugging and performance monitoring.
 * @property {number} [maxFPS=60] - Maximum frames per second (0 for unlimited).
 * @property {boolean} [autoResize=true] - Automatically resize canvas to fit container.
 */

/**
 * Initializes and links a WebGL program from vertex and fragment shader sources.
 * @private
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {string} vertexShaderSource - Vertex shader GLSL source.
 * @param {string} fragmentShaderSource - Fragment shader GLSL source.
 * @param {boolean} enableDebug - Whether to enable detailed error logging.
 * @returns {WebGLProgram|null} The linked WebGL program or null if an error occurs.
 */
function initWebGLProgram(
  gl,
  vertexShaderSource,
  fragmentShaderSource,
  enableDebug = false
) {
  const createShader = (type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      console.error(
        `Shader compilation error (${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'}):`,
        log
      );
      if (enableDebug) {
        console.error('Shader source:', source);
      }
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
    const log = gl.getProgramInfoLog(program);
    console.error('Program linking error:', log);
    if (enableDebug) {
      console.error('Vertex shader:', vertexShaderSource);
      console.error('Fragment shader:', fragmentShaderSource);
    }
    gl.deleteProgram(program);
    return null;
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * Creates and configures a WebGL texture.
 * @private
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {WebGLTextureConfig} config - Texture configuration.
 * @returns {WebGLTexture|null} The created texture or null if failed.
 */
function createTexture(gl, config) {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set texture parameters
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_S,
    config.wrapS || gl.CLAMP_TO_EDGE
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_T,
    config.wrapT || gl.CLAMP_TO_EDGE
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    config.minFilter || gl.LINEAR
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    config.magFilter || gl.LINEAR
  );

  // Set pixel store parameters
  if (config.flipY !== undefined) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, config.flipY);
  }

  // Upload texture data
  if (
    config.source instanceof HTMLImageElement ||
    config.source instanceof HTMLCanvasElement ||
    config.source instanceof HTMLVideoElement
  ) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      config.source
    );
  } else if (config.source instanceof ImageData) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      config.source.width,
      config.source.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      config.source.data
    );
  }

  // Generate mipmaps if requested
  if (config.generateMipmap !== false) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

/**
 * Sets a uniform value in the shader program.
 * @private
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {WebGLProgram} program - The shader program.
 * @param {string} name - The uniform name.
 * @param {WebGLUniform} uniform - The uniform configuration.
 */
function setUniform(gl, program, name, uniform) {
  const location = gl.getUniformLocation(program, name);
  if (location === null) {
    console.warn(`Uniform '${name}' not found in shader.`);
    return;
  }

  switch (uniform.type) {
    case '1f':
      gl.uniform1f(location, uniform.value);
      break;
    case '2f':
      gl.uniform2fv(location, uniform.value);
      break;
    case '3f':
      gl.uniform3fv(location, uniform.value);
      break;
    case '4f':
      gl.uniform4fv(location, uniform.value);
      break;
    case '1i':
      gl.uniform1i(location, uniform.value);
      break;
    case '2i':
      gl.uniform2iv(location, uniform.value);
      break;
    case '3i':
      gl.uniform3iv(location, uniform.value);
      break;
    case '4i':
      gl.uniform4iv(location, uniform.value);
      break;
    case 'Matrix2fv':
      gl.uniformMatrix2fv(location, false, uniform.value);
      break;
    case 'Matrix3fv':
      gl.uniformMatrix3fv(location, false, uniform.value);
      break;
    case 'Matrix4fv':
      gl.uniformMatrix4fv(location, false, uniform.value);
      break;
    default:
      console.warn(`Unknown uniform type: ${uniform.type}`);
  }
}

/**
 * Configures WebGL state based on options.
 * @private
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {WebGLOptions} options - The WebGL options.
 */
function configureWebGLState(gl, options) {
  // Configure blending
  if (options.blending) {
    if (options.blending.enabled) {
      gl.enable(gl.BLEND);
      gl.blendFunc(
        options.blending.srcFactor || gl.SRC_ALPHA,
        options.blending.dstFactor || gl.ONE_MINUS_SRC_ALPHA
      );
      if (options.blending.equation) {
        gl.blendEquation(options.blending.equation);
      }
    } else {
      gl.disable(gl.BLEND);
    }
  }

  // Configure depth testing
  if (options.depth) {
    if (options.depth.enabled) {
      gl.enable(gl.DEPTH_TEST);
      if (options.depth.func) {
        gl.depthFunc(options.depth.func);
      }
      gl.depthMask(options.depth.mask !== false);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }
}

/**
 * A custom React hook to encapsulate WebGL rendering logic with performance optimizations.
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - A ref to the canvas element.
 * @param {WebGLOptions} options - The configuration options for WebGL rendering.
 */
export function useWebGL(canvasRef, options) {
  const glRef = useRef(null);
  const programRef = useRef(null);
  const buffersRef = useRef({});
  const texturesRef = useRef({});
  const lastFrameTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsRef = useRef(0);
  const resizeObserverRef = useRef(null);

  // 使用 useState 来管理 FPS，以便 UI 能够实时更新
  const [fps, setFps] = useState(0);

  // Memoize static options to prevent unnecessary re-renders
  const staticOptions = useMemo(
    () => ({
      vertexShaderSource: options.vertexShaderSource,
      fragmentShaderSource: options.fragmentShaderSource,
      vertexLayout: options.vertexLayout,
      vertices: options.vertices,
      indices: options.indices,
      enableDebug: options.enableDebug || false,
      maxFPS: options.maxFPS || 60,
      autoResize: options.autoResize !== false,
    }),
    [
      options.vertexShaderSource,
      options.fragmentShaderSource,
      options.vertexLayout,
      options.vertices,
      options.indices,
      options.enableDebug,
      options.maxFPS,
      options.autoResize,
    ]
  );

  // Performance monitoring callback
  const updatePerformanceMetrics = useCallback(
    (time) => {
      frameCountRef.current++;
      const deltaTime = time - lastFrameTimeRef.current;

      if (deltaTime >= 1000) {
        // Update FPS every second
        const newFps = Math.round((frameCountRef.current * 1000) / deltaTime);
        fpsRef.current = newFps;
        setFps(newFps); // 更新 state 以触发 UI 重新渲染
        frameCountRef.current = 0;
        lastFrameTimeRef.current = time;

        if (staticOptions.enableDebug) {
          console.log(`FPS: ${newFps}`);
        }
      }
    },
    [staticOptions.enableDebug]
  );

  // Initialization Effect: Runs when shaders, vertices, or layout change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Validation
    if (!staticOptions.vertexLayout?.attributes?.length) {
      console.error('No vertex attributes defined');
      return;
    }

    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      depth: true,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.error('WebGL not supported!');
      return;
    }
    glRef.current = gl;

    if (staticOptions.enableDebug) {
      console.log('WebGL context initialized');
      console.log('WebGL version:', gl.getParameter(gl.VERSION));
      console.log('Vendor:', gl.getParameter(gl.VENDOR));
      console.log('Renderer:', gl.getParameter(gl.RENDERER));
    }

    const program = initWebGLProgram(
      gl,
      staticOptions.vertexShaderSource,
      staticOptions.fragmentShaderSource,
      staticOptions.enableDebug
    );
    if (!program) return;
    programRef.current = program;

    // Create and bind vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, staticOptions.vertices, gl.STATIC_DRAW);
    buffersRef.current.vertex = vertexBuffer;

    // Create and bind index buffer if provided
    if (staticOptions.indices) {
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        staticOptions.indices,
        gl.STATIC_DRAW
      );
      buffersRef.current.index = indexBuffer;
    }

    let offset = 0;
    const FSIZE = staticOptions.vertices.BYTES_PER_ELEMENT;

    // 首先禁用所有可能的顶点属性 (0-15是WebGL保证支持的属性数量)
    for (let i = 0; i < 16; i++) {
      gl.disableVertexAttribArray(i);
    }

    // 然后只启用我们需要的属性
    staticOptions.vertexLayout.attributes.forEach((attr) => {
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
        staticOptions.vertexLayout.stride,
        offset
      );
      gl.enableVertexAttribArray(location);

      offset += attr.size * FSIZE;
    });

    // Setup auto-resize if enabled
    if (staticOptions.autoResize && window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
      });
      resizeObserverRef.current.observe(canvas.parentElement || canvas);
    }

    // Cleanup function
    return () => {
      if (programRef.current) {
        gl.deleteProgram(programRef.current);
        programRef.current = null;
      }
      if (buffersRef.current.vertex) {
        gl.deleteBuffer(buffersRef.current.vertex);
      }
      if (buffersRef.current.index) {
        gl.deleteBuffer(buffersRef.current.index);
      }
      Object.values(texturesRef.current).forEach((texture) => {
        gl.deleteTexture(texture);
      });
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      buffersRef.current = {};
      texturesRef.current = {};
    };
  }, [canvasRef, staticOptions, updatePerformanceMetrics]);

  // Memoize dynamic options to prevent unnecessary re-renders
  const dynamicOptions = useMemo(
    () => ({
      drawConfig: options.drawConfig,
      uniforms: options.uniforms,
      textures: options.textures,
      blending: options.blending,
      depth: options.depth,
      onRender: options.onRender,
    }),
    [
      options.drawConfig,
      options.uniforms,
      options.textures,
      options.blending,
      options.depth,
      options.onRender,
    ]
  );

  // Render Loop Effect: Runs when draw/render configurations change.
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    let animationFrameId;
    let lastTime = 0;
    const targetFrameTime =
      staticOptions.maxFPS > 0 ? 1000 / staticOptions.maxFPS : 0;

    // Initialize textures
    if (dynamicOptions.textures) {
      Object.entries(dynamicOptions.textures).forEach(
        ([name, config], index) => {
          if (!texturesRef.current[name]) {
            const texture = createTexture(gl, config);
            if (texture) {
              texturesRef.current[name] = texture;
            }
          }

          // Bind texture to texture unit
          gl.activeTexture(gl.TEXTURE0 + index);
          gl.bindTexture(gl.TEXTURE_2D, texturesRef.current[name]);

          // Set texture uniform
          const location = gl.getUniformLocation(program, name);
          if (location !== null) {
            gl.uniform1i(location, index);
          }
        }
      );
    }

    const render = (time) => {
      // FPS limiting
      if (targetFrameTime > 0 && time - lastTime < targetFrameTime) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const deltaTime = time - lastTime;
      lastTime = time;

      // Performance monitoring
      updatePerformanceMetrics(time);

      // Auto-resize handling (fallback for browsers without ResizeObserver)
      if (staticOptions.autoResize && !window.ResizeObserver) {
        const canvas = gl.canvas;
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          canvas.width = displayWidth;
          canvas.height = displayHeight;
          gl.viewport(0, 0, displayWidth, displayHeight);
        }
      }

      // Configure WebGL state
      configureWebGLState(gl, dynamicOptions);

      // Clear the canvas
      gl.clearColor(0.1, 0.1, 0.1, 1.0);
      let clearMask = gl.COLOR_BUFFER_BIT;
      if (dynamicOptions.depth?.enabled) {
        clearMask |= gl.DEPTH_BUFFER_BIT;
      }
      gl.clear(clearMask);

      gl.useProgram(program);

      // 确保正确绑定顶点缓冲区
      if (buffersRef.current.vertex) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.vertex);
      }

      // 如果使用索引，确保绑定索引缓冲区
      if (dynamicOptions.drawConfig.useElements && buffersRef.current.index) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffersRef.current.index);
      }

      // Set uniforms
      if (dynamicOptions.uniforms) {
        Object.entries(dynamicOptions.uniforms).forEach(([name, uniform]) => {
          setUniform(gl, program, name, uniform);
        });
      }

      // Execute the user-provided render callback
      if (dynamicOptions.onRender) {
        dynamicOptions.onRender(gl, program, time, deltaTime);
      }

      // Execute the draw call
      if (dynamicOptions.drawConfig.useElements && buffersRef.current.index) {
        const indexType =
          staticOptions.indices instanceof Uint32Array
            ? gl.UNSIGNED_INT
            : gl.UNSIGNED_SHORT;
        gl.drawElements(
          dynamicOptions.drawConfig.mode,
          dynamicOptions.drawConfig.count,
          indexType,
          (dynamicOptions.drawConfig.offset || 0) *
            (indexType === gl.UNSIGNED_INT ? 4 : 2)
        );
      } else {
        gl.drawArrays(
          dynamicOptions.drawConfig.mode,
          dynamicOptions.drawConfig.offset || 0,
          dynamicOptions.drawConfig.count
        );
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    // Cleanup function to cancel animation frame on component unmount
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [staticOptions, dynamicOptions, updatePerformanceMetrics]);

  // Return performance metrics and utility functions
  return {
    fps, // 使用 state 中的 fps 值
    gl: glRef.current,
    program: programRef.current,
  };
}
