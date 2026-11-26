// ARUNIKA — the three island hops: rings, landings, fuel, damage and score.

import { createPlane, STALL_SPEED } from './plane.js';
import { heightAt, runwayAt } from './terrain.js';

/** The three legs, east across the chain. Rings hang in the sky; land on the named runway. */
export function createMissions() {
  return [
    {
      name: 'FIRST HOP',
      brief: 'Take off from Arunika, thread three rings, land on Seroja.',
      startX: 300,
      startY: 48,
      fuel: 100,
      wind: 0,
      dusk: false,
      timeLimit: null,
      rings: [
        { x: 900, y: 150, r: 26, passed: false },
        { x: 1400, y: 190, r: 26, passed: false },
        { x: 1750, y: 150, r: 26, passed: false },
      ],
      targetRunway: { x0: 2050, x1: 2400 },
    },
    {
      name: 'MAIL RUN',
      brief: 'Four rings in 75 seconds — the mail will not wait.',
      startX: 2150,
      startY: 62,
      fuel: 100,
      wind: 3,
      dusk: false,
      timeLimit: 75,
      rings: [
        { x: 2600, y: 170, r: 26, passed: false },
        { x: 3050, y: 120, r: 26, passed: false },
        { x: 3400, y: 200, r: 26, passed: false },
        { x: 3650, y: 140, r: 26, passed: false },
      ],
      targetRunway: { x0: 3850, x1: 4180 },
    },
    {
      name: 'STORM LANDING',
      brief: 'Half a tank, a hard crosswind, one short runway at dusk.',
      startX: 4000,
      startY: 40,
      fuel: 55,
      wind: -8,
      dusk: true,
      timeLimit: null,
      rings: [
        { x: 4900, y: 160, r: 26, passed: false },
        { x: 5300, y: 110, r: 26, passed: false },
      ],
      targetRunway: { x0: 5550, x1: 5900 },
    },
  ];
}

/** How many rings of the current leg are already flown through. */
export function ringsPassed(leg) {
  return leg.rings.filter((r) => r.passed).length;
}

/** The current leg is done when every ring is passed and the plane stops on the target runway. */
function legDone(G) {
  const leg = G.legs[G.legIndex];
  return ringsPassed(leg) === leg.rings.length;
}

function say(G, text, seconds) {
  G.message = text;
  G.messageTime = seconds;
}

function burst(G, x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 20 + Math.random() * 90;
    G.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.5 + Math.random() * 0.6,
      maxLife: 1.1,
      color,
      size: 3 + Math.random() * 5,
    });
  }
}

function crashPlane(G, cause) {
  const p = G.plane;
  if (p.crashed) return;
  p.crashed = true;
  p.damage += 1;
  G.shake = 14;
  G.audio.crash();
  burst(G, p.x, p.y, '#ff7a3c', 26);
  burst(G, p.x, p.y, '#555555', 18);
  if (p.damage >= 3) {
    G.state = 'failed';
    say(G, `Out of planes — the ${cause} got you.`, 99);
  } else {
    say(G, `Crashed (${cause}) — damage ${p.damage}/3. Respawning…`, 1.6);
    G.respawnTimer = 1.6;
  }
}

function respawnLeg(G) {
  const leg = G.legs[G.legIndex];
  const damage = G.plane.damage;
  G.plane = createPlane(leg);
  G.plane.damage = damage;
  G.score = G.legStartScore;
  G.timeLeft = leg.timeLimit;
  G.state = 'flying';
  G.message = '';
  G.messageTime = 0;
  G.camera.x = G.plane.x;
  G.camera.y = 90;
}

function completeLeg(G) {
  const leg = G.legs[G.legIndex];
  let bonus = 250;
  if (leg.timeLimit !== null && G.timeLeft > 0) bonus += Math.round(G.timeLeft * 2);
  G.score += bonus;
  G.audio.thud();
  G.audio.chime();
  burst(G, G.plane.x, G.plane.y + 10, '#ffd23e', 20);
  if (G.legIndex >= G.legs.length - 1) {
    G.state = 'complete';
    G.totalTime = G.elapsed;
  } else {
    G.state = 'legdone';
    G.legBonus = bonus;
  }
}

/** Step missions one frame: rings, timer, ground contact, landings, crashes. */
export function updateMissions(G, dt) {
  const leg = G.legs[G.legIndex];
  const p = G.plane;
  if (G.state === 'flying' && p.crashed) {
    G.respawnTimer -= dt;
    if (G.respawnTimer <= 0) respawnLeg(G);
    return;
  }
  if (G.state !== 'flying' || p.crashed) return;
  if (leg.timeLimit !== null) {
    G.timeLeft -= dt;
    if (G.timeLeft <= 0) {
      G.timeLeft = 0;
      p.damage += 1;
      if (p.damage >= 3) {
        G.state = 'failed';
        say(G, 'Out of time — the mail never arrived.', 99);
      } else {
        say(G, `Out of time — damage ${p.damage}/3. Respawning…`, 1.6);
        G.respawnTimer = 1.6;
        p.crashed = true;
        G.shake = 8;
      }
      return;
    }
  }
  for (const ring of leg.rings) {
    if (ring.passed) continue;
    const dx = p.x - ring.x;
    const dy = p.y - ring.y;
    const dz = p.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < ring.r) {
      ring.passed = true;
      G.score += 100;
      G.audio.chime();
      burst(G, ring.x, ring.y, '#7ee2ff', 16);
      say(G, `Ring! +100  (${ringsPassed(leg)}/${leg.rings.length})`, 1.6);
    }
  }
  const ground = heightAt(p.x);
  if (!p.onGround && p.y <= ground + 2) {
    const runway = runwayAt(p.x);
    const target = leg.targetRunway;
    const onTarget = p.x >= target.x0 && p.x <= target.x1;
    if (runway !== null && p.vy >= -4.5 && p.vx <= 52) {
      const impactVy = p.vy;
      p.y = ground + 2;
      p.vy = 0;
      p.onGround = true;
      if (Math.abs(impactVy) > 0.5) G.audio.thud();
      if (p.vx < 6) {
        if (legDone(G) && onTarget) {
          completeLeg(G);
        } else if (onTarget) {
          say(G, 'On the runway — rings remain. Throttle up and go again.', 2.5);
        } else {
          say(G, 'Wrong runway — throttle up and go again.', 2.5);
        }
      }
    } else if (runway !== null && p.vy < -4.5) {
      p.damage += 1;
      p.vy = 2.5;
      G.shake = 8;
      G.audio.thud();
      say(G, `Hard landing! Damage ${p.damage}/3.`, 1.8);
      if (p.damage >= 3) {
        G.state = 'failed';
        say(G, 'Out of planes — the runway got you.', 99);
      }
    } else {
      crashPlane(G, ground <= 0.5 ? 'sea' : 'hillside');
    }
  }
  if (p.onGround && p.vx < 6) {
    const runway = runwayAt(p.x);
    const target = leg.targetRunway;
    if (runway !== null && legDone(G) && p.x >= target.x0 && p.x <= target.x1) {
      completeLeg(G);
    }
  }
  if (p.fuel <= 0 && p.onGround && p.vx < 1 && runwayAt(p.x) === null) {
    crashPlane(G, 'empty tank');
  }
  if (p.vx < STALL_SPEED && !p.onGround && p.y < ground + 30 && p.vy < -2) {
    say(G, 'PULL UP', 0.4);
  }
}

/** Draw the current leg's rings: next one glows, passed ones go green. */
export function drawRings(ctx, cam, G) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const scale = cam.scale;
  const leg = G.legs[G.legIndex];
  const toScreenX = (wx) => (wx - cam.x) * scale + W / 2;
  const toScreenY = (wy) => H * 0.55 - (wy - cam.y) * scale;
  for (let i = 0; i < leg.rings.length; i++) {
    const ring = leg.rings[i];
    const sx = toScreenX(ring.x);
    const sy = toScreenY(ring.y);
    if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) continue;
    const r = ring.r * scale;
    const isNext = leg.rings.findIndex((x) => !x.passed) === i;
    ctx.save();
    ctx.lineWidth = isNext ? 5 : 3;
    ctx.strokeStyle = ring.passed ? '#37d67a' : isNext ? '#ffb02e' : 'rgba(255,255,255,0.55)';
    ctx.shadowColor = ring.passed ? '#37d67a' : isNext ? '#ffb02e' : 'transparent';
    ctx.shadowBlur = isNext ? 18 : 0;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = ring.passed ? '#37d67a' : isNext ? '#ffb02e' : 'rgba(255,255,255,0.75)';
    ctx.font = `bold ${Math.round(15 * scale * 0.5)}px "Avenir Next", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(ring.passed ? '✓' : String(i + 1), sx, sy - r - 8);
    ctx.restore();
  }
}

/** Move to the next leg after the leg-done panel. */
export function nextLeg(G) {
  G.legIndex += 1;
  const leg = G.legs[G.legIndex];
  G.plane = createPlane(leg);
  G.plane.damage = 0;
  G.legStartScore = G.score;
  G.timeLeft = leg.timeLimit;
  G.state = 'flying';
  G.message = leg.brief;
  G.messageTime = 3;
  G.camera.x = G.plane.x;
  G.camera.y = 90;
}

/** Retry the current leg from scratch (damage and score reset to the leg start). */
export function retryLeg(G) {
  const leg = G.legs[G.legIndex];
  G.plane = createPlane(leg);
  G.score = G.legStartScore;
  G.timeLeft = leg.timeLimit;
  G.state = 'flying';
  G.message = leg.brief;
  G.messageTime = 3;
  G.camera.x = G.plane.x;
  G.camera.y = 90;
}
