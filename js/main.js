/* eslint-disable object-curly-newline */

import * as µ from './canvas.js';

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const canvas2 = document.getElementById('canvas2');
const context2 = canvas2.getContext('2d');

let playerX = canvas.width / 2;
let playerY = canvas.height / 2;
const moveSpeed = 3;
const rotSpeed = Math.PI / 48;
const keys = {};

const offscreenCanvas = {
  fovIndicator: createOffscreenCanvas(canvas.width, canvas.height)
}

let fov = Math.PI / 2;
const fovIndicatorLength = Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2));
let orientation = 0;
let numberOfRays = 500;
const wallHeight = 10;
const limits = [
  // Boundary walls
  [{ x: 0, y: 0 }, { x: canvas.width, y: 0 }],
  [{ x: canvas.width, y: 0 }, { x: canvas.width, y: canvas.height }],
  [{ x: canvas.width, y: canvas.height }, { x: 0, y: canvas.height }],
  [{ x: 0, y: canvas.height }, { x: 0, y: 0 }],
  // Interior walls
  [{ x: 150, y: 100 }, { x: 150, y: 300 }],
  [{ x: 300, y: 200 }, { x: 500, y: 200 }],
  [{ x: 400, y: 350 }, { x: 400, y: 550 }],
  [{ x: 100, y: 450 }, { x: 350, y: 450 }],
  [{ x: 450, y: 100 }, { x: 550, y: 250 }],
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
  const px1 = x + Math.cos(direction - fov / 2) * fovIndicatorLength;
  const py1 = y + Math.sin(direction - fov / 2) * fovIndicatorLength;
  const px2 = x + Math.cos(direction + fov / 2) * fovIndicatorLength;
  const py2 = y + Math.sin(direction + fov / 2) * fovIndicatorLength;

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
  const projDist = (numberOfRays / 2) / Math.tan(fov / 2);
  for (let i = 0; i < numberOfRays; i++) {
    const screenX = i - (numberOfRays - 1) / 2;
    const rayAngle = orientation + Math.atan2(screenX, projDist);
    const px = x + Math.cos(rayAngle) * fovIndicatorLength;
    const py = y + Math.sin(rayAngle) * fovIndicatorLength;
    let minDist = Infinity;
    for (let j = 0; j < limits.length; j++) {
      const limit = limits[j];
      const intersection = intersect(x, y, px, py, limit[0].x, limit[0].y, limit[1].x, limit[1].y)
      if (intersection) {
        const dist = distance(x, y, intersection.x, intersection.y) * Math.cos(rayAngle - orientation);
        if (dist < minDist) minDist = dist;
      }
    }
    if (minDist < Infinity) {
      const contextualWallHeight = wallHeight * fov * 5000 / minDist;
      const colorVal = map(Math.pow(minDist, 0.5), 0, Math.pow(fovIndicatorLength, 0.5), 0, 255) | 0;
      const color = (255 - colorVal).toString(16).padStart(2, '0');
      µ.rectangle({
        context: context2,
        x: i * canvas2.width / numberOfRays,
        y: (canvas.height / 2) - (contextualWallHeight / 2),
        width: canvas2.width / numberOfRays,
        height: contextualWallHeight,
        color: `#${color}${color}${color}`
      });
    }
  }
}

function canMoveTo(newX, newY) {
  const margin = 5;
  for (const limit of limits) {
    const closest = closestPointOnSegment(newX, newY, limit[0].x, limit[0].y, limit[1].x, limit[1].y);
    if (distance(newX, newY, closest.x, closest.y) < margin) return false;
  }
  return true;
}

function closestPointOnSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { x: x1, y: y1 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return { x: x1 + t * dx, y: y1 + t * dy };
}

function updatePlayer() {
  if (keys['ArrowLeft']) orientation -= rotSpeed;
  if (keys['ArrowRight']) orientation += rotSpeed;
  if (keys['ShiftLeft'] || keys['ShiftRight']) {
    if (keys['ArrowUp']) { fov += Math.PI / 48; fov = Math.min(fov, Math.PI * 2); }
    if (keys['ArrowDown']) { fov -= Math.PI / 48; fov = Math.max(fov, 0.1); }
  }

  let dx = 0, dy = 0;
  if (keys['KeyW']) { dx += Math.cos(orientation); dy += Math.sin(orientation); }
  if (keys['KeyS']) { dx -= Math.cos(orientation); dy -= Math.sin(orientation); }
  if (keys['KeyA']) { dx += Math.cos(orientation - Math.PI / 2); dy += Math.sin(orientation - Math.PI / 2); }
  if (keys['KeyD']) { dx += Math.cos(orientation + Math.PI / 2); dy += Math.sin(orientation + Math.PI / 2); }

  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    const newX = playerX + (dx / len) * moveSpeed;
    const newY = playerY + (dy / len) * moveSpeed;
    if (canMoveTo(newX, newY)) { playerX = newX; playerY = newY; }
    else if (canMoveTo(newX, playerY)) { playerX = newX; }
    else if (canMoveTo(playerX, newY)) { playerY = newY; }
  }
}

function drawLimits() {
  for (let i = 0; i < limits.length; i++) {
    const limit = limits[i];
    µ.line({
      context,
      x1: limit[0].x, y1: limit[0].y,
      x2: limit[1].x, y2: limit[1].y,
      color: '#333',
    });
  }
}

function drawPlayer() {
  µ.circle({ context, x: playerX, y: playerY, radius: 4, color: '#e22' });
}

function animate() {
  updatePlayer();
  µ.clear(canvas, context);
  drawLimits();
  drawFovIndicator(offscreenCanvas.fovIndicator.context, playerX, playerY, orientation, fov);
  context.drawImage(offscreenCanvas.fovIndicator.canvas, 0, 0);
  drawPlayer();
  drawView(context2, playerX, playerY, orientation, fov);
  requestAnimationFrame(animate);
}

document.addEventListener('keydown', (event) => { keys[event.code] = true; });
document.addEventListener('keyup', (event) => { keys[event.code] = false; });

animate();
