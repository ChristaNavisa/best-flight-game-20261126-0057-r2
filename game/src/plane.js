// ARUNIKA — the aircraft: arcade flight physics and its drawing.

import { heightAt } from './terrain.js';

export const STALL_SPEED = 26;
export const MAX_SPEED = 74;

/** A fresh plane parked on the leg's start runway. */
export function createPlane(leg) {
  return {
    x: leg.startX,
    y: leg.startY,
    vx: 0,
    vy: 0,
    pitch: 0,
    heading: 0,
    z: 0,
    throttle: 0,
    fuel: leg.fuel,
    damage: 0,
    onGround: true,
    crashed: false,
    propAngle: 0,
  };
}

/** Clamp a number into a range. */
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Step the flight model one frame. Input: pitchUp/pitchDown/throttleUp/throttleDown/rudderLeft/rudderRight. */
export function updatePlane(G, dt, input) {
  const p = G.plane;
  if (p.crashed) return;
  if (input.throttleUp) p.throttle = clamp(p.throttle + 0.7 * dt, 0, 1);
  if (input.throttleDown) p.throttle = clamp(p.throttle - 0.7 * dt, 0, 1);
  if (input.pitchUp) p.pitch = clamp(p.pitch + 26 * dt, -14, 18);
  if (input.pitchDown) p.pitch = clamp(p.pitch - 26 * dt, -14, 18);
  if (!input.pitchUp && !input.pitchDown) p.pitch *= Math.max(0, 1 - 0.5 * dt);
  if (input.rudderLeft) p.heading = clamp(p.heading - 30 * dt, -20, 20);
  if (input.rudderRight) p.heading = clamp(p.heading + 30 * dt, -20, 20);
  const drag = 0.1 * p.vx + 0.0016 * p.vx * p.vx;
  const thrust = p.onGround ? p.throttle * 20 : p.throttle * 15;
  p.vx = clamp(p.vx + (thrust - drag) * dt, 0, MAX_SPEED);
  const climb = Math.sin((p.pitch * Math.PI) / 180) * p.vx;
  let targetVy = climb;
  if (p.vx < STALL_SPEED) targetVy -= (STALL_SPEED - p.vx) * 0.55;
  p.vy += (targetVy - p.vy) * Math.min(1, 1.6 * dt);
  const wind = G.legs[G.legIndex].wind;
  p.z = clamp(p.z + (p.vx * Math.sin((p.heading * Math.PI) / 180) + wind) * dt, -90, 90);
  if (p.onGround) {
    if (p.throttle < 0.1) p.vx = Math.max(0, p.vx - 10 * dt);
    if (p.vx > 30 && p.pitch > 3) p.onGround = false;
  }
  p.x += p.vx * dt;
  if (!p.onGround) p.y += p.vy * dt;
  else p.y = heightAt(p.x) + 2;
  if (p.fuel > 0 && (!p.onGround || p.vx > 5)) {
    p.fuel = Math.max(0, p.fuel - (0.22 + p.throttle * 0.85) * dt);
    if (p.fuel <= 0) p.throttle = 0;
  }
  p.propAngle += (2 + p.throttle * 38) * dt;
}

/** The plane's soft shadow on the ground below it, for depth and landing cues. */
export function drawPlaneShadow(ctx, cam, plane, heightAtFn) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const scale = cam.scale;
  const sx = (plane.x - cam.x) * scale + W / 2;
  const ground = heightAtFn(plane.x);
  const sy = H * 0.55 - (ground - cam.y) * scale;
  const alt = Math.max(0, plane.y - ground);
  const alpha = Math.max(0, 0.3 - alt * 0.0012);
  if (alpha <= 0.01) return;
  ctx.fillStyle = `rgba(10,30,40,${alpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 3, 26 * (1 - Math.min(0.5, alt * 0.001)), 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Draw the aircraft, side view facing right, pitched, with a spinning prop. */
export function drawPlane(ctx, cam, plane, t) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const scale = cam.scale;
  const depth = 1 + plane.z * 0.0012;
  const sx = (plane.x - cam.x) * scale + W / 2;
  const sy = H * 0.55 - (plane.y - cam.y) * scale - plane.z * 0.35;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate((-plane.pitch * Math.PI) / 180);
  ctx.scale(2 * depth, 2 * depth);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#14505c';
  ctx.fillStyle = '#1f8a8a';
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.quadraticCurveTo(-20, -6, -8, -6.5);
  ctx.lineTo(10, -5);
  ctx.quadraticCurveTo(22, -3.5, 24, 0);
  ctx.quadraticCurveTo(22, 3.5, 10, 4.5);
  ctx.lineTo(-10, 5);
  ctx.quadraticCurveTo(-20, 4.5, -24, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f08a24';
  ctx.fillRect(-8, -5.5, 18, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-10, 3.2, 20, 1.6);
  ctx.fillStyle = '#bfe9f5';
  ctx.beginPath();
  ctx.moveTo(4, -5);
  ctx.quadraticCurveTo(12, -7.5, 17, -2);
  ctx.lineTo(14, 0);
  ctx.lineTo(4, -1.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#14505c';
  ctx.stroke();
  ctx.fillStyle = '#1f8a8a';
  ctx.beginPath();
  ctx.moveTo(-14, -5);
  ctx.lineTo(-20, -14);
  ctx.lineTo(-15, -14);
  ctx.lineTo(-8, -5.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(-26, -8);
  ctx.lineTo(-21, -8);
  ctx.lineTo(-17, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8f4f8';
  ctx.beginPath();
  ctx.moveTo(-2, -6);
  ctx.lineTo(8, -13);
  ctx.lineTo(12, -13);
  ctx.lineTo(4, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#14505c';
  ctx.font = 'bold 5px "Avenir Next", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ARUNIKA', -2, 2.5);
  const spin = plane.propAngle;
  ctx.save();
  ctx.translate(24, 0);
  ctx.fillStyle = 'rgba(200,230,240,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 3, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#23414e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(spin) * 12, Math.sin(spin) * 12);
  ctx.moveTo(0, 0);
  ctx.lineTo(-Math.cos(spin) * 12, -Math.sin(spin) * 12);
  ctx.stroke();
  ctx.fillStyle = '#f08a24';
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
