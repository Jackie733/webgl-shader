precision mediump float;

varying vec3 v_color; // 接收插值后的颜色
uniform float u_time; // 时间 uniform 用于动画
uniform vec2 u_resolution; // 分辨率 uniform
uniform vec2 u_mouse; // 鼠标位置 uniform (可选)

void main() {
  // 计算归一化的片段坐标
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  // 计算归一化的鼠标坐标
  vec2 mouse = u_mouse / u_resolution.xy;
  
  // 创建时间相关的动画效果
  float timeEffect = abs(sin(u_time));
  
  // 创建基于位置的渐变效果
  float gradient = length(uv - 0.5) * 2.0;
  
  // 创建鼠标交互效果
  float mouseDistance = length(uv - mouse);
  float mouseEffect = 1.0 + 0.5 * exp(-mouseDistance * 5.0);
  
  // 混合顶点颜色、动画效果和鼠标交互效果
  vec3 finalColor = v_color * timeEffect * (1.0 - gradient * 0.3) * mouseEffect;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
