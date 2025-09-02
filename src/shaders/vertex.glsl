attribute vec2 a_position;
attribute vec3 a_color; // 新增：顶点颜色 attribute

varying vec3 v_color; // varying 变量，用于向片段着色器传递颜色

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_color = a_color; // 将 attribute 颜色赋给 varying 变量
}
