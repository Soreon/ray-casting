/* eslint-disable object-curly-newline */

import * as µ from './canvas.js';

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const canvas2 = document.getElementById('canvas2');
const context2 = canvas2.getContext('2d');

const CELL = 64;
const grid = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

function generateWalls(grid) {
  const walls = [];
  const rows = grid.length, cols = grid[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 0) continue;
      const x = c * CELL, y = r * CELL;
      if (r === 0 || grid[r - 1][c] === 0) walls.push([{ x, y }, { x: x + CELL, y }]);
      if (r === rows - 1 || grid[r + 1][c] === 0) walls.push([{ x, y: y + CELL }, { x: x + CELL, y: y + CELL }]);
      if (c === 0 || grid[r][c - 1] === 0) walls.push([{ x, y }, { x, y: y + CELL }]);
      if (c === cols - 1 || grid[r][c + 1] === 0) walls.push([{ x: x + CELL, y }, { x: x + CELL, y: y + CELL }]);
    }
  }
  return walls;
}

const limits = generateWalls(grid);
const mapWidth = grid[0].length * CELL;
const mapHeight = grid.length * CELL;

let playerX = 1.5 * CELL;
let playerY = 1.5 * CELL;
const moveSpeed = 3;
const rotSpeed = Math.PI / 48;
const keys = {};

let fov = Math.PI / 2;
const maxRayLength = Math.sqrt(mapWidth * mapWidth + mapHeight * mapHeight);
let orientation = 0;
let numberOfRays = 500;
const wallHeight = 10;

function drawFovIndicator(ctx, x, y, direction, fov, scale) {
  const len = 300 * scale;
  const px1 = x + Math.cos(direction - fov / 2) * len;
  const py1 = y + Math.sin(direction - fov / 2) * len;
  const px2 = x + Math.cos(direction + fov / 2) * len;
  const py2 = y + Math.sin(direction + fov / 2) * len;
  µ.dashedLine({ context: ctx, x1: x, y1: y, x2: px1, y2: py1, color: '#00000055' });
  µ.dashedLine({ context: ctx, x1: x, y1: y, x2: px2, y2: py2, color: '#00000055' });
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

function drawSkyAndFloor() {
  const midY = canvas2.height / 2;
  const sky = context2.createLinearGradient(0, 0, 0, midY);
  sky.addColorStop(0, '#0b1a3e');
  sky.addColorStop(1, '#3a7bd5');
  context2.fillStyle = sky;
  context2.fillRect(0, 0, canvas2.width, midY);

  const floor = context2.createLinearGradient(0, midY, 0, canvas2.height);
  floor.addColorStop(0, '#4a4a4a');
  floor.addColorStop(1, '#1a1a1a');
  context2.fillStyle = floor;
  context2.fillRect(0, midY, canvas2.width, midY);
}

function drawView(context, x, y, orientation, fov) {
  µ.clear(canvas2, context2);
  drawSkyAndFloor();
  const projDist = (numberOfRays / 2) / Math.tan(fov / 2);
  for (let i = 0; i < numberOfRays; i++) {
    const screenX = i - (numberOfRays - 1) / 2;
    const rayAngle = orientation + Math.atan2(screenX, projDist);
    const px = x + Math.cos(rayAngle) * maxRayLength;
    const py = y + Math.sin(rayAngle) * maxRayLength;
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
      const colorVal = map(Math.pow(minDist, 0.5), 0, Math.pow(maxRayLength, 0.5), 0, 255) | 0;
      const color = (255 - colorVal).toString(16).padStart(2, '0');
      µ.rectangle({
        context: context2,
        x: Math.round(i * canvas2.width / numberOfRays),
        y: (canvas.height / 2) - (contextualWallHeight / 2),
        width: Math.round((i + 1) * canvas2.width / numberOfRays) - Math.round(i * canvas2.width / numberOfRays),
        height: contextualWallHeight,
        color: `#${color}${color}${color}`
      });
    }
  }
}

function canMoveTo(newX, newY) {
  const margin = 5;
  const c1 = Math.floor((newX - margin) / CELL), c2 = Math.floor((newX + margin) / CELL);
  const r1 = Math.floor((newY - margin) / CELL), r2 = Math.floor((newY + margin) / CELL);
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] === 1) return false;
    }
  }
  return true;
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

function drawMinimap() {
  const scale = canvas.width / (12 * CELL);
  context.save();
  context.translate(canvas.width / 2 - playerX * scale, canvas.height / 2 - playerY * scale);
  context.scale(scale, scale);

  // Draw grid cells
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      context.fillStyle = grid[r][c] === 1 ? '#333' : '#ddd';
      context.fillRect(c * CELL, r * CELL, CELL, CELL);
    }
  }

  // Draw FOV indicator
  drawFovIndicator(context, playerX, playerY, orientation, fov, 1);

  // Draw player
  context.beginPath();
  context.arc(playerX, playerY, 6, 0, Math.PI * 2);
  context.fillStyle = '#e22';
  context.fill();

  context.restore();
}

function animate() {
  updatePlayer();
  µ.clear(canvas, context);
  drawMinimap();
  drawView(context2, playerX, playerY, orientation, fov);
  requestAnimationFrame(animate);
}

document.addEventListener('keydown', (event) => { keys[event.code] = true; });
document.addEventListener('keyup', (event) => { keys[event.code] = false; });

const resolutionSlider = document.getElementById('resolution');
const resolutionValue = document.getElementById('resolutionValue');
resolutionSlider.addEventListener('input', () => {
  numberOfRays = parseInt(resolutionSlider.value);
  resolutionValue.textContent = numberOfRays;
});

animate();
