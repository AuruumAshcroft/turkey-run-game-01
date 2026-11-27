// Keyboard and mouse input, reduced to one direction and a handful of
// edge-triggered actions. Holding a key repeats nothing: each press is one
// action, taken once by the loop.
export const ACTION_JUMP = 1;
export const ACTION_DUCK = 2;
export const ACTION_DASH = 4;
export const ACTION_CONFIRM = 8;
export const ACTION_PAUSE = 16;
export const ACTION_MUTE = 32;
export const ACTION_RESTART = 64;

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);
const DASH_KEYS = new Set(['ShiftLeft', 'ShiftRight', 'KeyX']);
const CONFIRM_KEYS = new Set(['Enter', 'Space']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);

export function createInput(canvas) {
  const held = new Set();
  let queued = 0;
  let duckHeld = false;

  function press(code) {
    if (JUMP_KEYS.has(code)) queued |= ACTION_JUMP;
    if (DUCK_KEYS.has(code)) queued |= ACTION_DUCK;
    if (DASH_KEYS.has(code)) queued |= ACTION_DASH;
    if (CONFIRM_KEYS.has(code)) queued |= ACTION_CONFIRM;
    if (PAUSE_KEYS.has(code)) queued |= ACTION_PAUSE;
    if (code === 'KeyM') queued |= ACTION_MUTE;
    if (code === 'KeyR') queued |= ACTION_RESTART;
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    held.add(event.code);
    press(event.code);
    if (JUMP_KEYS.has(event.code) || DUCK_KEYS.has(event.code)) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  window.addEventListener('blur', () => held.clear());

  // A click (or tap) confirms on menus and jumps mid-run.
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    queued |= ACTION_CONFIRM | ACTION_JUMP;
  });

  return {
    /** -1, 0 or 1 from the left/right keys; the runner mostly needs 0. */
    direction() {
      const left = held.has('ArrowLeft') || held.has('KeyA');
      const right = held.has('ArrowRight') || held.has('KeyD');
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    ducking() {
      return duckHeld;
    },
    takeActions() {
      const actions = queued;
      queued = 0;
      duckHeld = [...DUCK_KEYS].some((code) => held.has(code));
      return actions;
    },
  };
}
