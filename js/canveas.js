/* eslint-disable no-param-reassign */
function requiredParam(param) {
  throw new Error(`Required parameter, "${param}" is missing.`);
}

export function clear(canvas, context) {
  context.clearRect(-1, -1, canvas.width + 1, canvas.height + 1);
}

export function circle({
  context = requiredParam('context'),
  x = requiredParam('x'),
  y = requiredParam('y'),
  radius = requiredParam('radius'),
} = {}) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2, true);
  context.stroke();
}

export function disk({
  context = requiredParam('context'),
  x = requiredParam('x'),
  y = requiredParam('y'),
  radius = requiredParam('radius'),
} = {}) {
  if (!context) throw new Error('context missing');
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2, true);
  context.fill();
}

export function line({
  context = requiredParam('context'),
  x1 = requiredParam('x1'),
  y1 = requiredParam('y1'),
  x2 = requiredParam('x2'),
  y2 = requiredParam('y2'),
  color = '#000',
} = {}) {
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}


export function dashedLine({
  context = requiredParam('context'),
  x1 = requiredParam('x1'),
  y1 = requiredParam('y1'),
  x2 = requiredParam('x2'),
  y2 = requiredParam('y2'),
  color = '#000',
} = {}) {
  context.setLineDash([2, 3]);
  line({ context, x1, y1, x2, y2, color });
}

export function rectangle({
  context = requiredParam('context'),
  x = requiredParam('x1'),
  y = requiredParam('y1'),
  width = requiredParam('width'),
  height = requiredParam('height'),
  color = '#F00',
} = {}) {
  context.beginPath();
  context.fillStyle = color;
  context.rect(x, y, width, height);
  context.fill();
}