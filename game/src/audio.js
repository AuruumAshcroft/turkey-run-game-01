// All sound is synthesised with WebAudio: no audio files, nothing fetched.
// A short plucky autumn tune loops under the run; one-shots mark jumps,
// pickups, hits, the dash, hiding, being caught and escaping.
export function createSound() {
  let context = null;
  let master = null;
  let muted = false;
  let musicTimer = null;
  let nextNoteAt = 0;
  let noteIndex = 0;

  // A bouncy pentatonic line in C major, with a low root underneath.
  const MELODY = [
    [523, 0.16], [659, 0.16], [784, 0.16], [659, 0.16],
    [587, 0.16], [523, 0.16], [440, 0.32], [0, 0.16],
    [523, 0.16], [659, 0.16], [880, 0.16], [784, 0.16],
    [659, 0.32], [587, 0.16], [523, 0.32], [0, 0.16],
  ];
  const BASS = [131, 131, 175, 175, 196, 196, 175, 175, 131, 131, 175, 175, 196, 220, 196, 175];

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.5;
      master.connect(context.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, at, dur, type, vol, slideTo) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(vol, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  function scheduleMusic() {
    if (!context || muted) return;
    const ahead = context.currentTime + 0.25;
    while (nextNoteAt < ahead) {
      const [freq, dur] = MELODY[noteIndex % MELODY.length];
      const bass = BASS[noteIndex % BASS.length];
      if (freq > 0) tone(freq, nextNoteAt, dur * 0.9, 'triangle', 0.10);
      tone(bass, nextNoteAt, dur * 0.9, 'sine', 0.07);
      nextNoteAt += dur;
      noteIndex += 1;
    }
  }

  return {
    /** Call from the first user gesture; browsers block audio before one. */
    unlock() {
      if (ensure() && context.state === 'suspended') context.resume();
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    get muted() {
      return muted;
    },
    startMusic() {
      if (!ensure() || musicTimer) return;
      nextNoteAt = context.currentTime + 0.05;
      noteIndex = 0;
      musicTimer = window.setInterval(scheduleMusic, 90);
    },
    stopMusic() {
      if (musicTimer) {
        window.clearInterval(musicTimer);
        musicTimer = null;
      }
    },
    jump() {
      if (!ensure() || muted) return;
      tone(280, context.currentTime, 0.16, 'square', 0.08, 620);
    },
    pickup() {
      if (!ensure() || muted) return;
      const t = context.currentTime;
      tone(880, t, 0.09, 'sine', 0.12);
      tone(1318, t + 0.07, 0.12, 'sine', 0.10);
    },
    gobble() {
      if (!ensure() || muted) return;
      const t = context.currentTime;
      tone(180, t, 0.09, 'square', 0.14, 120);
      tone(180, t + 0.11, 0.09, 'square', 0.14, 110);
      tone(240, t + 0.22, 0.14, 'square', 0.14, 140);
    },
    dash() {
      if (!ensure() || muted) return;
      tone(500, context.currentTime, 0.22, 'sawtooth', 0.07, 1400);
    },
    hide() {
      if (!ensure() || muted) return;
      const t = context.currentTime;
      tone(392, t, 0.12, 'sine', 0.10);
      tone(523, t + 0.1, 0.18, 'sine', 0.10);
    },
    hit() {
      if (!ensure() || muted) return;
      const t = context.currentTime;
      tone(140, t, 0.25, 'sawtooth', 0.16, 60);
      tone(90, t + 0.05, 0.3, 'square', 0.12, 45);
    },
    caught() {
      if (!ensure() || muted) return;
      const t = context.currentTime;
      [392, 370, 349, 311].forEach((f, i) => tone(f, t + i * 0.16, 0.2, 'triangle', 0.14));
      tone(98, t + 0.7, 0.6, 'sawtooth', 0.12, 55);
    },
    escaped() {
      if (!ensure() || muted) return;
      const t = context.currentTime;
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, t + i * 0.11, 0.22, 'triangle', 0.13));
    },
  };
}
