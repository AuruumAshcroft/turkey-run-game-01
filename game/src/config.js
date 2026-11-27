// Gobble Dash — tuning and world constants. One place for every number the
// rest of the game reads, so balancing is editing this file, not the logic.
export const STEP = 1 / 60;
export const VIEW = { width: 960, height: 540 };
export const GROUND_Y = 452;
export const BEST_KEY = 'gobble-dash-best';

// Player turkey.
export const TURKEY = {
  x: 170,
  width: 58,
  height: 52,
  duckHeight: 34,
  jumpVelocity: -820,
  gravity: 2100,
  runCycle: 0.16,
};

// The farmer chasing from behind. `gap` is the pixel distance between the
// farmer's hands and the turkey's tail; it shrinks on every hit.
export const FARMER = {
  startGap: 115,
  maxGap: 120,
  catchGap: 52,
  hitLunge: 26,
  recoverPerMetre: 0.12,
  hidePushback: 42,
};

// Run.
export const RUN = {
  startSpeed: 250,
  speedPerMetre: 0.13,
  maxSpeed: 480,
  pixelsPerMetre: 50,
  escapeMetres: 1200,
  dashMultiplier: 1.65,
  dashSeconds: 0.6,
  dashCooldown: 2.5,
  dashInvulnerable: 0.45,
  hideSeconds: 1.6,
  hitInvulnerable: 1.3,
  lives: 3,
};

// Score values.
export const SCORE = { metre: 1, corn: 10, pie: 50, feather: 25, hide: 15 };

// Stages: the run moves from the farmyard, through the barn, into the kitchen.
export const STAGES = [
  { name: 'FARMYARD', from: 0, to: 400, skyTop: '#f7b267', skyBottom: '#f4845f', ground: '#8a5a2b', grass: '#7a9a3a' },
  { name: 'BARN', from: 400, to: 800, skyTop: '#e07a5f', skyBottom: '#b85c38', ground: '#6b4423', grass: '#5f7a2e' },
  { name: 'KITCHEN', from: 800, to: 1200, skyTop: '#d95d39', skyBottom: '#8c2f39', ground: '#7c4a2d', grass: '#4e5d23' },
];

// Hazard catalogue. `kind` decides the drawing and the collision shape;
// `h` is the height the turkey must clear, `w` the width on the ground.
export const HAZARDS = {
  fence: { w: 26, h: 74, score: 0 },
  haybale: { w: 54, h: 52, score: 0 },
  crate: { w: 56, h: 62, score: 0 },
  pitchfork: { w: 22, h: 96, score: 0 },
  oven: { w: 72, h: 88, score: 0 },
  knife: { w: 30, h: 120, score: 0 },
  rollingpin: { w: 64, h: 30, score: 0 },
  puddle: { w: 90, h: 14, score: 0 },
  line: { w: 16, h: 52, score: 0 },
};

// Autumn palette shared by every drawing routine.
export const PALETTE = {
  turkeyBody: '#8d5524',
  turkeyDark: '#6b3f1a',
  turkeyBelly: '#c98d4b',
  feather: '#5d3a17',
  featherTip: '#e07a2e',
  beak: '#f2a541',
  wattle: '#c0392b',
  farmerShirt: '#4a6fa5',
  farmerOveralls: '#33507a',
  farmerSkin: '#e8b88a',
  farmerHat: '#7a5a2e',
  corn: '#f7d125',
  pie: '#d97b29',
  heart: '#d64545',
  cream: '#f9e6ca',
  ink: '#2b1d12',
};
