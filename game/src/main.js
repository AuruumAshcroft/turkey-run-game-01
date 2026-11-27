// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between four screens: title, play, paused and game over.
//
// ?seed=N fixes the run's random pattern. ?shot=start|play|end|escape (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_ESCAPED, EVENT_HIDE, EVENT_HIT, EVENT_OVER, EVENT_PICKUP } from './world.js';
import { ACTION_CONFIRM, ACTION_JUMP, ACTION_DASH, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createSound } from './audio.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(seed);
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best ?? 0, scene.escaped);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let escaped = false;
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    escaped = false;
    accumulator = 0;
    screen = SCREEN_PLAY;
    sound.unlock();
    sound.startMusic();
    announce('Playing. Three lives. Run 1200 metres to the woods.');
  }

  function endGame(wasEscape) {
    escaped = wasEscape;
    screen = SCREEN_OVER;
    sound.stopMusic();
    if (world.state.score > best) {
      best = Math.floor(world.state.score);
      saveBest(best);
    }
    if (wasEscape) {
      sound.escaped();
      announce(`Escaped! Score ${Math.floor(world.state.score)}. Best ${best}.`);
    } else {
      sound.caught();
      announce(`Caught. Score ${Math.floor(world.state.score)}. Best ${best}.`);
    }
  }

  /** Menu keys; returns the gameplay action bits the world should see. */
  function handleMenu(actions) {
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      if (actions & (ACTION_CONFIRM | ACTION_RESTART)) {
        startGame();
        return 0;
      }
      return 0;
    }
    if (screen === SCREEN_PLAY && (actions & ACTION_PAUSE)) {
      screen = SCREEN_PAUSED;
      sound.stopMusic();
      announce('Paused.');
      return 0;
    }
    if (screen === SCREEN_PAUSED && (actions & (ACTION_PAUSE | ACTION_CONFIRM))) {
      screen = SCREEN_PLAY;
      sound.startMusic();
      announce('Playing.');
      return 0;
    }
    return actions & (ACTION_JUMP | ACTION_DASH);
  }

  function stepGame(actions, duckHeld) {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, 0, false, true);
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const events = world.step(STEP, actions, duckHeld, false);
    if (events & EVENT_HIT) {
      sound.hit();
      renderer.hitShake();
    }
    if (events & EVENT_PICKUP) sound.pickup();
    if (events & EVENT_HIDE) {
      sound.hide();
      sound.gobble();
    }
    if (events & EVENT_OVER) endGame((events & EVENT_ESCAPED) !== 0);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    const duckHeld = input.ducking();
    const playActions = handleMenu(actions);
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        stepGame(playActions, duckHeld);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, escaped);
  }

  // Leaving the tab pauses a running game rather than letting the farmer in.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      sound.stopMusic();
      announce('Paused.');
    }
  });

  announce('Gobble Dash. Press Space or click to run from the farmer.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
