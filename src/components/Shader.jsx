import { useRef, useMemo, useCallback } from 'react';
import { useWebGL } from '@/hooks/useWebGL';
import vertexShaderSource from '@/shaders/vertex.glsl';
import fragmentShaderSource from '@/shaders/fragment.glsl';

export default function Shader() {
  const canvasRef = useRef(null);

  const webGLOptions = useMemo(() => {
    // A rectangle composed of two triangles.
    // Vertex data is interleaved: [x, y, r, g, b, ...].
    const vertices = new Float32Array([
      // Triangle 1
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
      // Triangle 2
      -0.8,
      0.8,
      0.0,
      0.0,
      1.0, // Top-left (Blue)
      0.8,
      -0.8,
      0.0,
      1.0,
      0.0, // Bottom-right (Green)
      0.8,
      0.8,
      1.0,
      1.0,
      0.0, // Top-right (Yellow)
    ]);

    const FSIZE = vertices.BYTES_PER_ELEMENT;

    const options = {
      vertexShaderSource,
      fragmentShaderSource,
      vertices,
      vertexLayout: {
        // Stride: The size in bytes of one full vertex (2 position floats + 3 color floats).
        stride: FSIZE * 5,
        attributes: [
          // NOTE: The `type` property requires a WebGL context, but we don't have one here.
          // We'll use the raw GLenum numbers. gl.FLOAT is 0x1406.
          {
            name: 'a_position',
            size: 2,
            type: 0x1406 /* WebGLRenderingContext.FLOAT */,
          },
          {
            name: 'a_color',
            size: 3,
            type: 0x1406 /* WebGLRenderingContext.FLOAT */,
          },
        ],
      },
      drawConfig: {
        // We are drawing triangles, and there are 6 vertices in total.
        mode: 0x0004 /* WebGLRenderingContext.TRIANGLES */,
        count: 6,
      },
    };
    return options;
  }, []);

  // useCallback ensures the onRender function reference is stable across renders.
  const onRender = useCallback((gl, program, time) => {
    // Update uniforms on each frame.
    const u_time = gl.getUniformLocation(program, 'u_time');
    gl.uniform1f(u_time, time * 0.001); // Convert ms to seconds
  }, []);

  // The hook consumes the configuration and the render callback.
  useWebGL(canvasRef, { ...webGLOptions, onRender });

  return (
    <div className="flex h-full w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
