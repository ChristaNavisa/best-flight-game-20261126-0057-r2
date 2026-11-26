// ARUNIKA — the game loop: input, camera, particles, states and demo scenes.

import { createWorld, drawWorld, heightAt, WORLD_END } from './terrain.js';
import { createPlane, updatePlane, drawPlane, drawPlaneShadow } from './plane.js';
import { createMissions, updateMissions, drawRings, nextLeg, retryLeg } from './missions.js';
import { createAudio } from './audio.js';
import { applyDemoScene } from './demo.js';
import { drawHud, drawTitle, drawPaused, drawFailed, drawLegDone, drawComplete } from './hud.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const G = {
  world: createWorld(),
  legs: createMissions(),
  legIndex: 0,
  plane: null,
  score: 0,
  legStartScore: 0,
  legBonus: 0,
  timeLeft: null,
  camera: { x: 300, y: 90, scale: 2 },
  state: 'title',
  message: '',
  messageTime: 0,
  particles: [],
  shake: 0,
  elapsed: 0,
  totalTime: 0,
  respawnTimer: 0,
  bestScore: 0,
  audio: createAudio(),
};
G.plane = createPlane(G.legs[0]);
G.timeLeft = G.legs[0].timeLimit;
try {
  G.bestScore = Number(window.localStorage.getItem('arunika-best') || 0) || 0;
} catch (e) {
  G.bestScore = 0;
}

const input = {
  pitchUp: false,
  pitchDown: false,
  throttleUp: false,
  throttleDown: false,
  rudderLeft: false,
  rudderRight: false,
};

const KEYMAP = {
  ArrowUp: 'pitchUp',
  KeyW: 'pitchUp',
  ArrowDown: 'pitchDown',
  KeyS: 'pitchDown',
  ArrowRight: 'throttleUp',
  KeyD: 'throttleUp',
  ArrowLeft: 'throttleDown',
  KeyA: 'throttleDown',
  KeyQ: 'rudderLeft',
  KeyE: 'rudderRight',
};

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function startGame() {
  if (G.state !== 'title') return;
  G.state = 'flying';
  G.audio.resume();
  G.message = G.legs[0].brief;
  G.messageTime = 3;
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter') {
    if (G.state === 'title') startGame();
    else if (G.state === 'legdone') nextLeg(G);
    return;
  }
  if (e.code === 'KeyR') {
    if (G.state === 'failed' || G.state === 'complete') {
      G.legs = createMissions();
      G.legIndex = 0;
      G.score = 0;
      G.legStartScore = 0;
      G.plane = createPlane(G.legs[0]);
      G.timeLeft = G.legs[0].timeLimit;
      G.state = 'flying';
      G.message = G.legs[0].brief;
      G.messageTime = 3;
      G.elapsed = 0;
    } else if (G.state === 'flying') {
      retryLeg(G);
    }
    return;
  }
  if (e.code === 'KeyP') {
    if (G.state === 'flying') G.state = 'paused';
    else if (G.state === 'paused') G.state = 'flying';
    return;
  }
  if (e.code === 'KeyM') {
    G.audio.toggleMute();
    return;
  }
  const field = KEYMAP[e.code];
  if (field) {
    input[field] = true;
    if (e.code.startsWith('Arrow')) e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  const field = KEYMAP[e.code];
  if (field) input[field] = false;
});

canvas.addEventListener('pointerdown', () => {
  if (G.state === 'title') startGame();
});

function updateParticles(dt) {
  for (const pt of G.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 12 * dt;
    pt.life -= dt;
  }
  G.particles = G.particles.filter((pt) => pt.life > 0);
}

function drawParticles() {
  for (const pt of G.particles) {
    const sx = (pt.x - G.camera.x) * G.camera.scale + canvas.width / 2;
    const sy = canvas.height * 0.55 - (pt.y - G.camera.y) * G.camera.scale;
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(sx, sy, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function update(dt) {
  if (G.state === 'flying') {
    G.elapsed += dt;
    updatePlane(G, dt, input);
    updateMissions(G, dt);
    if (G.messageTime > 0) G.messageTime -= dt;
    if (G.messageTime <= 0) G.message = '';
    if (G.plane.x > WORLD_END - 60) G.plane.x = WORLD_END - 60;
    const targetX = G.plane.x + 130;
    const targetY = clamp(G.plane.y + 35, 55, 142);
    G.camera.x += (targetX - G.camera.x) * Math.min(1, 2.2 * dt);
    G.camera.y += (targetY - G.camera.y) * Math.min(1, 2.2 * dt);
    G.audio.setEngine(G.plane.throttle);
    if (G.plane.fuel <= 0 && !G.plane.onGround) G.audio.wind(0.4);
    else G.audio.wind(0.12 + G.plane.vx / 200);
  } else if (G.state === 'title') {
    G.plane.propAngle += dt * 12;
  }
  updateParticles(dt);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - 40 * dt);
}

function render(t) {
  const shakeX = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
  const shakeY = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawWorld(ctx, G.camera, G, t);
  if (G.state !== 'title') {
    drawRings(ctx, G.camera, G);
    drawPlaneShadow(ctx, G.camera, G.plane, heightAt);
    drawPlane(ctx, G.camera, G.plane, t);
    drawParticles();
    drawHud(ctx, G);
  } else {
    drawPlaneShadow(ctx, G.camera, G.plane, heightAt);
    drawPlane(ctx, G.camera, G.plane, t);
    drawHud(ctx, G);
    drawTitle(ctx, G);
  }
  if (G.state === 'paused') drawPaused(ctx);
  if (G.state === 'failed') drawFailed(ctx, G);
  if (G.state === 'legdone') drawLegDone(ctx, G);
  if (G.state === 'complete') {
    if (G.score > G.bestScore) {
      G.bestScore = G.score;
      try {
        window.localStorage.setItem('arunika-best', String(G.bestScore));
      } catch (e) {
        // Storage may be unavailable; the best score simply is not kept.
      }
    }
    drawComplete(ctx, G);
  }
  ctx.restore();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(now / 1000);
  window.requestAnimationFrame(frame);
}

const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
if (scene === 'takeoff' || scene === 'cruise' || scene === 'ring' || scene === 'landing') {
  applyDemoScene(G, scene);
} else if (params.get('autostart') === '1') {
  startGame();
}
window.requestAnimationFrame(frame);
