import earcut from '../utils/earcut';

const vertices = [
  [-0.7, 0.5],
  [-0.4, 0.3],
  [-0.25, 0.71],
  [-0.1, 0.56],
  [-0.1, 0.13],
  [0.4, 0.21],
  [0, -0.6],
  [-0.3, -0.3],
  [-0.6, -0.3],
  [-0.45, 0.0],
];

export default function (gl) {
  const points = vertices.flat();
  const triangles = earcut(points);

  const position = new Float32Array(points);
  const cells = new Uint16Array(triangles);

  const vertex = `
    attribute vec2 position;
    varying vec3 color;

    void main() {
      gl_PointSize = 1.0;
      color = vec3(0.5 + position * 0.5, 0.0);
      gl_Position = vec4(position * 0.5, 1.0, 1.0);
    }
  `;

  const fragment = `
    precision mediump float;
    varying vec3 color;

    void main() {
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertex);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragment);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.useProgram(program);

  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);

  const vPosition = gl.getAttribLocation(program, 'position');
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  const cellsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cellsBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cells, gl.STATIC_DRAW);

  gl.clear(gl.COLOR_BUFFER_BIT);
  // gl.drawElements(gl.TRIANGLES, cells.length, gl.UNSIGNED_SHORT, 0);
  gl.drawElements(gl.LINE_STRIP, cells.length, gl.UNSIGNED_SHORT, 0);

  return {
    destroy: () => {
      gl.deleteBuffer(pointBuffer);
      gl.deleteBuffer(cellsBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    },
  };
}
