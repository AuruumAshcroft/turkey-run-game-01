// Every pixel of Gobble Dash is drawn here from canvas primitives: the
// turkey, the farmer, the farmyard, the barn, the kitchen, the HUD and the
// title and end screens. No image files, nothing fetched.
import { FARMER, GROUND_Y, PALETTE, RUN, STAGES, TURKEY, VIEW } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const TITLE_FONT = '"Arial Black", "Trebuchet MS", sans-serif';
const BODY_FONT = '"Trebuchet MS", Verdana, sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, font, color, align = 'center', outline = null) {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (outline) {
    ctx.lineWidth = 5;
    ctx.strokeStyle = outline;
    ctx.lineJoin = 'round';
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  let shake = 0;

  function drawSky(state) {
    const stage = STAGES[state.stageIndex];
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, stage.skyTop);
    g.addColorStop(1, stage.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
    // Sun.
    ctx.fillStyle = '#ffe9a8';
    ellipse(ctx, 830, 70, 34, 34);
    ctx.fillStyle = 'rgba(255, 233, 168, 0.35)';
    ellipse(ctx, 830, 70, 52, 52);
    // Drifting clouds (parallax 0.15).
    const scroll = state.distance * RUN.pixelsPerMetre * 0.15;
    ctx.fillStyle = 'rgba(249, 230, 202, 0.9)';
    for (let i = 0; i < 4; i += 1) {
      const cx = (((i * 320 + 80 - scroll) % (VIEW.width + 240)) + VIEW.width + 240) % (VIEW.width + 240) - 120;
      ellipse(ctx, cx, 60 + i * 26, 46, 16);
      ellipse(ctx, cx + 30, 68 + i * 26, 34, 13);
    }
  }

  function drawScenery(state) {
    const scroll = state.distance * RUN.pixelsPerMetre;
    const stage = STAGES[state.stageIndex];
    // Rolling hills (parallax 0.35).
    ctx.fillStyle = 'rgba(122, 90, 43, 0.55)';
    for (let i = 0; i < 3; i += 1) {
      const hx = (((i * 520 - scroll * 0.35) % (VIEW.width + 520)) + VIEW.width + 520) % (VIEW.width + 520) - 260;
      ctx.beginPath();
      ctx.ellipse(hx, GROUND_Y + 4, 300, 70, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    if (state.stageIndex === 2) {
      // Kitchen: tiled wall, a window to the night, hanging pans.
      ctx.fillStyle = '#c98d5f';
      ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
      ctx.fillStyle = '#b87a4e';
      for (let y = 0; y < GROUND_Y; y += 46) ctx.fillRect(0, y, VIEW.width, 3);
      ctx.fillStyle = '#2b3a55';
      rr(ctx, 700, 60, 170, 130, 10);
      ctx.fill();
      ctx.fillStyle = '#f7d125';
      ellipse(ctx, 830, 100, 16, 16);
      ctx.fillStyle = '#3a2c1c';
      ellipse(ctx, 120, 90, 26, 26);
      ellipse(ctx, 220, 70, 22, 22);
      ctx.fillStyle = '#8c8c96';
      ctx.fillRect(112, 112, 16, 26);
      ctx.fillRect(212, 88, 14, 22);
    } else {
      // Farmyard and barn: fence posts and trees drifting past (parallax 0.6).
      const fenceScroll = scroll * 0.6;
      ctx.strokeStyle = '#6b4423';
      ctx.lineWidth = 5;
      for (let x = -((fenceScroll % 120) + 120) % 120; x < VIEW.width; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y - 46);
        ctx.lineTo(x, GROUND_Y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y - 34);
      ctx.lineTo(VIEW.width, GROUND_Y - 34);
      ctx.stroke();
      if (state.stageIndex === 1) {
        // The big red barn on the horizon.
        ctx.fillStyle = '#a63d2f';
        ctx.fillRect(560, GROUND_Y - 190, 260, 190);
        ctx.fillStyle = '#7e2d22';
        ctx.beginPath();
        ctx.moveTo(540, GROUND_Y - 190);
        ctx.lineTo(690, GROUND_Y - 260);
        ctx.lineTo(840, GROUND_Y - 190);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f9e6ca';
        ctx.fillRect(660, GROUND_Y - 120, 60, 120);
        ctx.strokeStyle = '#f9e6ca';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(660, GROUND_Y - 120);
        ctx.lineTo(720, GROUND_Y);
        ctx.moveTo(720, GROUND_Y - 120);
        ctx.lineTo(660, GROUND_Y);
        ctx.stroke();
      }
      // Autumn trees.
      for (let i = 0; i < 3; i += 1) {
        const tx = (((i * 430 + 200 - scroll * 0.6) % (VIEW.width + 300)) + VIEW.width + 300) % (VIEW.width + 300) - 150;
        ctx.fillStyle = '#5d3a17';
        ctx.fillRect(tx - 5, GROUND_Y - 110, 10, 110);
        ctx.fillStyle = i % 2 ? '#d97b29' : '#c0392b';
        ellipse(ctx, tx, GROUND_Y - 140, 52, 40);
        ellipse(ctx, tx - 30, GROUND_Y - 118, 30, 22);
        ellipse(ctx, tx + 30, GROUND_Y - 118, 30, 22);
      }
      // Falling leaves.
      ctx.fillStyle = '#e07a2e';
      for (let i = 0; i < 10; i += 1) {
        const lx = (i * 137 + state.time * 40) % VIEW.width;
        const ly = (i * 89 + state.time * 55) % (GROUND_Y - 40);
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(Math.sin(state.time * 2 + i) * 0.6);
        ctx.fillRect(-4, -2, 8, 4);
        ctx.restore();
      }
    }
    // Ground.
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
    ctx.fillStyle = stage.grass;
    ctx.fillRect(0, GROUND_Y, VIEW.width, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = -((scroll % 90) + 90) % 90; x < VIEW.width; x += 90) {
      ctx.fillRect(x, GROUND_Y + 22, 46, 5);
      ctx.fillRect(x + 30, GROUND_Y + 58, 30, 4);
    }
  }

  function drawTurkey(state, screen) {
    const t = state.turkey;
    if (t.hiding) {
      // Just two panicked eyes peeking out of the hay.
      ctx.fillStyle = '#fff';
      ellipse(ctx, TURKEY.x + 22, GROUND_Y - 58, 6, 7);
      ellipse(ctx, TURKEY.x + 36, GROUND_Y - 58, 6, 7);
      ctx.fillStyle = '#1a1a1a';
      ellipse(ctx, TURKEY.x + 23, GROUND_Y - 58, 2.5, 3.5);
      ellipse(ctx, TURKEY.x + 37, GROUND_Y - 58, 2.5, 3.5);
      return;
    }
    // Blink while invulnerable mid-run; never on the end screen, where the
    // turkey must be visible in the farmer's hands.
    if (screen === SCREEN_PLAY && t.invulnerable > 0 && Math.floor(state.time * 12) % 2 === 0) return;
    const x = TURKEY.x;
    const y = t.y + TURKEY.height;
    const ducking = t.ducking;
    const squash = ducking ? 0.62 : 1;
    const legSwing = t.grounded ? Math.sin(t.runPhase * Math.PI * 2) * 9 : 0;
    const scared = state.gap < 85;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, squash);
    // Tail feathers.
    ctx.fillStyle = PALETTE.feather;
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.translate(-22, -34);
      ctx.rotate(i * 0.42);
      ctx.beginPath();
      ctx.ellipse(0, -20, 9, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.featherTip;
      ctx.beginPath();
      ctx.ellipse(0, -38, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.feather;
      ctx.restore();
    }
    // Legs.
    ctx.strokeStyle = '#f2a541';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(6, -8);
    ctx.lineTo(2 + legSwing, 0);
    ctx.moveTo(18, -8);
    ctx.lineTo(22 - legSwing, 0);
    ctx.stroke();
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ellipse(ctx, 12, -26, 30, 24);
    ctx.fillStyle = PALETTE.turkeyBelly;
    ellipse(ctx, 20, -20, 18, 13);
    // Wing.
    ctx.fillStyle = PALETTE.turkeyDark;
    ctx.save();
    ctx.translate(8, -26);
    ctx.rotate(t.grounded ? Math.sin(t.runPhase * Math.PI * 2) * 0.35 : -0.9);
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Head.
    ctx.fillStyle = PALETTE.turkeyBody;
    ellipse(ctx, 38, -52, 13, 12);
    // Beak.
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(48, -54);
    ctx.lineTo(62, -49);
    ctx.lineTo(48, -45);
    ctx.closePath();
    ctx.fill();
    // Wattle.
    ctx.fillStyle = PALETTE.wattle;
    ellipse(ctx, 50, -42, 4, 6);
    // Eye: wide when the farmer is close.
    ctx.fillStyle = '#fff';
    ellipse(ctx, 41, -55, scared ? 5 : 4, scared ? 5.5 : 4);
    ctx.fillStyle = '#1a1a1a';
    ellipse(ctx, 42.5, -55, 2, 2.5);
    ctx.restore();
  }

  function drawFarmer(state) {
    const fx = TURKEY.x - state.gap - 46;
    if (fx < -90) return;
    const y = GROUND_Y;
    const phase = state.time * 9;
    const legSwing = Math.sin(phase) * 10;
    ctx.save();
    ctx.translate(fx, y);
    // Legs (overalls).
    ctx.strokeStyle = PALETTE.farmerOveralls;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(16, -34);
    ctx.lineTo(10 + legSwing, 0);
    ctx.moveTo(30, -34);
    ctx.lineTo(36 - legSwing, 0);
    ctx.stroke();
    // Body: shirt + overalls.
    ctx.fillStyle = PALETTE.farmerShirt;
    rr(ctx, 6, -72, 40, 42, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerOveralls;
    ctx.fillRect(10, -52, 32, 24);
    // Arms pumping.
    ctx.strokeStyle = PALETTE.farmerShirt;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(12, -64);
    ctx.lineTo(-4, -44 + legSwing * 0.5);
    ctx.moveTo(40, -64);
    ctx.lineTo(54, -44 - legSwing * 0.5);
    ctx.stroke();
    // Head + beard + straw hat.
    ctx.fillStyle = PALETTE.farmerSkin;
    ellipse(ctx, 26, -82, 14, 13);
    ctx.fillStyle = '#e8e0cc';
    ellipse(ctx, 26, -72, 12, 7);
    ctx.fillStyle = PALETTE.farmerHat;
    ellipse(ctx, 26, -92, 20, 6);
    ctx.fillRect(12, -104, 28, 12);
    // Angry eyes.
    ctx.fillStyle = '#1a1a1a';
    ellipse(ctx, 30, -84, 2, 2);
    ellipse(ctx, 38, -84, 2, 2);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, -90);
    ctx.lineTo(33, -87);
    ctx.moveTo(40, -90);
    ctx.lineTo(36, -87);
    ctx.stroke();
    ctx.restore();
    // Shout when close.
    if (state.gap < 85) {
      text(ctx, 'GET BACK HERE!', fx + 26, GROUND_Y - 128, `bold 17px ${BODY_FONT}`, '#fff', 'center', '#c0392b');
    }
  }

  function drawEntity(entity, state) {
    const x = entity.x;
    if (entity.kind === 'corn') {
      const bobY = entity.y + Math.sin(state.time * 3 + entity.bob) * 4;
      ctx.fillStyle = '#3f7a2e';
      ctx.beginPath();
      ctx.moveTo(x + 4, bobY + 20);
      ctx.lineTo(x - 4, bobY + 30);
      ctx.lineTo(x + 12, bobY + 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.corn;
      ellipse(ctx, x + 13, bobY + 10, 9, 13);
      ctx.fillStyle = '#d9a400';
      for (let i = -1; i <= 1; i += 1) ctx.fillRect(x + 8 + i * 5, bobY - 1, 2, 22);
      return;
    }
    if (entity.kind === 'pie') {
      const bobY = entity.y + Math.sin(state.time * 3 + entity.bob) * 4;
      ctx.fillStyle = '#8a5a2b';
      ellipse(ctx, x + 18, bobY + 22, 20, 8);
      ctx.fillStyle = PALETTE.pie;
      ellipse(ctx, x + 18, bobY + 16, 19, 9);
      ctx.strokeStyle = '#a34d12';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 4, bobY + 10);
      ctx.lineTo(x + 32, bobY + 22);
      ctx.moveTo(x + 32, bobY + 10);
      ctx.lineTo(x + 4, bobY + 22);
      ctx.stroke();
      return;
    }
    if (entity.kind === 'feather') {
      const bobY = entity.y + Math.sin(state.time * 3 + entity.bob) * 4;
      ctx.save();
      ctx.translate(x + 15, bobY + 15);
      ctx.rotate(-0.6);
      ctx.fillStyle = '#f7d125';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d9a400';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (entity.kind === 'haystack') {
      ctx.fillStyle = entity.used ? '#a8873a' : '#e0aa3e';
      ctx.beginPath();
      ctx.ellipse(x + 42, GROUND_Y - 30, 46, 34, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b98a2e';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + 42 + i * 14, GROUND_Y - 58);
        ctx.quadraticCurveTo(x + 42 + i * 18, GROUND_Y - 34, x + 42 + i * 12, GROUND_Y - 8);
        ctx.stroke();
      }
      if (!entity.used) text(ctx, 'HIDE!', x + 42, GROUND_Y - 78, `bold 13px ${BODY_FONT}`, '#fff', 'center', '#7a5a2e');
      return;
    }
    if (entity.kind === 'fence') {
      ctx.fillStyle = '#7a5a2e';
      ctx.fillRect(x, GROUND_Y - 74, 7, 74);
      ctx.fillRect(x + 19, GROUND_Y - 74, 7, 74);
      ctx.fillRect(x - 6, GROUND_Y - 66, 38, 7);
      ctx.fillRect(x - 6, GROUND_Y - 40, 38, 7);
      return;
    }
    if (entity.kind === 'haybale') {
      ctx.fillStyle = '#e0aa3e';
      ellipse(ctx, x + 27, GROUND_Y - 26, 28, 26);
      ctx.strokeStyle = '#b98a2e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 27, GROUND_Y - 26, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 27, GROUND_Y - 26, 7, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    if (entity.kind === 'crate') {
      ctx.fillStyle = '#9c6b30';
      ctx.fillRect(x, GROUND_Y - 62, 56, 62);
      ctx.strokeStyle = '#6b4423';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, GROUND_Y - 60, 52, 58);
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y - 62);
      ctx.lineTo(x + 56, GROUND_Y);
      ctx.moveTo(x + 56, GROUND_Y - 62);
      ctx.lineTo(x, GROUND_Y);
      ctx.stroke();
      return;
    }
    if (entity.kind === 'pitchfork') {
      ctx.strokeStyle = '#8a6d3b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + 11, GROUND_Y);
      ctx.lineTo(x + 11, GROUND_Y - 96);
      ctx.stroke();
      ctx.strokeStyle = '#c0c0c8';
      ctx.lineWidth = 3;
      for (const dx of [-8, 0, 8]) {
        ctx.beginPath();
        ctx.moveTo(x + 11 + dx, GROUND_Y - 96);
        ctx.lineTo(x + 11 + dx, GROUND_Y - 76);
        ctx.stroke();
      }
      return;
    }
    if (entity.kind === 'oven') {
      ctx.fillStyle = '#5a5a66';
      rr(ctx, x, GROUND_Y - 88, 72, 88, 8);
      ctx.fill();
      ctx.fillStyle = '#2e2e36';
      rr(ctx, x + 8, GROUND_Y - 72, 56, 44, 6);
      ctx.fill();
      // Fire in the window.
      const flick = Math.sin(state.time * 14 + x) * 4;
      ctx.fillStyle = '#ff7b24';
      ctx.beginPath();
      ctx.moveTo(x + 17, GROUND_Y - 32);
      ctx.quadraticCurveTo(x + 24, GROUND_Y - 50 - flick, x + 32, GROUND_Y - 32);
      ctx.quadraticCurveTo(x + 40, GROUND_Y - 54 - flick, x + 48, GROUND_Y - 32);
      ctx.quadraticCurveTo(x + 55, GROUND_Y - 46, x + 60, GROUND_Y - 32);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f7d125';
      ellipse(ctx, x + 36, GROUND_Y - 34, 9, 5);
      // Burners on top.
      ctx.fillStyle = '#1c1c22';
      ellipse(ctx, x + 18, GROUND_Y - 88, 9, 4);
      ellipse(ctx, x + 54, GROUND_Y - 88, 9, 4);
      text(ctx, 'HOT!', x + 36, GROUND_Y - 104, `bold 14px ${BODY_FONT}`, '#ff7b24', 'center', '#2b1d12');
      return;
    }
    if (entity.kind === 'knife') {
      ctx.save();
      ctx.translate(x + 15, entity.y + 35);
      ctx.rotate(entity.mode === 'fall' ? 0.12 : 0);
      // Blade.
      ctx.fillStyle = '#d7dbe2';
      ctx.beginPath();
      ctx.moveTo(-4, -34);
      ctx.lineTo(10, -34);
      ctx.lineTo(14, 10);
      ctx.lineTo(3, 34);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9aa0ab';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Handle.
      ctx.fillStyle = '#2b1d12';
      rr(ctx, -6, -52, 16, 20, 4);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (entity.kind === 'rollingpin') {
      ctx.save();
      ctx.translate(x + 32, GROUND_Y - 15);
      ctx.rotate(-state.time * 6);
      ctx.fillStyle = '#c98d5f';
      rr(ctx, -32, -10, 64, 20, 10);
      ctx.fill();
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(-40, -6, 8, 12);
      ctx.fillRect(32, -6, 8, 12);
      ctx.restore();
      return;
    }
    if (entity.kind === 'puddle') {
      ctx.fillStyle = '#7a9cc6';
      ellipse(ctx, x + 45, GROUND_Y - 4, 46, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ellipse(ctx, x + 32, GROUND_Y - 6, 16, 3);
      return;
    }
    if (entity.kind === 'line') {
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(x - 2, GROUND_Y - 60, 5, 60);
      ctx.fillRect(x + 14, GROUND_Y - 60, 5, 60);
      ctx.strokeStyle = '#3a2c1c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 2, GROUND_Y - 56);
      ctx.quadraticCurveTo(x + 8, GROUND_Y - 44, x + 18, GROUND_Y - 56);
      ctx.stroke();
      ctx.fillStyle = '#f9e6ca';
      ctx.fillRect(x + 2, GROUND_Y - 48, 12, 14);
      return;
    }
  }

  function drawHud(state, best) {
    // Top bar.
    ctx.fillStyle = 'rgba(43, 29, 18, 0.72)';
    rr(ctx, 10, 10, VIEW.width - 20, 54, 10);
    ctx.fill();
    // Hearts.
    for (let i = 0; i < RUN.lives; i += 1) {
      const hx = 34 + i * 30;
      ctx.fillStyle = i < state.lives ? PALETTE.heart : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, 48);
      ctx.bezierCurveTo(hx - 12, 34, hx - 4, 26, hx, 32);
      ctx.bezierCurveTo(hx + 4, 26, hx + 12, 34, hx, 48);
      ctx.fill();
    }
    text(ctx, `SCORE ${Math.floor(state.score)}`, 150, 32, `bold 20px ${BODY_FONT}`, PALETTE.cream, 'left');
    text(ctx, `${Math.floor(state.distance)} m`, 330, 32, `bold 20px ${BODY_FONT}`, PALETTE.cream, 'left');
    text(ctx, STAGES[state.stageIndex].name, 480, 32, `bold 20px ${BODY_FONT}`, '#f7d125', 'left');
    text(ctx, `BEST ${Math.floor(best)}`, 660, 32, `bold 16px ${BODY_FONT}`, PALETTE.cream, 'left');
    // Farmer danger meter.
    const danger = 1 - (state.gap - FARMER.catchGap) / (FARMER.maxGap - FARMER.catchGap);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    rr(ctx, 780, 24, 150, 12, 6);
    ctx.fill();
    ctx.fillStyle = danger > 0.66 ? '#d64545' : danger > 0.33 ? '#f2a541' : '#7a9a3a';
    rr(ctx, 780, 24, 150 * danger, 12, 6);
    ctx.fill();
    text(ctx, 'FARMER', 855, 50, `bold 12px ${BODY_FONT}`, PALETTE.cream, 'center');
    // Dash readiness.
    const ready = state.turkey.dashCooldown <= 0;
    ctx.fillStyle = ready ? '#f7d125' : 'rgba(255,255,255,0.25)';
    rr(ctx, 780, 56, 150 * (ready ? 1 : 1 - state.turkey.dashCooldown / RUN.dashCooldown), 5, 2);
    ctx.fill();
    // Distance progress along the bottom.
    const progress = Math.min(1, state.distance / RUN.escapeMetres);
    ctx.fillStyle = 'rgba(43, 29, 18, 0.55)';
    rr(ctx, 240, VIEW.height - 26, VIEW.width - 480, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#f7d125';
    rr(ctx, 240, VIEW.height - 26, (VIEW.width - 480) * progress, 10, 5);
    ctx.fill();
    text(ctx, 'WOODS', VIEW.width - 220, VIEW.height - 21, `bold 12px ${BODY_FONT}`, PALETTE.cream, 'left');
    text(ctx, 'FARM', 240, VIEW.height - 21, `bold 12px ${BODY_FONT}`, PALETTE.cream, 'right');
    // Toasts.
    state.toasts.forEach((toast, i) => {
      const alpha = 1 - toast.age / 1.4;
      ctx.globalAlpha = Math.max(0, alpha);
      text(ctx, toast.text, TURKEY.x + 30, TURKEY.y - 66 - i * 24, `bold 20px ${BODY_FONT}`, '#fff', 'center', '#c0392b');
      ctx.globalAlpha = 1;
    });
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(43, 29, 18, 0.45)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, 'GOBBLE DASH', VIEW.width / 2, 108, `64px ${TITLE_FONT}`, '#f7d125', 'center', '#7a2e0e');
    text(ctx, "A TURKEY'S GREAT THANKSGIVING ESCAPE", VIEW.width / 2, 158, `bold 21px ${BODY_FONT}`, PALETTE.cream, 'center', '#2b1d12');
    text(ctx, 'The farmer wants you for dinner. Run 1200 m to the woods!', VIEW.width / 2, 196, `17px ${BODY_FONT}`, PALETTE.cream, 'center');
    // A dark panel keeps the instructions readable whatever drifts behind.
    ctx.fillStyle = 'rgba(43, 29, 18, 0.6)';
    rr(ctx, VIEW.width / 2 - 330, 282, 660, 96, 12);
    ctx.fill();
    text(ctx, 'SPACE / CLICK — jump      DOWN — duck & hide in hay', VIEW.width / 2, 300, `bold 18px ${BODY_FONT}`, '#fff', 'center');
    text(ctx, 'SHIFT — dash      P — pause      M — mute', VIEW.width / 2, 330, `bold 18px ${BODY_FONT}`, '#fff', 'center');
    text(ctx, 'Jump fences, ovens and knives. Duck the clothesline. Grab corn!', VIEW.width / 2, 360, `17px ${BODY_FONT}`, PALETTE.cream, 'center');
    if (best > 0) text(ctx, `BEST SCORE ${Math.floor(best)}`, VIEW.width / 2, 404, `bold 18px ${BODY_FONT}`, '#f7d125', 'center');
    const pulse = 0.7 + Math.sin(state.time * 4) * 0.3;
    ctx.globalAlpha = pulse;
    text(ctx, 'PRESS SPACE OR CLICK TO RUN', VIEW.width / 2, 452, `bold 24px ${BODY_FONT}`, '#fff', 'center', '#c0392b');
    ctx.globalAlpha = 1;
  }

  function drawOver(state, best, escaped) {
    if (escaped) {
      // The woods, at last: a deep green night forest behind the text,
      // not the kitchen the turkey just ran out of.
      const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
      g.addColorStop(0, '#224d28');
      g.addColorStop(1, '#122e18');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      ctx.fillStyle = '#0f2f14';
      for (const [tx, th] of [[60, 260], [180, 320], [820, 300], [920, 240]]) {
        ctx.beginPath();
        ctx.moveTo(tx - 55, GROUND_Y + 40);
        ctx.lineTo(tx, GROUND_Y + 40 - th);
        ctx.lineTo(tx + 55, GROUND_Y + 40);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(tx - 6, GROUND_Y + 40, 12, 30);
      }
      ctx.fillStyle = '#f7d125';
      for (const [fx, fy] of [[300, 120], [420, 80], [640, 140], [720, 90]]) {
        ellipse(ctx, fx, fy, 3, 3);
      }
      // The turkey, free in the woods at last (the farmer didn't follow).
      drawTurkey(state, SCREEN_OVER);
    } else {
      ctx.fillStyle = 'rgba(90, 20, 16, 0.6)';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }
    if (escaped) {
      text(ctx, 'ESCAPED!', VIEW.width / 2, 130, `64px ${TITLE_FONT}`, '#f7d125', 'center', '#2b4d1e');
      text(ctx, 'You made it to the woods. Happy Thanksgiving, free bird!', VIEW.width / 2, 185, `bold 20px ${BODY_FONT}`, PALETTE.cream, 'center', '#2b1d12');
    } else {
      text(ctx, 'CAUGHT!', VIEW.width / 2, 130, `64px ${TITLE_FONT}`, '#ff6b5e', 'center', '#4d0e08');
      text(ctx, 'The farmer got you. Dinner is served… (ugh.)', VIEW.width / 2, 185, `bold 20px ${BODY_FONT}`, PALETTE.cream, 'center', '#2b1d12');
    }
    text(ctx, `SCORE ${Math.floor(state.score)}`, VIEW.width / 2, 250, `bold 26px ${BODY_FONT}`, '#fff', 'center');
    text(ctx, `DISTANCE ${Math.floor(state.distance)} m`, VIEW.width / 2, 288, `bold 22px ${BODY_FONT}`, PALETTE.cream, 'center');
    text(ctx, `BEST ${Math.floor(Math.max(best, state.score))}`, VIEW.width / 2, 322, `bold 20px ${BODY_FONT}`, '#f7d125', 'center');
    const pulse = 0.7 + Math.sin(state.time * 4) * 0.3;
    ctx.globalAlpha = pulse;
    text(ctx, 'PRESS R OR CLICK TO RUN AGAIN', VIEW.width / 2, 400, `bold 22px ${BODY_FONT}`, '#fff', 'center', '#2b1d12');
    ctx.globalAlpha = 1;
  }

  function draw(state, screen, best, escaped) {
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      shake *= 0.85;
      if (shake < 0.5) shake = 0;
    }
    drawSky(state);
    drawScenery(state);
    for (const entity of state.entities) drawEntity(entity, state);
    drawFarmer(state);
    drawTurkey(state, screen);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(state, best);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(43, 29, 18, 0.55)';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      text(ctx, 'PAUSED', VIEW.width / 2, 240, `56px ${TITLE_FONT}`, PALETTE.cream, 'center', '#2b1d12');
      text(ctx, 'Press P to keep running', VIEW.width / 2, 300, `bold 20px ${BODY_FONT}`, PALETTE.cream, 'center');
    }
    if (screen === SCREEN_OVER) drawOver(state, best, escaped);
    ctx.restore();
  }

  return {
    draw,
    hitShake() {
      shake = 10;
    },
  };
}
