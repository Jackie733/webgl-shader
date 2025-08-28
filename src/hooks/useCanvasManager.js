import { useState, useEffect, useRef, useCallback } from 'react';
import CanvasManager from '../utils/canvas-manager';

export const useCanvasManager = (containerRef) => {
  const [canvasType, setCanvasType] = useState(null);
  const managerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && !managerRef.current) {
      managerRef.current = new CanvasManager(containerRef.current);
    }
  }, [containerRef]);

  const switchTo2D = (width, height) => {
    if (!managerRef.current) return null;

    const ctx = managerRef.current.create2DCanvas(width, height);
    setCanvasType('2d');
    return ctx;
  };

  const switchToWebGL = (width, height) => {
    if (!managerRef.current) return null;

    const gl = managerRef.current.createWebGLCanvas(width, height);
    setCanvasType('webgl');
    return gl;
  };

  const getCurrentContext = useCallback(() => {
    return managerRef.current?.getCurrentContext() || null;
  }, []);

  const getCurrentCanvas = useCallback(() => {
    return managerRef.current?.getCurrentCanvas() || null;
  }, []);

  return {
    canvasType,
    switchTo2D,
    switchToWebGL,
    getCurrentContext,
    getCurrentCanvas,
  };
};
