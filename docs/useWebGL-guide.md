# useWebGL Hook 使用指南

## 概述

`useWebGL` 是一个功能强大的 React Hook，提供了完整的 WebGL 渲染管道封装，包含性能优化、多种 WebGL 特性支持和调试功能。

## 主要特性

### 🚀 性能优化

- **FPS 限制**: 可设置最大帧率避免过度渲染
- **自动性能监控**: 实时 FPS 统计和性能指标
- **智能依赖管理**: 使用 `useMemo` 和 `useCallback` 优化重渲染
- **资源管理**: 自动清理 WebGL 资源防止内存泄漏

### 🎨 WebGL 特性支持

- **索引渲染**: 支持 Element Array Buffer 提高渲染效率
- **纹理支持**: 完整的纹理配置和管理
- **Uniform 管理**: 统一的 uniform 变量设置系统
- **混合模式**: 支持 alpha 混合和自定义混合函数
- **深度测试**: 可配置的深度缓冲和测试
- **自动调整大小**: 响应式 canvas 尺寸调整

### 🛠️ 开发工具

- **调试模式**: 详细的错误日志和性能信息
- **热重载友好**: 正确处理开发时的重新编译
- **类型安全**: 完整的 JSDoc 类型定义

## 基本用法

```javascript
import { useWebGL } from '@/hooks/useWebGL';

function MyComponent() {
  const canvasRef = useRef(null);

  const options = useMemo(() => ({
    vertexShaderSource: '...', // 顶点着色器源码
    fragmentShaderSource: '...', // 片段着色器源码
    vertices: new Float32Array([...]), // 顶点数据
    vertexLayout: {
      stride: 20, // 每个顶点的字节大小
      attributes: [
        { name: 'a_position', size: 2, type: gl.FLOAT },
        { name: 'a_color', size: 3, type: gl.FLOAT }
      ]
    },
    drawConfig: {
      mode: gl.TRIANGLES,
      count: 6
    }
  }), []);

  const { fps, gl, program } = useWebGL(canvasRef, options);

  return <canvas ref={canvasRef} />;
}
```

## 高级配置

### 1. 索引渲染

```javascript
const options = {
  // ... 其他配置
  vertices: new Float32Array([...]), // 4个顶点而不是6个
  indices: new Uint16Array([0, 1, 2, 2, 1, 3]), // 索引数组
  drawConfig: {
    mode: gl.TRIANGLES,
    count: 6,
    useElements: true // 启用索引渲染
  }
};
```

### 2. Uniform 变量

```javascript
const options = {
  // ... 其他配置
  uniforms: {
    u_time: { type: '1f', value: 0 },
    u_resolution: { type: '2f', value: [800, 600] },
    u_transform: { type: 'Matrix4fv', value: matrix4x4 },
  },
};
```

支持的 uniform 类型：

- `'1f'`, `'2f'`, `'3f'`, `'4f'` - 浮点数
- `'1i'`, `'2i'`, `'3i'`, `'4i'` - 整数
- `'Matrix2fv'`, `'Matrix3fv'`, `'Matrix4fv'` - 矩阵

### 3. 纹理支持

```javascript
const options = {
  // ... 其他配置
  textures: {
    u_texture: {
      source: imageElement, // HTMLImageElement, Canvas, Video 或 ImageData
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.LINEAR,
      generateMipmap: true,
      flipY: true,
    },
  },
};
```

### 4. 混合模式

```javascript
const options = {
  // ... 其他配置
  blending: {
    enabled: true,
    srcFactor: gl.SRC_ALPHA,
    dstFactor: gl.ONE_MINUS_SRC_ALPHA,
    equation: gl.FUNC_ADD,
  },
};
```

### 5. 深度测试

```javascript
const options = {
  // ... 其他配置
  depth: {
    enabled: true,
    func: gl.LESS,
    mask: true,
  },
};
```

### 6. 性能配置

```javascript
const options = {
  // ... 其他配置
  enableDebug: process.env.NODE_ENV === 'development',
  maxFPS: 60, // 限制最大帧率，0 为不限制
  autoResize: true, // 自动调整 canvas 大小
};
```

## 渲染回调

```javascript
const onRender = useCallback(
  (gl, program, time, deltaTime) => {
    // 动态更新 uniform
    options.uniforms.u_time.value = time * 0.001;

    // 自定义渲染逻辑
    // ...
  },
  [options.uniforms]
);

const webglResult = useWebGL(canvasRef, { ...options, onRender });
```

## 返回值

Hook 返回包含以下属性的对象：

```javascript
const { fps, gl, program } = useWebGL(canvasRef, options);
```

- `fps`: 当前帧率
- `gl`: WebGL 渲染上下文
- `program`: 编译链接后的着色器程序

## 性能最佳实践

1. **使用 `useMemo` 缓存配置对象**

```javascript
const options = useMemo(() => ({ ... }), [dependencies]);
```

2. **使用 `useCallback` 缓存渲染回调**

```javascript
const onRender = useCallback((gl, program, time) => { ... }, []);
```

3. **启用索引渲染减少顶点数量**

```javascript
drawConfig: {
  useElements: true;
}
```

4. **适当设置 FPS 限制**

```javascript
maxFPS: 60; // 避免不必要的高帧率
```

5. **生产环境关闭调试**

```javascript
enableDebug: process.env.NODE_ENV === 'development';
```

## 错误处理

Hook 内置了完善的错误处理机制：

- 自动检测 WebGL 支持
- 着色器编译错误提示
- 程序链接错误提示
- 资源创建失败处理
- 调试模式下的详细错误信息

## 示例项目

查看 `src/components/Shader.jsx` 了解完整的使用示例，包括：

- 基本的几何渲染
- 动画效果
- 性能监控显示
- 响应式布局

## 浏览器兼容性

- 现代浏览器原生支持 WebGL
- 自动降级处理不支持的特性
- ResizeObserver API 的渐进增强支持
