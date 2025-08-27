import { useRef } from "react";
import { createShader } from "./utils/script";
import { createCanvas } from "./utils/canvas";
import { createVectorTree } from "./utils/vector-tree";
import { useCanvasManager } from "./hooks/useCanvasManager";
import "./App.css";

function App() {
  const containerRef = useRef(null);
  const { switchToWebGL, switchTo2D, getCurrentCanvas } =
    useCanvasManager(containerRef);

  const render = (type, func, needCanvas) => {
    if (type === "webgl") {
      const gl = switchToWebGL();
      const canvas = getCurrentCanvas();
      if (!gl) return;
      if (needCanvas) {
        func(canvas);
      } else {
        func(gl);
      }
    } else if (type === "2d") {
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
        <li onClick={() => render("webgl", createShader)}>basic</li>
        <li onClick={() => render("2d", createCanvas, true)}>sun rise</li>
        <li onClick={() => render("2d", createVectorTree)}>vector tree</li>
      </ul>
      <div id="canvas-container" ref={containerRef}></div>
    </div>
  );
}

export default App;
