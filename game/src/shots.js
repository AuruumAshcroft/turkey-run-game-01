// The screenshot scenes behind ?shot=start|play|end|escape. Each one plays
// the real rules forward from a fresh world for a fixed number of steps,
// steered by a simple autopilot, so the frame is what a short game really
// looks like and the same seed always gives the same frame.
import { ACTION_DASH, ACTION_JUMP } from './input.js';
import { EVENT_OVER, EVENT_ESCAPED } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { STEP, TURKEY } from './config.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 24;
const END_LIMIT_SECONDS = 300;

/**
 * The lead window for jumping a hazard: start the jump so the turkey's
 * feet are above the hazard's top for the whole time it overlaps the
 * turkey. `lead` is the seconds until the hazard first touches the
 * turkey's box. Returns [earliest, latest] lead to start the jump, or
 * null when the hazard cannot be cleared by jumping at all.
 */
function jumpWindow(height, width, speed) {
  const v0 = -TURKEY.jumpVelocity;
  const g = TURKEY.gravity;
  const disc = v0 * v0 - 2 * g * height;
  if (disc <= 0) return null;
  const root = Math.sqrt(disc);
  const t1 = (v0 - root) / g;
  const t2 = (v0 + root) / g;
  const overlap = (width + TURKEY.width - 12) / speed;
  if (t2 - overlap < t1) return null;
  return [t1, t2 - overlap];
}

/**
 * The autopilot: jump the hazard ahead inside its lead window, duck the
 * clothesline, dash through a hazard it is too late to jump, and dash
 * away when the farmer is breathing down the turkey's neck. `skill` 1
 * plays well, 0 plays like a hurried first-timer and gets caught.
 */
export function autopilot(state, skill) {
  const t = state.turkey;
  if (t.hiding) return { actions: 0, duck: false };
  const speed = state.speed;
  let jump = false;
  let duck = false;
  let dash = false;
  let nearestLead = Infinity;
  // Hiding is a bonus, never a reason to skip a jump: note the haystack,
  // but keep reading the hazards below.
  let haystackNear = false;
  for (const entity of state.entities) {
    if (entity.kind === 'haystack' && !entity.used && entity.x < TURKEY.x + 70 && entity.x > TURKEY.x - 20) {
      haystackNear = true;
    }
  }
  for (const entity of state.entities) {
    if (entity.kind === 'corn' || entity.kind === 'pie' || entity.kind === 'feather' || entity.kind === 'haystack') continue;
    const near = entity.x - TURKEY.x;
    if (near < -40 || near > 560) continue;
    if (entity.kind === 'line') {
      if (skill >= 1 && near < 200) duck = true;
      continue;
    }
    if (skill < 1) continue;
    // Seconds until this hazard first touches the turkey's box: its left
    // edge (plus the box offset) reaching the turkey's right edge at 222.
    const width = entity.kind === 'knife' ? 26 : entity.w;
    const dx = entity.kind === 'knife' ? 2 : 0;
    const lead = (near + dx - 52) / speed;
    if (lead < nearestLead) nearestLead = lead;
    const height = entity.kind === 'knife' ? 70 : entity.h;
    const window = jumpWindow(height, width, speed);
    if (window) {
      // Jump in the second half of the window: the feet are highest in
      // the middle of the overlap, and the window's early edge lands the
      // turkey on the hazard's far side by a pixel.
      const mid = (window[0] + window[1]) / 2;
      if (lead >= window[0] && lead <= mid) jump = true;
    }
    // Too late to jump and the dash is ready: dash through it instead.
    if (lead >= 0 && lead < 0.12 && t.dashCooldown <= 0) dash = true;
  }
  let actions = 0;
  if (jump && t.grounded) actions |= ACTION_JUMP;
  else if (haystackNear) duck = true;
  if (dash) actions |= ACTION_DASH;
  if (skill >= 1 && state.gap < 78 && t.dashCooldown <= 0 && nearestLead > 1.2) actions |= ACTION_DASH;
  return { actions, duck };
}

/** Set `world` to the named scene and return the screen to draw over it. */
export function stageShot(name, world) {
  world.reset();
  const state = world.state;
  if (name !== 'play' && name !== 'end' && name !== 'escape') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, 0, false, true);
    return { screen: SCREEN_TITLE, escaped: false, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : name === 'escape' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const skill = name === 'end' ? 0 : 1;
  let escaped = false;
  for (let i = 0; i < limit / STEP; i += 1) {
    const pilot = autopilot(state, skill);
    const events = world.step(STEP, pilot.actions, pilot.duck, false);
    if (events & EVENT_ESCAPED) {
      escaped = true;
      break;
    }
    if (events & EVENT_OVER) break;
    // The escape scene jumps the distance up so it lands in the woods, and
    // the score with it, so the end screen's numbers agree.
    if (name === 'escape' && i === 30) {
      state.score += 1185 - state.distance;
      state.distance = 1185;
    }
  }
  const over = state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, escaped, best: Math.floor(state.score) };
}
