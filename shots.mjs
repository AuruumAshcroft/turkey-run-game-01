// Take Gobble Dash's screenshots with headless Chrome and convert them to
// JPEGs under the gate's 256 KiB cap. Usage: node shots.mjs
// Serves game/ itself on port 8080, then stops the server when done.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const CHROME = `${process.env.HOME}/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome`;
const SHOTS = [
  { name: '1-title.jpg', query: '?shot=start&seed=7' },
  { name: '2-play.jpg', query: '?shot=play&seed=7' },
  { name: '3-caught.jpg', query: '?shot=end&seed=7' },
  { name: '4-escape.jpg', query: '?shot=escape&seed=7' },
];

const server = spawn(process.execPath, [join(here, 'serve.ts'), '--port', '8080'], {
  cwd: here,
  stdio: 'ignore',
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch('http://127.0.0.1:8080/index.html');
      if (res.ok) return;
    } catch {
      // Not up yet.
    }
    await sleep(250);
  }
  throw new Error('server did not come up');
}

function toJpeg(pngPath, jpgPath) {
  // Convert with PIL, dropping quality until the gate's cap is met.
  for (const quality of [85, 75, 65, 55]) {
    execFileSync('python3', ['-c',
      'import sys; from PIL import Image; '
      + 'Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "JPEG", quality=int(sys.argv[3]))',
      pngPath, jpgPath, String(quality)], { stdio: 'ignore' });
    if (statSync(jpgPath).size <= 262144) return quality;
  }
  return 55;
}

try {
  await waitForServer();
  mkdirSync(join(here, 'screenshots'), { recursive: true });
  for (const shot of SHOTS) {
    const png = join(here, 'screenshots', `.${shot.name}.png`);
    const jpg = join(here, 'screenshots', shot.name);
    execFileSync(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--window-size=1280,720', '--virtual-time-budget=9000',
      `--screenshot=${png}`,
      `http://127.0.0.1:8080/${shot.query}`,
    ], { stdio: 'ignore', timeout: 60000 });
    const quality = toJpeg(png, jpg);
    unlinkSync(png);
    const bytes = statSync(jpg).size;
    console.log(`${shot.name}: ${bytes} bytes (quality ${quality})`);
  }
} finally {
  server.kill();
}
console.log('done');
