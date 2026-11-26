// ARUNIKA — deterministic demo scenes for screenshots: each one parks the plane
// in a photogenic state so the first rendered frame already shows the game at
// its best. Reachable as ?scene=takeoff|cruise|ring|landing; plain play ignores it.

/** Place the game in a named demo scene. Returns true when a scene was applied. */
export function applyDemoScene(G, scene) {
  const leg = G.legs[G.legIndex];
  if (leg === undefined) return false;
  G.state = 'flying';
  G.message = '';
  G.messageTime = 0;
  if (scene === 'takeoff') {
    G.plane.x = leg.startX + 40;
    G.plane.y = leg.startY + 2;
    G.plane.vx = 0;
    G.plane.vy = 0;
    G.plane.pitch = 0;
    G.plane.heading = 0;
    G.plane.throttle = 0.9;
    G.plane.fuel = leg.fuel;
    G.plane.onGround = true;
    G.camera.x = G.plane.x;
    G.camera.y = 90;
    return true;
  }
  if (scene === 'cruise') {
    G.plane.x = 1330;
    G.plane.y = 190;
    G.plane.vx = 46;
    G.plane.vy = 1.5;
    G.plane.pitch = 3;
    G.plane.heading = 0;
    G.plane.throttle = 0.72;
    G.plane.fuel = 78;
    G.plane.onGround = false;
    leg.rings[0].passed = true;
    G.score = 100;
    G.camera.x = G.plane.x;
    G.camera.y = 142;
    return true;
  }
  if (scene === 'ring') {
    const ring = leg.rings[1];
    G.plane.x = ring.x - 150;
    G.plane.y = ring.y + 6;
    G.plane.vx = 48;
    G.plane.vy = 0;
    G.plane.pitch = 0;
    G.plane.heading = 0;
    G.plane.throttle = 0.75;
    G.plane.fuel = 71;
    G.plane.onGround = false;
    leg.rings[0].passed = true;
    G.score = 100;
    G.camera.x = G.plane.x + 60;
    G.camera.y = 142;
    return true;
  }
  if (scene === 'landing') {
    const runway = leg.targetRunway;
    G.plane.x = runway.x0 - 200;
    G.plane.y = 95;
    G.plane.vx = 38;
    G.plane.vy = -3;
    G.plane.pitch = -3;
    G.plane.heading = 0;
    G.plane.throttle = 0.4;
    G.plane.fuel = 52;
    G.plane.onGround = false;
    for (const ring of leg.rings) ring.passed = true;
    G.score = 300;
    G.camera.x = G.plane.x + 60;
    G.camera.y = 110;
    return true;
  }
  return false;
}
