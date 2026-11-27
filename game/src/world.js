// The run itself: the turkey's physics, the farmer closing in behind, the
// hazards and pickups scrolling in, the three stages from farmyard to
// kitchen, and the two ways a run ends — caught, or escaped.
import { FARMER, GROUND_Y, HAZARDS, RUN, SCORE, STAGES, STEP, TURKEY, VIEW } from './config.js';
import { ACTION_DASH, ACTION_JUMP } from './input.js';
import { createRandom } from './random.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_PICKUP = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_HIDE = 16;

const SPAWN_TABLES = {
  farmyard: [
    ['fence', 3], ['haybale', 2], ['puddle', 1], ['line', 2],
    ['corn', 3], ['haystack', 1], ['feather', 0.3],
  ],
  barn: [
    ['crate', 3], ['pitchfork', 2], ['line', 2], ['haybale', 1],
    ['corn', 3], ['haystack', 1], ['feather', 0.3],
  ],
  kitchen: [
    ['oven', 3], ['knife', 2], ['rollingpin', 2],
    ['pie', 1], ['corn', 2], ['haystack', 0.7], ['feather', 0.3],
  ],
};

function weightedPick(random, table) {
  let total = 0;
  for (const [, weight] of table) total += weight;
  let roll = random.next() * total;
  for (const [kind, weight] of table) {
    roll -= weight;
    if (roll <= 0) return kind;
  }
  return table[0][0];
}

function hazardBox(entity) {
  if (entity.kind === 'knife') {
    if (entity.mode === 'hang') return null;
    return { x: entity.x + 2, y: entity.y, w: 26, h: 70 };
  }
  if (entity.kind === 'line') {
    // A clothesline strung at head height: duck under it, don't jump it.
    return { x: entity.x, y: GROUND_Y - 52, w: 16, h: 16 };
  }
  return { x: entity.x, y: GROUND_Y - entity.h, w: entity.w, h: entity.h };
}

export function createWorld(seed) {
  let random = createRandom(seed);
  const state = {};

  function reset() {
    random = createRandom(seed);
    state.time = 0;
    state.distance = 0;
    state.score = 0;
    state.lives = RUN.lives;
    state.speed = RUN.startSpeed;
    state.gap = FARMER.startGap;
    state.stageIndex = 0;
    state.entities = [];
    state.toasts = [];
    state.over = false;
    state.escaped = false;
    state.spawnIn = 1.4;
    state.metresSinceHit = 0;
    state.grace = 1.2;
    state.turkey = {
      y: GROUND_Y - TURKEY.height,
      vy: 0,
      grounded: true,
      ducking: false,
      hiding: false,
      hideTimer: 0,
      invulnerable: 0,
      dashTimer: 0,
      dashCooldown: 0,
      runPhase: 0,
    };
  }

  function stageName() {
    return STAGES[state.stageIndex].name;
  }

  function toast(text) {
    state.toasts.push({ text, age: 0 });
    if (state.toasts.length > 4) state.toasts.shift();
  }

  function spawnOne() {
    const stageKey = ['farmyard', 'barn', 'kitchen'][state.stageIndex];
    const kind = weightedPick(random, SPAWN_TABLES[stageKey]);
    const x = VIEW.width + 60;
    if (kind === 'corn') {
      // A little arc of three cobs, sometimes floating high enough to jump for.
      const high = random.chance(0.4);
      const baseY = high ? GROUND_Y - 150 : GROUND_Y - 30;
      for (let i = 0; i < 3; i += 1) {
        state.entities.push({
          kind: 'corn', x: x + i * 44, y: baseY - Math.sin((i / 2) * Math.PI) * 40,
          w: 26, h: 26, bob: random.range(0, 6.28), eaten: false,
        });
      }
      return;
    }
    if (kind === 'pie' || kind === 'feather') {
      state.entities.push({
        kind, x, y: GROUND_Y - 130, w: kind === 'pie' ? 36 : 30, h: 30,
        bob: random.range(0, 6.28), eaten: false,
      });
      return;
    }
    if (kind === 'haystack') {
      state.entities.push({ kind, x, y: GROUND_Y - 66, w: 84, h: 66, used: false });
      return;
    }
    if (kind === 'knife') {
      state.entities.push({ kind, x, y: -90, w: 30, h: 120, mode: 'hang', vy: 0, stuckTimer: 0 });
      return;
    }
    const def = HAZARDS[kind];
    state.entities.push({ kind, x, y: GROUND_Y - def.h, w: def.w, h: def.h, hit: false, splashed: false });
  }

  function turkeyBox() {
    const t = state.turkey;
    const height = t.ducking ? TURKEY.duckHeight : TURKEY.height;
    // Ducking squashes the turkey down toward its feet; jumping keeps the
    // real airborne top. (A grounded box built from t.y alone stays 52 px
    // tall even while ducking, so the clothesline would still hit it.)
    const y = t.grounded ? GROUND_Y - height : t.y;
    return { x: TURKEY.x + 6, y, w: TURKEY.width - 12, h: height };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function hitTurkey() {
    const t = state.turkey;
    state.lives -= 1;
    state.gap = Math.max(FARMER.catchGap, state.gap - FARMER.hitLunge);
    state.metresSinceHit = 0;
    t.invulnerable = RUN.hitInvulnerable;
    toast(state.lives > 0 ? 'OUCH!' : 'CAUGHT!');
    if (state.lives <= 0 || state.gap <= FARMER.catchGap) {
      state.over = true;
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  /**
   * Advance the world one fixed step. `actions` is the input bitmask for
   * this step (jump/dash are edges), `duckHeld` is the held duck key, and
   * `attract` runs the title-screen demo: the turkey runs, nothing hurts it.
   */
  function step(dt, actions, duckHeld, attract) {
    const t = state.turkey;
    let events = 0;
    state.time += dt;
    if (state.over) return events;

    // Speed and distance.
    state.speed = Math.min(RUN.maxSpeed, RUN.startSpeed + state.distance * RUN.speedPerMetre);
    const dashing = t.dashTimer > 0;
    const effectiveSpeed = state.speed * (dashing ? RUN.dashMultiplier : 1);
    const metres = (effectiveSpeed * dt) / RUN.pixelsPerMetre;
    state.distance += metres;
    state.score += metres * SCORE.metre;
    state.metresSinceHit += metres;
    state.gap = Math.min(FARMER.maxGap, state.gap + metres * FARMER.recoverPerMetre);

    // Stage changes as the run crosses the farm, the barn, the kitchen.
    while (state.stageIndex < STAGES.length - 1 && state.distance >= STAGES[state.stageIndex].to) {
      state.stageIndex += 1;
      toast(`${STAGES[state.stageIndex].name}!`);
    }

    // Escape: the woods at the end of the kitchen.
    if (state.distance >= RUN.escapeMetres) {
      state.escaped = true;
      state.over = true;
      return EVENT_ESCAPED | EVENT_OVER;
    }

    // Timers.
    if (t.invulnerable > 0) t.invulnerable -= dt;
    if (t.dashCooldown > 0) t.dashCooldown -= dt;
    if (t.dashTimer > 0) t.dashTimer -= dt;
    if (t.hideTimer > 0) {
      t.hideTimer -= dt;
      if (t.hideTimer <= 0) {
        t.hiding = false;
        t.y = GROUND_Y - TURKEY.height;
        // A blink of cover on reappearing, so the turkey never pops out
        // of the hay straight into a hazard it could not see coming.
        t.invulnerable = Math.max(t.invulnerable, 0.8);
      }
    }
    if (state.grace > 0) state.grace -= dt;

    // Dash: a burst of speed and a blink of invulnerability.
    if ((actions & ACTION_DASH) !== 0 && t.dashCooldown <= 0 && !t.hiding) {
      t.dashTimer = RUN.dashSeconds;
      t.dashCooldown = RUN.dashCooldown;
      t.invulnerable = Math.max(t.invulnerable, RUN.dashInvulnerable);
    }

    // Jump and duck.
    if (!t.hiding) {
      if ((actions & ACTION_JUMP) !== 0 && t.grounded) {
        t.vy = TURKEY.jumpVelocity;
        t.grounded = false;
        t.ducking = false;
      }
      t.ducking = duckHeld && t.grounded;
    }
    if (!t.grounded) {
      t.vy += TURKEY.gravity * dt;
      t.y += t.vy * dt;
      if (t.y >= GROUND_Y - TURKEY.height) {
        t.y = GROUND_Y - TURKEY.height;
        t.vy = 0;
        t.grounded = true;
      }
    }
    t.runPhase += (effectiveSpeed / 220) * dt;

    // Hiding in a haystack: duck beside one and vanish for a while.
    if (!t.hiding && duckHeld && t.grounded) {
      const box = turkeyBox();
      for (const entity of state.entities) {
        if (entity.kind === 'haystack' && !entity.used && overlaps(box, entity)) {
          entity.used = true;
          t.hiding = true;
          t.hideTimer = RUN.hideSeconds;
          t.ducking = false;
          state.gap = Math.min(FARMER.maxGap, state.gap + FARMER.hidePushback);
          state.score += SCORE.hide;
          toast('HIDDEN! +15');
          events |= EVENT_HIDE;
          break;
        }
      }
    }

    // Spawning.
    if (!attract) {
      state.spawnIn -= dt;
      if (state.spawnIn <= 0 && state.grace <= 0) {
        spawnOne();
        state.spawnIn = random.range(1.15, 1.7);
      }
    }

    // Move everything left; knives drop when the turkey gets close.
    const box = turkeyBox();
    for (let i = state.entities.length - 1; i >= 0; i -= 1) {
      const entity = state.entities[i];
      if (entity.kind === 'knife') {
        if (entity.mode === 'hang' && TURKEY.x + 320 > entity.x) {
          entity.mode = 'fall';
          entity.vy = 0;
        } else if (entity.mode === 'fall') {
          entity.vy += 2600 * dt;
          entity.y += entity.vy * dt;
          if (entity.y >= GROUND_Y - 70) {
            entity.y = GROUND_Y - 70;
            entity.mode = 'stuck';
            entity.stuckTimer = 1.1;
          }
        } else if (entity.mode === 'stuck') {
          entity.stuckTimer -= dt;
          if (entity.stuckTimer <= 0) {
            state.entities.splice(i, 1);
            continue;
          }
        }
        entity.x -= effectiveSpeed * dt;
      } else if (entity.kind === 'rollingpin') {
        entity.x -= (effectiveSpeed + 130) * dt;
      } else {
        entity.x -= effectiveSpeed * dt;
      }
      if (entity.x + entity.w < -80) {
        state.entities.splice(i, 1);
        continue;
      }

      if (attract || t.hiding || t.invulnerable > 0) continue;

      // Pickups.
      if (entity.kind === 'corn' || entity.kind === 'pie' || entity.kind === 'feather') {
        if (!entity.eaten && overlaps(box, { x: entity.x, y: entity.y + Math.sin(state.time * 3 + entity.bob) * 4, w: entity.w, h: entity.h })) {
          entity.eaten = true;
          if (entity.kind === 'corn') {
            state.score += SCORE.corn;
            toast('+10');
          } else if (entity.kind === 'pie') {
            state.score += SCORE.pie;
            toast('PIE! +50');
          } else {
            state.score += SCORE.feather;
            t.dashCooldown = 0;
            toast('FEATHER! DASH READY');
          }
          events |= EVENT_PICKUP;
          state.entities.splice(i, 1);
        }
        continue;
      }
      if (entity.kind === 'haystack') continue;

      // Hazards.
      if (entity.kind === 'puddle') {
        if (!entity.splashed && overlaps(box, { x: entity.x, y: GROUND_Y - 14, w: entity.w, h: 14 })) {
          entity.splashed = true;
          state.gap = Math.max(FARMER.catchGap + 6, state.gap - 12);
          toast('SPLASH! SLOW!');
        }
        continue;
      }
      const hbox = hazardBox(entity);
      if (hbox && !entity.hit && overlaps(box, hbox)) {
        entity.hit = true;
        events |= hitTurkey();
        if (state.over) return events;
      }
    }

    // Toasts age out.
    for (let i = state.toasts.length - 1; i >= 0; i -= 1) {
      state.toasts[i].age += dt;
      if (state.toasts[i].age > 1.4) state.toasts.splice(i, 1);
    }
    return events;
  }

  reset();
  return { state, reset, step, stageName, turkeyBox };
}
