import { useRef } from "react";
import { createShader } from "./utils/script";
import { createCanvas } from "./utils/canvas";
import { useCanvasManager } from "./hooks/useCanvasManager";
import "./App.css";

function App() {
  const containerRef = useRef(null);
  const { switchToWebGL, switchTo2D, getCurrentCanvas } =
    useCanvasManager(containerRef);

  const render = (type) => {
    if (type === "webgl") {
      const gl = switchToWebGL();
      if (gl) {
        createShader(gl);
      }
    } else if (type === "2d") {
      switchTo2D();
      const canvas = getCurrentCanvas();
      if (canvas) {
        createCanvas(canvas);
      }
    }
  };

  return (
    <div className="container">
      <ul>
        <li onClick={() => render("webgl")}>basic</li>
        <li onClick={() => render("2d")}>sun rise</li>
        <li>vector tree</li>
      </ul>
      <div id="canvas-container" ref={containerRef}></div>
    </div>
  );
}

export default App;
