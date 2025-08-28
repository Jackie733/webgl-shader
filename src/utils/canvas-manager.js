class CanvasManager {
  constructor(container) {
    this.container = container;
    this.currentCanvas = null;
    this.currentContext = null;
    this.currentType = null;
  }

  create2DCanvas(width = 828, height = 512) {
    this.destroyCurrentCanvas();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.border = '1px solid #ccc';
    this.container.appendChild(canvas);

    this.currentCanvas = canvas;
    this.currentContext = canvas.getContext('2d');
    this.currentType = '2d';

    return this.currentContext;
  }

  createWebGLCanvas(width = 828, height = 512) {
    this.destroyCurrentCanvas();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.border = '1px solid #ccc';
    this.container.appendChild(canvas);

    this.currentCanvas = canvas;
    this.currentContext = canvas.getContext('webgl');
    this.currentType = 'webgl';

    return this.currentContext;
  }

  destroyCurrentCanvas() {
    if (this.currentCanvas && this.currentCanvas.parentNode) {
      this.currentCanvas.parentNode.removeChild(this.currentCanvas);
      this.currentCanvas = null;
      this.currentContext = null;
    }
  }

  getCurrentCanvas() {
    return this.currentCanvas;
  }

  getCurrentContext() {
    return this.currentContext;
  }

  getCurrentType() {
    return this.currentType;
  }
}

export default CanvasManager;
