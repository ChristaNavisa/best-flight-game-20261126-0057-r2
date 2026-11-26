// ARUNIKA — the instruments: tapes, compass, horizon, fuel, banners and panels.

import { ringsPassed } from './missions.js';

const FONT = '"Avenir Next", "Segoe UI", system-ui, sans-serif';

function panel(ctx, x, y, w, h, alpha) {
  ctx.fillStyle = `rgba(8, 26, 38, ${alpha})`;
  ctx.strokeStyle = 'rgba(180, 220, 240, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
}

function bigNumber(ctx, x, y, value, label, color) {
  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText(value, x, y);
  ctx.fillStyle = '#9fc6d8';
  ctx.font = `700 12px ${FONT}`;
  ctx.fillText(label, x, y + 18);
}

function compassStrip(ctx, cx, y, headingDeg) {
  const W = 260;
  const H = 34;
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - W / 2, y, W, H);
  ctx.clip();
  ctx.fillStyle = 'rgba(8, 26, 38, 0.72)';
  ctx.fillRect(cx - W / 2, y, W, H);
  ctx.textAlign = 'center';
  for (let d = -60; d <= 60; d += 5) {
    const deg = Math.round((headingDeg + d + 360) % 360);
    const x = cx + d * 2.1;
    const major = deg % 30 === 0;
    ctx.strokeStyle = major ? '#e8f4f8' : 'rgba(232,244,248,0.45)';
    ctx.lineWidth = major ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y + H - (major ? 12 : 7));
    ctx.lineTo(x, y + H);
    ctx.stroke();
    if (major) {
      ctx.fillStyle = '#e8f4f8';
      ctx.font = `700 11px ${FONT}`;
      ctx.fillText(String(deg).padStart(3, '0'), x, y + 12);
    }
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(180, 220, 240, 0.5)';
  ctx.strokeRect(cx - W / 2, y, W, H);
  ctx.fillStyle = '#ffb02e';
  ctx.beginPath();
  ctx.moveTo(cx, y + H + 2);
  ctx.lineTo(cx - 6, y + H + 10);
  ctx.lineTo(cx + 6, y + H + 10);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 15px ${FONT}`;
  ctx.fillText(`HDG ${String(Math.round(headingDeg)).padStart(3, '0')}°`, cx, y + H + 28);
}

function artificialHorizon(ctx, cx, cy, r, pitchDeg, rollDeg) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#3f8fd2';
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rollDeg * Math.PI) / 180);
  ctx.translate(0, (pitchDeg / 18) * r);
  ctx.fillStyle = '#7a5a34';
  ctx.fillRect(-r, 0, r * 2, r);
  ctx.fillStyle = '#e8f4f8';
  ctx.fillRect(-r, -1.5, r * 2, 3);
  ctx.restore();
  ctx.strokeStyle = '#ffb02e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy);
  ctx.lineTo(cx - 4, cy);
  ctx.moveTo(cx + 4, cy);
  ctx.lineTo(cx + 14, cy);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(232,244,248,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9fc6d8';
  ctx.font = `700 11px ${FONT}`;
  ctx.fillText('ATTITUDE', cx, cy + r + 16);
}

function gaugeBar(ctx, x, y, w, h, frac, color, label) {
  ctx.fillStyle = 'rgba(8, 26, 38, 0.72)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, (w - 4) * Math.max(0, Math.min(1, frac)), h - 4);
  ctx.strokeStyle = 'rgba(180, 220, 240, 0.5)';
  ctx.strokeRect(x, y, w, h);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8f4f8';
  ctx.font = `700 12px ${FONT}`;
  ctx.fillText(label, x, y - 6);
}

/** Draw every instrument and banner for one frame. */
export function drawHud(ctx, G) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const p = G.plane;
  const leg = G.legs[G.legIndex];
  const speedKt = Math.round(p.vx * 1.944);
  const altFt = Math.round(p.y * 3.281);
  const headingDeg = (90 + p.heading + 360) % 360;
  panel(ctx, 16, 14, 190, 86, 0.72);
  bigNumber(ctx, 30, 46, String(speedKt), 'SPEED · KT', '#ffffff');
  bigNumber(ctx, 118, 46, String(altFt), 'ALT · FT', '#ffffff');
  ctx.fillStyle = '#9fc6d8';
  ctx.font = `700 12px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${G.score}`, 30, 88);
  compassStrip(ctx, W / 2, 16, headingDeg);
  const dev = Math.round((p.z / 90) * 50);
  ctx.fillStyle = 'rgba(8, 26, 38, 0.72)';
  ctx.fillRect(W / 2 - 55, 84, 110, 8);
  ctx.fillStyle = '#7ee2ff';
  ctx.fillRect(W / 2 - 2 + dev, 84, 4, 8);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9fc6d8';
  ctx.font = `700 11px ${FONT}`;
  ctx.fillText('COURSE', W / 2, 106);
  gaugeBar(ctx, W - 186, 22, 170, 16, p.fuel / 100, p.fuel < 20 ? '#ff5a4e' : '#37d67a', `FUEL ${Math.round(p.fuel)}%`);
  gaugeBar(ctx, W - 186, 62, 170, 16, p.throttle, '#ffb02e', `THROTTLE ${Math.round(p.throttle * 100)}%`);
  artificialHorizon(ctx, 66, H - 66, 46, p.pitch, p.heading * 0.6);
  panel(ctx, W / 2 - 340, 116, 680, 78, 0.55);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 17px ${FONT}`;
  ctx.fillText(`LEG ${G.legIndex + 1} — ${leg.name}`, W / 2, 134);
  ctx.fillStyle = '#cfe8f2';
  ctx.font = `400 14px ${FONT}`;
  ctx.fillText(leg.brief, W / 2, 156);
  let dots = '';
  for (const ring of leg.rings) dots += ring.passed ? '● ' : '○ ';
  ctx.fillStyle = '#ffb02e';
  ctx.font = `700 16px ${FONT}`;
  ctx.fillText(`RINGS ${dots}   DAMAGE ${p.damage}/3`, W / 2, 178);
  if (leg.timeLimit !== null && G.state === 'flying') {
    ctx.fillStyle = G.timeLeft < 15 ? '#ff5a4e' : '#ffffff';
    ctx.font = `800 22px ${FONT}`;
    ctx.fillText(`TIME ${Math.ceil(G.timeLeft)}s`, W / 2, 208);
  }
  const blink = Math.floor(performance.now() / 350) % 2 === 0;
  if (G.state === 'flying') {
    if (p.fuel < 20 && p.fuel > 0 && blink) {
      ctx.fillStyle = '#ff5a4e';
      ctx.font = `800 26px ${FONT}`;
      ctx.fillText('LOW FUEL', W / 2, H / 2 - 120);
    }
    if (p.vx < 26 && !p.onGround && blink) {
      ctx.fillStyle = '#ffb02e';
      ctx.font = `800 26px ${FONT}`;
      ctx.fillText('STALL — NOSE DOWN, POWER UP', W / 2, H / 2 - 88);
    }
    if (p.vx > 52 && p.y < 60 && !p.onGround) {
      ctx.fillStyle = '#ffb02e';
      ctx.font = `800 22px ${FONT}`;
      ctx.fillText('TOO FAST TO LAND', W / 2, H / 2 - 88);
    }
  }
  if (G.message !== '' && G.messageTime > 0) {
    ctx.font = `700 19px ${FONT}`;
    const msgWidth = ctx.measureText(G.message).width;
    ctx.fillStyle = 'rgba(8, 26, 38, 0.6)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - msgWidth / 2 - 14, H - 116, msgWidth + 28, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(G.message, W / 2, H - 95);
  }
  if (G.state === 'flying' && G.elapsed < 12) {
    const hint = '↑↓ pitch · ←→ throttle · A/D rudder · R retry · P pause · M sound';
    ctx.fillStyle = 'rgba(8, 26, 38, 0.6)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 280, H - 38, 560, 24, 12);
    ctx.fill();
    ctx.fillStyle = '#dfeef5';
    ctx.font = `400 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(hint, W / 2, H - 21);
  }
}

function dimScreen(ctx) {
  ctx.fillStyle = 'rgba(6, 20, 30, 0.62)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function centerTitle(ctx, text, y, size, color) {
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = `800 ${size}px ${FONT}`;
  ctx.fillText(text, ctx.canvas.width / 2, y);
}

function centerLine(ctx, text, y, size, color) {
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = `400 ${size}px ${FONT}`;
  ctx.fillText(text, ctx.canvas.width / 2, y);
}

/** The title screen: name, promise, controls, legs. */
export function drawTitle(ctx, G) {
  dimScreen(ctx);
  const W = ctx.canvas.width;
  centerTitle(ctx, 'ARUNIKA', 190, 84, '#ffffff');
  centerLine(ctx, '— ISLAND HOP FLIGHT —', 232, 24, '#ffb02e');
  centerLine(ctx, 'Three hops across the chain. Thread the rings. Mind the fuel. Land it gentle.', 288, 18, '#cfe8f2');
  centerLine(ctx, '↑ ↓  pitch      ← →  throttle      A / D  rudder      R  retry      P  pause      M  sound', 348, 17, '#ffffff');
  const legs = ['1 · FIRST HOP — Arunika to Seroja, three rings', '2 · MAIL RUN — four rings in 75 seconds', '3 · STORM LANDING — half a tank, crosswind, dusk'];
  for (let i = 0; i < legs.length; i++) {
    centerLine(ctx, legs[i], 408 + i * 30, 17, '#cfe8f2');
  }
  const pulse = 0.65 + 0.35 * Math.sin(performance.now() / 400);
  ctx.globalAlpha = pulse;
  centerLine(ctx, 'Press ENTER or click to fly', 540, 24, '#ffffff');
  ctx.globalAlpha = 1;
  if (G.bestScore > 0) centerLine(ctx, `Best score: ${G.bestScore}`, 580, 16, '#9fc6d8');
  void W;
}

/** The pause overlay. */
export function drawPaused(ctx) {
  dimScreen(ctx);
  centerTitle(ctx, 'PAUSED', 330, 56, '#ffffff');
  centerLine(ctx, 'Press P to keep flying', 380, 18, '#cfe8f2');
}

/** The crash / out-of-planes panel. */
export function drawFailed(ctx, G) {
  dimScreen(ctx);
  centerTitle(ctx, 'OUT OF PLANES', 300, 56, '#ff5a4e');
  centerLine(ctx, G.message, 350, 19, '#ffffff');
  centerLine(ctx, `Score this run: ${G.score}`, 392, 18, '#cfe8f2');
  centerLine(ctx, 'Press R to retry the leg', 448, 20, '#ffb02e');
}

/** The leg-complete panel. */
export function drawLegDone(ctx, G) {
  dimScreen(ctx);
  const leg = G.legs[G.legIndex];
  centerTitle(ctx, 'LEG COMPLETE', 300, 56, '#37d67a');
  centerLine(ctx, `${leg.name} — bonus +${G.legBonus}`, 352, 20, '#ffffff');
  centerLine(ctx, `Score so far: ${G.score}`, 392, 18, '#cfe8f2');
  centerLine(ctx, 'Press ENTER for the next leg', 448, 20, '#ffb02e');
}

/** The final panel: every island hopped. */
export function drawComplete(ctx, G) {
  dimScreen(ctx);
  centerTitle(ctx, 'ALL ISLANDS HOPPED!', 280, 60, '#ffd23e');
  centerLine(ctx, 'Arunika → Seroja → Karang → Senja. The mail is delivered, the tank is dry, the plane is home.', 332, 18, '#ffffff');
  centerLine(ctx, `Final score: ${G.score}`, 384, 24, '#ffb02e');
  centerLine(ctx, `Time: ${Math.round(G.totalTime)}s`, 420, 18, '#cfe8f2');
  centerLine(ctx, 'Press R to fly it all again', 470, 20, '#ffffff');
}
