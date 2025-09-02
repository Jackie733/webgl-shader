precision mediump float;

varying vec3 v_color; // 接收插值后的颜色
uniform float u_time; // 保留时间 uniform 用于动画

void main() {
  // 使用传入的颜色，并叠加上时间动画
  gl_FragColor = vec4(v_color * abs(sin(u_time)), 1.0);
}
