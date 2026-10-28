const AUDIO_ROOT = 'assets/inazuma/audio/';
const TRACKS = Object.freeze({
  menu: 'title.mp3',
  run: 'm01.mp3',
  result: 'bg_end.mp3',
  fever: 'op00.mp3',
});

export function createAudioManager() {
  let music = null;
  let muted = false;
  let volume = 0.35;
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTrack(track) {
    if (muted || !TRACKS[track]) return;
    if (music && music.dataset.track === track && !music.paused) return;
    if (music) {
      music.pause();
      music.currentTime = 0;
    }
    music = new Audio(`${AUDIO_ROOT}${TRACKS[track]}`);
    music.dataset.track = track;
    music.loop = true;
    music.volume = volume;
    music.play().catch(() => {});
  }

  function playEffect(file) {
    if (muted) return;
    const effect = new Audio(`${AUDIO_ROOT}${file}`);
    effect.volume = Math.min(1, volume * 1.3);
    effect.play().catch(() => {});
  }

  /**
   * Generador de efectos de sonido sintéticos Web Audio
   * Garantiza sonido instantáneo y sin retraso para UI, gacha y disparos.
   */
  function playSyntheticSfx(type) {
    if (muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'foilTear') {
        // Sonido de rasgado de sobre (ruido blanco filtrado con barrido)
        const bufferSize = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3200, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        filter.Q.value = 3;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5 * volume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'cardFlip') {
        // Whoosh rápido de carta girando
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(860, now + 0.08);
        gain.gain.setValueAtTime(0.35 * volume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'cardLegendary') {
        // Acorde triunfal arpegiado (Do - Mi - Sol - Do agudo)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.4 * volume, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.45);
        });
      } else if (type === 'kick') {
        // Chut con balón / golpe seco
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
        gain.gain.setValueAtTime(0.6 * volume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'levelUp') {
        // Fanfarria de subida de nivel
        [440, 554, 659, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3 * volume, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.3);
        });
      }
    } catch (_) {}
  }

  return {
    playTrack,
    playEffect,
    playSyntheticSfx,
    toggleMute() {
      muted = !muted;
      if (music) music.muted = muted;
      return muted;
    },
    setVolume(val) {
      volume = Math.max(0, Math.min(1, val));
      if (music) music.volume = volume;
    },
    get muted() { return muted; },
    get volume() { return volume; },
  };
}
