import './App.css';
import { useState, useEffect, useRef } from 'react';
import ScriptContextManager from './utils/script-context-manager';
import { createVectorTree } from './demos/vector-tree';
import { useCanvasManager } from './hooks/useCanvasManager';
import { createShape } from './demos/shape';
import { createCurve } from './demos/curve';
import { createWebGLFill } from './demos/webgl-fill';
import { createBasicParticleAnimation } from './demos/basic-particle-animation';

function App() {
  const containerRef = useRef(null);
  const canvasManager = useCanvasManager(containerRef);
  const [scriptManager] = useState(() => new ScriptContextManager());

  useEffect(() => {
    scriptManager.setCanvasManager(canvasManager);
  }, [scriptManager, canvasManager]);

  const render = (type, func, needCanvas) => {
    if (type === 'webgl') {
      const gl = canvasManager.switchToWebGL();
      const canvas = canvasManager.getCurrentCanvas();
      if (!gl) return;
      if (needCanvas) {
        func(canvas);
      } else {
        func(gl);
      }
    } else if (type === '2d') {
      const ctx = canvasManager.switchTo2D();
      const canvas = canvasManager.getCurrentCanvas();
      if (!ctx) return;
      if (needCanvas) {
        func(canvas);
      } else {
        func(ctx);
      }
    }
  };

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
        <li onClick={() => render('2d', createVectorTree, true)}>
          vector tree
        </li>
        <li onClick={() => render('2d', createShape, true)}>regular shape</li>
        <li onClick={() => render('2d', createCurve, true)}>curves</li>
        <li onClick={() => render('webgl', createWebGLFill)}>webgl fill</li>
        <li onClick={() => render('webgl', createBasicParticleAnimation)}>
          particle animation
        </li>
      </ul>
      <div id="canvas-container" ref={containerRef}></div>
    </div>
  );
}

export default App;
