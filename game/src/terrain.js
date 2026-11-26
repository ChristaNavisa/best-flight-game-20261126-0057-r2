// ARUNIKA — the island chain: terrain height, sky, sea and drawing.

/** A small seeded PRNG so the world looks the same every run. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The islands, east to west: name, span, flat top, runway strip, palette. */
export const ISLANDS = [
  { name: 'ARUNIKA', x0: 0, x1: 1000, top: 46, runway: { x0: 140, x1: 460 }, sand: '#e8d29a', grass: '#4f9e4d' },
  { name: 'SEROJA', x0: 1900, x1: 2900, top: 60, runway: { x0: 2050, x1: 2400 }, sand: '#ecd9a8', grass: '#57a854' },
  { name: 'KARANG', x0: 3700, x1: 4700, top: 38, runway: { x0: 3850, x1: 4180 }, sand: '#e2cf92', grass: '#47915a' },
  { name: 'SENJA', x0: 5400, x1: 6400, top: 45, runway: { x0: 5550, x1: 5900 }, sand: '#e8d29a', grass: '#4f9e4d' },
];
export const WORLD_END = 6800;
export const SEA_LEVEL = 0;

/** The ground height at world x: flat runway tops, smooth island slopes, sea elsewhere. */
export function heightAt(x) {
  for (const isl of ISLANDS) {
    if (x < isl.x0 - 260 || x > isl.x1 + 260) continue;
    const top = isl.top;
    const plateau0 = isl.x0 + 100;
    const plateau1 = isl.x1 - 100;
    if (x >= plateau0 && x <= plateau1) return top;
    if (x < plateau0) {
      const u = (x - (isl.x0 - 260)) / 360;
      if (u <= 0) return 0;
      return top * (0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, u)));
    }
    const u = (x - plateau1) / 360;
    if (u >= 1) return 0;
    return top * (0.5 + 0.5 * Math.cos(Math.PI * Math.max(0, u)));
  }
  return 0;
}

/** The runway an x sits on, or null. */
export function runwayAt(x) {
  for (const isl of ISLANDS) {
    if (x >= isl.runway.x0 && x <= isl.runway.x1) return isl.runway;
  }
  return null;
}

/** Build the world's decoration: clouds, palms, far isles — all seeded, all fixed. */
export function createWorld() {
  const rand = mulberry32(20261126);
  const clouds = [];
  for (let i = 0; i < 16; i++) {
    clouds.push({ x: rand() * 7000, y: 300 + rand() * 220, s: 0.5 + rand() * 0.6, v: 1.5 + rand() * 3 });
  }
  const palms = [];
  for (const isl of ISLANDS) {
    for (let i = 0; i < 7; i++) {
      const x = isl.x0 + 130 + rand() * (isl.x1 - isl.x0 - 260);
      if (x > isl.runway.x0 - 40 && x < isl.runway.x1 + 40) continue;
      palms.push({ x, lean: (rand() - 0.5) * 0.5, h: 14 + rand() * 8 });
    }
  }
  const farIsles = [];
  for (let i = 0; i < 11; i++) {
    farIsles.push({ x: 400 + i * 600, y: 0, w: 650 + rand() * 450, h: 70 + rand() * 60 });
  }
  return { clouds, palms, farIsles, rand };
}

/** Sky colours by leg mood: day, or the dusk of the last leg. */
export function skyColors(dusk) {
  if (dusk) return { top: '#3a2a5e', mid: '#b85c6e', horizon: '#f2a35e', sea: '#4a3a6e', seaDeep: '#2e2450' };
  return { top: '#2f7fc4', mid: '#7ec8e3', horizon: '#d8f0f7', sea: '#2e7fa8', seaDeep: '#1d5a7d' };
}

function drawCloud(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.beginPath();
  ctx.ellipse(x, y, 46 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 30 * s, y + 4 * s, 30 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 32 * s, y + 4 * s, 32 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPalm(ctx, sx, sy, scale, lean, t) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(lean + Math.sin(t * 0.7 + sx * 0.01) * 0.03);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#6b4a2b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(3, -10, 2, -18);
  ctx.stroke();
  ctx.strokeStyle = '#2f7d32';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * (0.15 + i * 0.17);
    ctx.beginPath();
    ctx.moveTo(2, -18);
    ctx.quadraticCurveTo(2 + Math.cos(a) * 8, -18 + Math.sin(a) * 6, 2 + Math.cos(a) * 15, -18 + Math.sin(a) * 11);
    ctx.stroke();
  }
  ctx.restore();
}

/** Draw the world for one frame: sky, sun, clouds, far isles, sea, islands, runways. */
export function drawWorld(ctx, cam, G, t) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const scale = cam.scale;
  const dusk = G.legs[G.legIndex].dusk === true;
  const sky = skyColors(dusk);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, sky.top);
  grad.addColorStop(0.55, sky.mid);
  grad.addColorStop(0.8, sky.horizon);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  const sunX = W - 180;
  const sunY = dusk ? 210 : 110;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 90);
  sunGrad.addColorStop(0, dusk ? 'rgba(255,190,110,0.95)' : 'rgba(255,246,200,0.95)');
  sunGrad.addColorStop(0.35, dusk ? 'rgba(255,150,90,0.45)' : 'rgba(255,240,180,0.45)');
  sunGrad.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - 100, sunY - 100, 200, 200);
  ctx.fillStyle = dusk ? '#ffb45e' : '#fff3c4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, dusk ? 34 : 28, 0, Math.PI * 2);
  ctx.fill();
  const toScreenX = (wx) => (wx - cam.x) * scale + W / 2;
  const toScreenY = (wy) => H * 0.55 - (wy - cam.y) * scale;
  for (const c of G.world.clouds) {
    let sx = (c.x - cam.x) * scale * 0.35 + W / 2 + t * c.v;
    sx = (((sx + 200) % (W + 400)) + (W + 400)) % (W + 400) - 200;
    drawCloud(ctx, sx, 30 + (c.y % 200), c.s);
  }
  ctx.fillStyle = 'rgba(70,110,140,0.5)';
  for (const f of G.world.farIsles) {
    const fx = (f.x - cam.x * 0.5) * scale + W / 2;
    ctx.beginPath();
    ctx.moveTo(fx - (f.w * scale * 0.5) / 2, toScreenY(0));
    ctx.quadraticCurveTo(fx, toScreenY(0) - f.h * scale * 0.5, fx + (f.w * scale * 0.5) / 2, toScreenY(0));
    ctx.closePath();
    ctx.fill();
  }
  const seaGrad = ctx.createLinearGradient(0, toScreenY(0), 0, H);
  seaGrad.addColorStop(0, sky.sea);
  seaGrad.addColorStop(1, sky.seaDeep);
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, toScreenY(0), W, H - toScreenY(0));
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    for (let sx = 0; sx <= W; sx += 16) {
      const wx = cam.x + (sx - W / 2) / scale;
      const wy = 2.5 * Math.sin(wx * 0.02 + t * 1.4 + i * 1.7) + i * 7;
      const sy = toScreenY(0) + 12 + i * 16 + wy;
      if (sx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  for (const isl of ISLANDS) {
    const x0 = isl.x0 - 260;
    const x1 = isl.x1 + 260;
    ctx.beginPath();
    ctx.moveTo(toScreenX(x0), toScreenY(0));
    for (let wx = x0; wx <= x1; wx += 12) {
      ctx.lineTo(toScreenX(wx), toScreenY(heightAt(wx)));
    }
    ctx.lineTo(toScreenX(x1), toScreenY(0));
    ctx.closePath();
    const gGrad = ctx.createLinearGradient(0, toScreenY(isl.top), 0, toScreenY(0));
    gGrad.addColorStop(0, isl.grass);
    gGrad.addColorStop(1, '#3a7d3f');
    ctx.fillStyle = gGrad;
    ctx.fill();
    ctx.strokeStyle = isl.sand;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(toScreenX(x0), toScreenY(0));
    for (let wx = x0; wx <= x1; wx += 12) {
      ctx.lineTo(toScreenX(wx), toScreenY(Math.max(0, heightAt(wx) - 1)));
    }
    ctx.stroke();
    const r = isl.runway;
    ctx.fillStyle = '#3c3f45';
    ctx.fillRect(toScreenX(r.x0), toScreenY(isl.top) - 3, (r.x1 - r.x0) * scale, 7);
    ctx.fillStyle = '#f5f5f5';
    for (let wx = r.x0 + 18; wx < r.x1 - 10; wx += 36) {
      ctx.fillRect(toScreenX(wx), toScreenY(isl.top) - 1.5, 18 * scale, 4);
    }
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 15px "Avenir Next", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isl.name, toScreenX((isl.x0 + isl.x1) / 2), toScreenY(isl.top) - 26);
  }
  for (const p of G.world.palms) {
    const px = toScreenX(p.x);
    if (px < -40 || px > W + 40) continue;
    drawPalm(ctx, px, toScreenY(heightAt(p.x)), 1.1, p.lean, t);
  }
}
