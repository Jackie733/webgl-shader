import './App.css';
import { useRef } from 'react';
import { createShader } from './demos/basic';
import { createCanvas } from './demos/canvas';
import { createVectorTree } from './demos/vector-tree';
import { useCanvasManager } from './hooks/useCanvasManager';
import { createShape } from './demos/shape';
import { createCurve } from './demos/curve';

function App() {
  const containerRef = useRef(null);
  const { switchToWebGL, switchTo2D, getCurrentCanvas } =
    useCanvasManager(containerRef);

  const render = (type, func, needCanvas) => {
    if (type === 'webgl') {
      const gl = switchToWebGL();
      const canvas = getCurrentCanvas();
      if (!gl) return;
      if (needCanvas) {
        func(canvas);
      } else {
        func(gl);
      }
    } else if (type === '2d') {
      const ctx = switchTo2D();
      const canvas = getCurrentCanvas();
      if (!ctx) return;
      if (needCanvas) {
        func(canvas);
      } else {
        func(ctx);
      }
    }
  };

  return (
    <div className="container">
      <ul>
        <li onClick={() => render('webgl', createShader)}>basic</li>
        <li onClick={() => render('2d', createCanvas, true)}>sun rise</li>
        <li onClick={() => render('2d', createVectorTree, true)}>
          vector tree
        </li>
        <li onClick={() => render('2d', createShape, true)}>regular shape</li>
        <li onClick={() => render('2d', createCurve, true)}>curves</li>
      </ul>
      <div id="canvas-container" ref={containerRef}></div>
    </div>
  );
}

export default App;
