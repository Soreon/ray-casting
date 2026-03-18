/* eslint-disable object-curly-newline */

import * as µ from './canvas.js';

const canvas2 = document.getElementById('canvas2');
const context2 = canvas2.getContext('2d');
let numberOfRays;

function resizeCanvas() {
  canvas2.width = window.innerWidth;
  canvas2.height = window.innerHeight;
  numberOfRays = canvas2.width;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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
const wallHeight = 10;

// Lowres mode
let lowresMode = false;
const LOWRES_W = 320;
const LOWRES_H = 200;
const lowresCanvas = document.createElement('canvas');
lowresCanvas.width = LOWRES_W;
lowresCanvas.height = LOWRES_H;
const lowresCtx = lowresCanvas.getContext('2d');

const NES_PALETTE = [
  [0,0,0],[252,252,252],[248,248,248],
  [188,188,188],[124,124,124],[168,0,32],
  [0,0,252],[0,88,248],[0,168,0],
  [68,168,0],[184,248,24],[248,88,152],
  [252,160,68],[228,92,16],[80,48,0],
  [120,120,120],
];

function nearestColor(r, g, b) {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < NES_PALETTE.length; i++) {
    const [pr, pg, pb] = NES_PALETTE[i];
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return NES_PALETTE[best];
}

function quantize(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = nearestColor(data[i], data[i + 1], data[i + 2]);
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
  ctx.putImageData(imageData, 0, 0);
}

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

function drawSkyAndFloor(ctx, cvs) {
  const midY = cvs.height / 2;
  const sky = ctx.createLinearGradient(0, 0, 0, midY);
  sky.addColorStop(0, '#0b1a3e');
  sky.addColorStop(1, '#3a7bd5');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cvs.width, midY);

  const floor = ctx.createLinearGradient(0, midY, 0, cvs.height);
  floor.addColorStop(0, '#4a4a4a');
  floor.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = floor;
  ctx.fillRect(0, midY, cvs.width, midY);
}

function drawView(ctx, cvs, rays, x, y, orientation, fov) {
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  drawSkyAndFloor(ctx, cvs);
  const projDist = (rays / 2) / Math.tan(fov / 2);
  for (let i = 0; i < rays; i++) {
    const screenX = i - (rays - 1) / 2;
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
        context: ctx,
        x: Math.round(i * cvs.width / rays),
        y: (cvs.height / 2) - (contextualWallHeight / 2),
        width: Math.round((i + 1) * cvs.width / rays) - Math.round(i * cvs.width / rays),
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

const minimapRadius = 90;
const minimapScale = minimapRadius / (5 * CELL);

function drawMinimap() {
  const ctx = context2;
  const minimapX = minimapRadius + 15;
  const minimapY = canvas2.height - minimapRadius - 15;
  ctx.save();

  // Circular clip
  ctx.beginPath();
  ctx.arc(minimapX, minimapY, minimapRadius, 0, Math.PI * 2);
  ctx.clip();

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(minimapX - minimapRadius, minimapY - minimapRadius, minimapRadius * 2, minimapRadius * 2);

  // Center on player, rotate so forward = up
  ctx.translate(minimapX, minimapY);
  ctx.rotate(-orientation - Math.PI / 2);
  ctx.scale(minimapScale, minimapScale);
  ctx.translate(-playerX, -playerY);

  // Draw grid cells
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 1) {
        ctx.fillStyle = '#555';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
    }
  }

  // Draw FOV indicator
  drawFovIndicator(ctx, playerX, playerY, orientation, fov, 1);

  // Draw player
  ctx.beginPath();
  ctx.arc(playerX, playerY, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#e22';
  ctx.fill();

  ctx.restore();

  // Border
  ctx.beginPath();
  ctx.arc(minimapX, minimapY, minimapRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function animate() {
  updatePlayer();
  if (lowresMode) {
    drawView(lowresCtx, lowresCanvas, LOWRES_W, playerX, playerY, orientation, fov);
    quantize(lowresCtx, LOWRES_W, LOWRES_H);
    context2.clearRect(0, 0, canvas2.width, canvas2.height);
    context2.imageSmoothingEnabled = false;
    context2.drawImage(lowresCanvas, 0, 0, canvas2.width, canvas2.height);
  } else {
    drawView(context2, canvas2, numberOfRays, playerX, playerY, orientation, fov);
  }
  drawMinimap();
  requestAnimationFrame(animate);
}

document.addEventListener('keydown', (event) => {
  keys[event.code] = true;
  if (event.code === 'KeyL') lowresMode = !lowresMode;
});
document.addEventListener('keyup', (event) => { keys[event.code] = false; });


animate();
