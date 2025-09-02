import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { useWebGL } from '@/hooks/useWebGL';
import { shaderConfigs } from '@/configs/shaderConfigs';

export default function Shader() {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState([0, 0]);
  const [currentShaderIndex, setCurrentShaderIndex] = useState(0);
  const [showSelector, setShowSelector] = useState(false);

  // 获取当前shader配置
  const currentShader = shaderConfigs[currentShaderIndex];

  // 添加鼠标移动监听器
  useEffect(() => {
    const handleMouseMove = (event) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = rect.height - (event.clientY - rect.top); // 翻转Y坐标以匹配WebGL坐标系
        setMousePos([x, y]);
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      return () => canvas.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const webGLOptions = useMemo(() => {
    const vertices = currentShader.getVertices();
    const indices = currentShader.getIndices();
    const FSIZE = vertices.BYTES_PER_ELEMENT;

    const options = {
      vertexShaderSource: currentShader.vertexShaderSource,
      fragmentShaderSource: currentShader.fragmentShaderSource,
      vertices,
      indices,
      vertexLayout: {
        stride: currentShader.vertexLayout.stride,
        attributes: currentShader.vertexLayout.attributes.map((attr) => ({
          ...attr,
          type: attr.type || 0x1406 /* WebGLRenderingContext.FLOAT */,
        })),
      },
      drawConfig: {
        mode: 0x0004 /* WebGLRenderingContext.TRIANGLES */,
        count: indices
          ? indices.length
          : vertices.length / (currentShader.vertexLayout.stride / FSIZE),
        useElements: Boolean(indices),
      },
      // Performance and feature configurations
      enableDebug: true,
      maxFPS: 60,
      autoResize: true,
      // Blending configuration for transparency effects
      blending: {
        enabled: true,
        srcFactor: 0x0302, // gl.SRC_ALPHA
        dstFactor: 0x0303, // gl.ONE_MINUS_SRC_ALPHA
      },
      // Depth testing (not needed for 2D, but shown for completeness)
      depth: {
        enabled: false,
      },
      // Uniforms from shader config
      uniforms: { ...currentShader.uniforms },
    };
    return options;
  }, [currentShader]);

  // Enhanced render callback with dynamic uniform updates
  const onRender = useCallback(
    (gl, program, time) => {
      const canvas = gl.canvas;

      // Update time uniform if it exists
      if (webGLOptions.uniforms.u_time) {
        webGLOptions.uniforms.u_time.value = time * 0.001;
      }

      // Update resolution uniform if it exists
      if (webGLOptions.uniforms.u_resolution) {
        webGLOptions.uniforms.u_resolution.value = [
          canvas.width,
          canvas.height,
        ];
      }

      // Update mouse uniform if it exists
      if (webGLOptions.uniforms.u_mouse) {
        webGLOptions.uniforms.u_mouse.value = mousePos;
      }
    },
    [webGLOptions.uniforms, mousePos]
  );

  // Use the enhanced hook with performance monitoring
  const { fps, gl, program } = useWebGL(canvasRef, {
    ...webGLOptions,
    onRender,
  });

  return (
    <div className="flex h-full w-full flex-col relative">
      {/* Shader选择器 */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          选择Shader ({currentShaderIndex + 1}/{shaderConfigs.length})
        </button>

        {showSelector && (
          <div className="absolute top-12 left-0 bg-black bg-opacity-90 text-white rounded-lg shadow-xl p-4 min-w-64 max-h-80 overflow-y-auto">
            <h3 className="text-lg font-bold mb-3">Shader Demo</h3>
            {shaderConfigs.map((shader, index) => (
              <div
                key={shader.id}
                onClick={() => {
                  setCurrentShaderIndex(index);
                  setShowSelector(false);
                }}
                className={`p-3 rounded cursor-pointer transition-colors mb-2 ${
                  index === currentShaderIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="font-semibold">{shader.name}</div>
                <div className="text-sm text-gray-300 mt-1">
                  {shader.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 当前Shader信息 */}
      <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-75 text-white p-3 rounded-lg text-sm">
        <div className="font-bold text-blue-300">{currentShader.name}</div>
        <div className="text-gray-300 text-xs mt-1">
          {currentShader.description}
        </div>
      </div>

      {/* Performance display */}
      {webGLOptions.enableDebug && (
        <div className="absolute top-24 right-4 z-10 bg-black bg-opacity-75 text-white p-2 rounded text-sm font-mono">
          <div>FPS: {fps}</div>
          <div>WebGL: {gl ? '✓' : '✗'}</div>
          <div>Program: {program ? '✓' : '✗'}</div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
