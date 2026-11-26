// ARUNIKA — small WebAudio synth: engine hum, wind, chimes and thuds. No audio files.

/** Build the sound engine. All sounds are synthesised; nothing is fetched. */
export function createAudio() {
  let audioCtx = null;
  let muted = false;
  let engineOsc = null;
  let engineGain = null;
  let windSrc = null;
  let windGain = null;

  function ensure() {
    if (audioCtx !== null) return audioCtx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
      engineOsc = audioCtx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 55;
      engineGain = audioCtx.createGain();
      engineGain.gain.value = 0;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      engineOsc.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(audioCtx.destination);
      engineOsc.start();
      const len = audioCtx.sampleRate * 2;
      const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      windSrc = audioCtx.createBufferSource();
      windSrc.buffer = buffer;
      windSrc.loop = true;
      const windFilter = audioCtx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 500;
      windFilter.Q.value = 0.6;
      windGain = audioCtx.createGain();
      windGain.gain.value = 0;
      windSrc.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(audioCtx.destination);
      windSrc.start();
    } catch (e) {
      audioCtx = null;
    }
    return audioCtx;
  }

  function tone(freq, dur, type, vol, when) {
    if (muted || !ensure()) return;
    const t0 = audioCtx.currentTime + (when || 0);
    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    /** Resume the audio context after a user gesture (autoplay policy). */
    resume() {
      if (ensure() && audioCtx.state === 'suspended') audioCtx.resume();
    },
    /** Toggle all sound. */
    toggleMute() {
      muted = !muted;
      if (engineGain) engineGain.gain.value = 0;
      if (windGain) windGain.gain.value = 0;
    },
    /** The engine drone follows throttle; wind follows speed. */
    setEngine(throttle) {
      if (muted || !ensure()) return;
      engineOsc.frequency.value = 55 + throttle * 70;
      engineGain.gain.setTargetAtTime(0.02 + throttle * 0.05, audioCtx.currentTime, 0.1);
    },
    /** Wind noise level, 0 to 1. */
    wind(level) {
      if (muted || !ensure()) return;
      windGain.gain.setTargetAtTime(level * 0.05, audioCtx.currentTime, 0.2);
    },
    /** Two-note chime when a ring is passed. */
    chime() {
      tone(880, 0.25, 'sine', 0.16, 0);
      tone(1318, 0.4, 'sine', 0.14, 0.09);
    },
    /** Low thud for touchdowns and hard landings. */
    thud() {
      tone(90, 0.22, 'sine', 0.3, 0);
      tone(60, 0.3, 'triangle', 0.2, 0.02);
    },
    /** Noise burst for a crash. */
    crash() {
      if (muted || !ensure()) return;
      const t0 = audioCtx.currentTime;
      const len = audioCtx.sampleRate * 0.5;
      const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.35;
      src.connect(gain);
      gain.connect(audioCtx.destination);
      src.start(t0);
      tone(70, 0.5, 'sawtooth', 0.2, 0);
    },
  };
}
