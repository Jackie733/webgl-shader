import { useState, useEffect, useRef } from 'react';
import ScriptContextManager from '@/utils/script-context-manager';
import { useCanvasManager } from '@/hooks/useCanvasManager';

export default function Demos() {
  const containerRef = useRef(null);
  const canvasManager = useCanvasManager(containerRef);
  const [scriptManager] = useState(() => new ScriptContextManager());

  useEffect(() => {
    scriptManager.setCanvasManager(canvasManager);
  }, [scriptManager, canvasManager]);

  const loadScript = async (path, options = {}) => {
    try {
      const instance = await scriptManager.loadScript(path, options);
      return instance;
    } catch (error) {
      console.error('Error loading script:', error);
      throw error;
    }
  };
  return (
    <div className="container">
      <ul>
        <li onClick={() => loadScript('/basic.js', { canvasType: 'webgl' })}>
          basic
        </li>
        <li onClick={() => loadScript('/canvas.js', { needCanvas: true })}>
          sun rise
        </li>
        <li onClick={() => loadScript('/vector-tree.js', { needCanvas: true })}>
          vector tree
        </li>
        <li onClick={() => loadScript('/shape.js', { needCanvas: true })}>
          regular shape
        </li>
        <li onClick={() => loadScript('/curve', { needCanvas: true })}>
          curves
        </li>
        <li
          onClick={() => loadScript('webgl-fill.js', { canvasType: 'webgl' })}
        >
          webgl fill
        </li>
        <li
          onClick={() =>
            loadScript('/basic-particle-animation.js', { canvasType: 'webgl' })
          }
        >
          particle animation
        </li>
      </ul>
      <div id="canvas-container" ref={containerRef}></div>
    </div>
  );
}
