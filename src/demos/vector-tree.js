import { Vector2D } from '../utils/vector2d';

export default function (canvas) {
  const ctx = canvas.getContext('2d');
  const { height } = canvas;
  ctx.translate(0, height);
  ctx.scale(1, -1);
  ctx.lineCap = 'round';

  const v0 = new Vector2D(256, 0);
  drawBranch(ctx, v0, 50, 10, 1, 3);

  return {};
}

function drawBranch(context, v0, length, thinckness, dir, bias) {
  const v = new Vector2D().rotate(dir).scale(length);
  const v1 = v0.copy().add(v);

  context.lineWidth = thinckness;
  context.beginPath();
  context.moveTo(...v0);
  context.lineTo(...v1);
  context.stroke();

  if (thinckness > 2) {
    const left = Math.PI / 4 + 0.5 * (dir + 0.2) + bias * (Math.random() - 0.5);
    drawBranch(context, v1, length * 0.9, thinckness * 0.8, left, bias * 0.9);
    const right =
      Math.PI / 4 + 0.5 * (dir - 0.2) + bias * (Math.random() - 0.5);
    drawBranch(context, v1, length * 0.9, thinckness * 0.8, right, bias * 0.9);
  }

  if (thinckness < 5 && Math.random() < 0.3) {
    context.save();
    context.strokeStyle = '#c72c35';
    const th = Math.random() * 6 + 3;
    context.lineWidth = th;
    context.beginPath();
    context.moveTo(...v1);
    context.lineTo(v1.x, v1.y - 2);
    context.stroke();
    context.restore();
  }
}
