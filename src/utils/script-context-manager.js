class ScriptContextManager {
  constructor() {
    this.canvasManager = null;
    this.scriptInstances = new Map();
    this.availableScripts = null;
    this.initPromise = this.initializeAvailableScripts();
  }

  async initializeAvailableScripts() {
    try {
      const modules = import.meta.glob('../demos/*.js');
      this.availableScripts = modules;
      return modules;
    } catch (error) {
      console.warn('Failed to initialize available scripts:', error);
      this.availableScripts = {};
      return {};
    }
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
    // 等待脚本初始化完成
    await this.initPromise;

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

      let normalizedPath = scriptPath;

      while (normalizedPath.startsWith('/')) {
        normalizedPath = normalizedPath.slice(1);
      }

      if (!normalizedPath.endsWith('.js')) {
        normalizedPath = `${normalizedPath}.js`;
      }

      const modulePath = `../demos/${normalizedPath}`;

      let module;
      try {
        if (this.availableScripts && this.availableScripts[modulePath]) {
          console.log('Loading from preloaded scripts:', modulePath);
          module = await this.availableScripts[modulePath]();
        } else {
          const availableKeys = this.availableScripts
            ? Object.keys(this.availableScripts)
            : [];
          console.error(
            'Script not found in preloaded modules. Available scripts:',
            availableKeys
          );
          throw new Error(
            `Script "${normalizedPath}" not found. Available scripts: ${availableKeys.map((k) => k.replace('../demos/', '')).join(', ')}`
          );
        }
      } catch (importError) {
        console.error('Failed to import module:', normalizedPath, importError);
        throw importError;
      }

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
        console.log(`Script module loaded successfully: ${normalizedPath}`);
        return instance;
      }

      throw new Error(
        `No valid export found in the script module: ${normalizedPath}`
      );
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
