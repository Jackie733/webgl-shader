class ScriptContextManager {
  constructor() {
    this.canvasManager = null;
    this.scriptInstances = new Map();
  }

  setCanvasManager(canvasManager) {
    this.canvasManager = canvasManager;
  }

  getCanvasAPI() {
    return {
      switchTo2D: (width, height) =>
        this.canvasManager?.switchTo2D(width, height),
      switchToWebGL: (width, height) =>
        this.canvasManager?.switchToWebGL(width, height),
      getCurrentContext: () => this.canvasManager?.getCurrentContext(),
      getCurrentCanvas: () => this.canvasManager?.getCurrentCanvas(),

      registerScript: (name, instance) => {
        this.scriptInstances.set(name, instance);
      },
      getScript: (name) => this.scriptInstances.get(name),
      unregisterScript: (name) => {
        this.scriptInstances.delete(name);
      },

      log: (message, data) => console.log(`[Script Log] ${message}`, data),
      error: (message, error) =>
        console.error(`[Script Error] ${message}`, error),
    };
  }

  /**
   * options: {
   *   canvasType: '2d' | 'webgl', // default '2d'
   *   needCanvas: boolean, // default false
   *   width: number, // optional
   *   height: number, // optional
   *   ...otherOptions
   * }
   */
  async loadScript(scriptPath, options = {}) {
    // TODO: recover from previous instance if exists
    // TODO: reload if already loaded with different options
    try {
      console.log('Loading script module:', scriptPath);

      const requiredCanvasType = options.canvasType || '2d';
      const needCanvas = options.needCanvas || false;

      let context = null;
      if (requiredCanvasType === '2d') {
        context = this.canvasManager?.switchTo2D(options.width, options.height);
      } else if (requiredCanvasType === 'webgl') {
        context = this.canvasManager?.switchToWebGL(
          options.width,
          options.height
        );
      }
      const canvas = this.canvasManager?.getCurrentCanvas();

      if (!context) {
        throw new Error(
          `Failed to create canvas context of type: ${requiredCanvasType}`
        );
      }

      const module = await import(`/src/demos/${scriptPath}`);

      let instance = null;

      if (typeof module.default === 'function') {
        // If the default export is a function, call it with the appropriate argument
        // based on whether the script needs the canvas or the context
        instance = module.default(needCanvas ? canvas : context, options);
      } else if (typeof module.init === 'function') {
        instance = module.init(this.canvasManager?.getCurrentCanvas(), options);
      }

      if (instance) {
        this.scriptInstances.set(scriptPath, {
          instance,
          canvas,
          context,
          canvasType: requiredCanvasType,
          loadTime: new Date().toISOString(),
          options,
        });
        console.log('Script module loaded:', scriptPath);
        return instance;
      }

      throw new Error('No valid export found in the script module.');
    } catch (error) {
      console.error('Error loading script module:', error);
      throw error;
    }
  }

  unloadScript(scriptPath) {
    const scriptData = this.scriptInstances.get(scriptPath);
    if (scriptData && scriptData.instance) {
      if (typeof scriptData.instance.destroy === 'function') {
        scriptData.instance.destroy();
      }
    }
    this.scriptInstances.delete(scriptPath);
  }

  getScriptInstance(scriptPath) {
    const scriptData = this.scriptInstances.get(scriptPath);
    return scriptData ? scriptData.instance : null;
  }

  cleanup() {
    this.scriptInstances.forEach((_, scriptPath) => {
      this.unloadScript(scriptPath);
    });
  }
}

export default ScriptContextManager;
