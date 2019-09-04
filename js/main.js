/* eslint-disable object-curly-newline */

import * as µ from './canveas.js';

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const { left, top } = canvas.getBoundingClientRect();
const canvas2 = document.getElementById('canvas2');
const context2 = canvas2.getContext('2d');
let shiftPressed = false;

const offscreenCanvas = {
  fovIndicator: createOffscreenCanvas(canvas.width, canvas.height)
}

let fov = Math.PI / 2;
const fovIndicatorLength = Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2));
let orientation = 0;
let numberOfRays = 500;
const wallHeight = 10;
const limits = [
  [{ x: 0, y: 0 }, { x: canvas.width, y: 0 }],
  [{ x: canvas.width, y: 0 }, { x: canvas.width, y: canvas.height }],
  [{ x: canvas.width, y: canvas.height }, { x: 0, y: canvas.height }],
  [{ x: 0, y: canvas.height }, { x: 0, y: 0 }],
];

function createOffscreenCanvas(width, height) {
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = width
  offscreenCanvas.height = height
  return {
    canvas: offscreenCanvas,
    context: offscreenCanvas.getContext('2d')
  }
}

function drawFovIndicator(offscreenContext, x, y, direction, fov) {
  const px1 = x + Math.cos(orientation - fov / 2) * fovIndicatorLength;
  const py1 = y + Math.sin(orientation - fov / 2) * fovIndicatorLength;
  const px2 = x + Math.cos(orientation + fov / 2) * fovIndicatorLength;
  const py2 = y + Math.sin(orientation + fov / 2) * fovIndicatorLength;

  µ.clear(offscreenCanvas.fovIndicator.canvas, offscreenCanvas.fovIndicator.context);
  µ.dashedLine({ context: offscreenCanvas.fovIndicator.context, x1: x, y1: y, x2: px1, y2: py1, color: '#00000055' });
  // for (let i = 1; i < numberOfRays - 1; i++) {
  //   const pix = x + Math.cos(orientation - fov / 2 + (i * fov / (numberOfRays - 1))) * fovIndicatorLength;
  //   const piy = y + Math.sin(orientation - fov / 2 + (i * fov / (numberOfRays - 1))) * fovIndicatorLength;
  //   µ.dashedLine({ context: offscreenCanvas.fovIndicator.context, x1: x, y1: y, x2: pix, y2: piy, color: '#00000011' });
  // }
  µ.dashedLine({ context: offscreenCanvas.fovIndicator.context, x1: x, y1: y, x2: px2, y2: py2, color: '#00000055' });
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

function normalDistance(x1, y1, x2, y2) {
  return Math.max(distance(x1, y1, x1, y2), distance(x1, y1, x2, y1))
}

const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {

  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false
  }

  let denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

  // Lines are parallel
  if (denominator === 0) {
    return false
  }

  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

  // is the intersection along the segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false
  }

  // Return a object with the x and y coordinates of the intersection
  let x = x1 + ua * (x2 - x1)
  let y = y1 + ua * (y2 - y1)

  return { x, y }
}

function drawView(context, x, y, orientation, fov) {
  µ.clear(canvas2, context2);
  for (let i = 0; i < numberOfRays; i++) {
    const px = x + Math.cos(orientation - fov / 2 + (i * fov / (numberOfRays - 1))) * fovIndicatorLength;
    const py = y + Math.sin(orientation - fov / 2 + (i * fov / (numberOfRays - 1))) * fovIndicatorLength;
    for (let j = 0; j < limits.length; j++) {
      const limit = limits[j];
      const intersection = intersect(x, y, px, py, limit[0].x, limit[0].y, limit[1].x, limit[1].y)
      if (intersection) {
        const dist = distance(x, y, intersection.x, intersection.y);
        // const contextualWallHeight = canvas.height * 100 / dist;
        const contextualWallHeight = wallHeight * fov * 5000 / dist;
        const colorVal = map(Math.pow(dist, 0.5), 0, Math.pow(fovIndicatorLength, 0.5), 0, 255) | 0;
        const color = (255 - colorVal).toString(16).padStart(2, '0');
        µ.rectangle({
          context: context2,
          x: i * canvas2.width / numberOfRays,
          y: (canvas.height / 2) - (contextualWallHeight / 2),
          width: canvas2.width / numberOfRays,
          height: contextualWallHeight,
          color: `#${color}${color}${color}`
        });
        break;
      }
    }
  }
}

function drawLimits() { 
  for (let i = 0; i < limits.length; i++) {
    const limit = limits[i];
    
  }
}

function draw() {
  context.drawImage(offscreenCanvas.fovIndicator.canvas, 0, 0);
}

function animate() {
  µ.clear(canvas, context);
  draw();
  requestAnimationFrame(animate);
}

canvas.addEventListener('mousemove', event => {
  const x = event.clientX - left;
  const y = event.clientY - top;
  drawFovIndicator(offscreenCanvas.fovIndicator.context, x, y, orientation, fov);
  drawView(offscreenCanvas.fovIndicator.context, x, y, orientation, fov);
})

canvas.addEventListener('mouseleave', event => {
  µ.clear(offscreenCanvas.fovIndicator.canvas, offscreenCanvas.fovIndicator.context);
})

canvas.addEventListener('mousewheel', event => {
  const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
  if (delta > 0) {
    if (shiftPressed) {
      fov += Math.PI / 24
      fov = Math.min(Math.max(0, fov), Math.PI * 2)
    } else {
      orientation -= Math.PI / 24
    }
  } else {
    if (shiftPressed) {
      fov -= Math.PI / 24
      fov = Math.min(Math.max(0, fov), Math.PI * 2)
    } else {
      orientation += Math.PI / 24
    }
  }
  const x = event.clientX - left;
  const y = event.clientY - top;
  drawFovIndicator(offscreenCanvas.fovIndicator.context, x, y, orientation, fov);
  drawView(offscreenCanvas.fovIndicator.context, x, y, orientation, fov);
}, { passive: true });

document.addEventListener('keydown', (event) => {
  if (event.shiftKey) {
    shiftPressed = true;
  }
}, false);

document.addEventListener('keyup', (event) => {
  shiftPressed = false;
}, false);



animate();
