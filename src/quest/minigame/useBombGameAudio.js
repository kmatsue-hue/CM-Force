import { useEffect, useRef } from 'react';

const midiToFrequency = midi => 440 * (2 ** ((midi - 69) / 12));

const BGM_PROFILES = [
  {
    tempo: 108,
    roots: [48, 55, 53, 50],
    chords: [[60, 64, 67, 72], [62, 67, 71, 74], [60, 65, 69, 72], [57, 62, 65, 69]],
    melody: new Map([
      [0, 76], [4, 79], [7, 81], [12, 79],
      [16, 74], [20, 76], [24, 81], [29, 79],
      [32, 77], [36, 81], [40, 84], [45, 81],
      [48, 76], [52, 79], [56, 77], [60, 74],
    ]),
    bassWave: 'sine',
    leadWave: 'triangle',
    kickBeats: [0, 8],
    snareBeats: [4, 12],
    chordBeats: [2, 6, 10, 14],
    bassBeats: [0, 6, 8, 14],
    noiseLevel: 0.018,
  },
  {
    tempo: 132,
    roots: [45, 50, 52, 47],
    chords: [[57, 61, 64, 69], [62, 66, 69, 74], [64, 68, 71, 76], [59, 62, 66, 71]],
    melody: new Map([
      [0, 76], [3, 78], [6, 81], [9, 83], [12, 81], [14, 78],
      [16, 74], [19, 78], [22, 81], [26, 86], [30, 83],
      [32, 80], [35, 83], [38, 88], [42, 85], [46, 83],
      [48, 78], [51, 81], [54, 83], [58, 81], [61, 78],
    ]),
    bassWave: 'triangle',
    leadWave: 'square',
    kickBeats: [0, 6, 8, 14],
    snareBeats: [4, 12],
    chordBeats: [2, 5, 10, 13],
    bassBeats: [0, 3, 8, 11],
    noiseLevel: 0.032,
  },
  {
    tempo: 148,
    roots: [41, 41, 44, 39],
    chords: [[53, 56, 60, 65], [53, 56, 60, 65], [56, 60, 63, 68], [51, 55, 58, 63]],
    melody: new Map([
      [0, 72], [2, 75], [5, 77], [8, 72], [11, 80], [14, 77],
      [16, 68], [18, 72], [21, 75], [24, 77], [28, 75], [30, 72],
      [32, 75], [34, 80], [37, 82], [40, 80], [44, 77], [46, 75],
      [48, 72], [50, 75], [53, 77], [56, 68], [59, 72], [62, 65],
    ]),
    bassWave: 'sawtooth',
    leadWave: 'square',
    kickBeats: [0, 4, 8, 10, 12],
    snareBeats: [4, 12, 15],
    chordBeats: [2, 6, 10, 14],
    bassBeats: [0, 2, 6, 8, 11, 14],
    noiseLevel: 0.05,
  },
];

export default function useBombGameAudio() {
  const audioRef = useRef({
    ctx: null,
    master: null,
    bgmBus: null,
    sfxBus: null,
    noise: null,
    scheduler: null,
    nextStepAt: 0,
    step: 0,
    stageIndex: 0,
    fuses: new Map(),
  });
  const lastMoveAtRef = useRef(0);

  const createNoiseBuffer = (ctx) => {
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const playTone = (ctx, destination, {
    frequency,
    time = ctx.currentTime,
    duration = 0.12,
    level = 0.08,
    wave = 'square',
    endFrequency = null,
    attack = 0.004,
  }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(frequency, time);
    if (endFrequency) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), time + duration);
    }
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + duration + 0.03);
  };

  const playNoise = (ctx, destination, {
    time = ctx.currentTime,
    duration = 0.15,
    level = 0.1,
    lowpass = 4200,
    highpass = 80,
  } = {}) => {
    const state = audioRef.current;
    const source = ctx.createBufferSource();
    const high = ctx.createBiquadFilter();
    const low = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = state.noise;
    high.type = 'highpass';
    high.frequency.setValueAtTime(highpass, time);
    low.type = 'lowpass';
    low.frequency.setValueAtTime(lowpass, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(high);
    high.connect(low);
    low.connect(gain);
    gain.connect(destination);
    source.start(time);
    source.stop(time + duration + 0.03);
  };

  const scheduleBgmStep = (step, time) => {
    const { ctx, bgmBus, stageIndex = 0 } = audioRef.current;
    if (!ctx || !bgmBus) return;
    const profile = BGM_PROFILES[stageIndex] || BGM_PROFILES[0];
    const sequenceStep = step % 64;
    const beat = sequenceStep % 16;
    const bar = Math.floor(sequenceStep / 16);

    if (profile.kickBeats.includes(beat)) {
      playTone(ctx, bgmBus, {
        frequency: stageIndex === 2 ? 146 : 124,
        endFrequency: stageIndex === 2 ? 35 : 43,
        time,
        duration: stageIndex === 2 ? 0.15 : 0.12,
        level: beat === 0 ? 0.13 : 0.08,
        wave: 'sine',
      });
    }
    if (profile.snareBeats.includes(beat)) {
      playNoise(ctx, bgmBus, {
        time,
        duration: stageIndex === 2 ? 0.1 : 0.065,
        level: profile.noiseLevel,
        highpass: stageIndex === 2 ? 650 : 1200,
        lowpass: stageIndex === 2 ? 4200 : 6500,
      });
    } else if (stageIndex > 0 && beat % 2 === 0) {
      playNoise(ctx, bgmBus, {
        time,
        duration: 0.018,
        level: stageIndex === 2 ? 0.015 : 0.008,
        highpass: 2800,
        lowpass: 7200,
      });
    }

    if (profile.bassBeats.includes(beat)) {
      const bassMidi = profile.roots[bar] + (beat >= 8 && stageIndex !== 2 ? 7 : 0);
      playTone(ctx, bgmBus, {
        frequency: midiToFrequency(bassMidi),
        time,
        duration: stageIndex === 0 ? 0.28 : 0.17,
        level: stageIndex === 2 ? 0.065 : 0.072,
        wave: profile.bassWave,
      });
    }

    if (profile.chordBeats.includes(beat)) {
      const chord = profile.chords[bar];
      const note = chord[(Math.floor(beat / 2) + bar) % chord.length] + (stageIndex === 0 ? 12 : 0);
      playTone(ctx, bgmBus, {
        frequency: midiToFrequency(note),
        time,
        duration: stageIndex === 0 ? 0.3 : 0.1,
        level: stageIndex === 0 ? 0.025 : 0.032,
        wave: stageIndex === 0 ? 'sine' : 'square',
      });
    }

    const melodyMidi = profile.melody.get(sequenceStep);
    if (melodyMidi) {
      playTone(ctx, bgmBus, {
        frequency: midiToFrequency(melodyMidi),
        time,
        duration: stageIndex === 0 ? 0.28 : 0.17,
        level: stageIndex === 0 ? 0.052 : 0.06,
        wave: profile.leadWave,
      });
      playTone(ctx, bgmBus, {
        frequency: midiToFrequency(melodyMidi - 12),
        time: time + 0.008,
        duration: stageIndex === 0 ? 0.24 : 0.14,
        level: 0.024,
        wave: stageIndex === 2 ? 'sawtooth' : 'triangle',
      });
    }
  };

  const start = async (stageIndex = 0) => {
    const normalizedStage = Math.max(0, Math.min(BGM_PROFILES.length - 1, Number(stageIndex) || 0));
    const existing = audioRef.current;
    if (existing.ctx && existing.ctx.state !== 'closed') {
      if (existing.ctx.state === 'suspended') await existing.ctx.resume();
      existing.stageIndex = normalizedStage;
      existing.step = 0;
      existing.nextStepAt = existing.ctx.currentTime + 0.05;
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const master = ctx.createGain();
    const bgmBus = ctx.createGain();
    const sfxBus = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    master.gain.value = 0.7;
    bgmBus.gain.value = 0.28;
    sfxBus.gain.value = 0.78;
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.2;
    bgmBus.connect(master);
    sfxBus.connect(master);
    master.connect(compressor);
    compressor.connect(ctx.destination);

    audioRef.current = {
      ctx,
      master,
      bgmBus,
      sfxBus,
      noise: createNoiseBuffer(ctx),
      scheduler: null,
      nextStepAt: ctx.currentTime + 0.03,
      step: 0,
      stageIndex: normalizedStage,
      fuses: new Map(),
    };
    await ctx.resume();

    const scheduler = window.setInterval(() => {
      const state = audioRef.current;
      if (!state.ctx || state.ctx.state === 'closed') return;
      const profile = BGM_PROFILES[state.stageIndex] || BGM_PROFILES[0];
      const stepDuration = 60 / profile.tempo / 4;
      while (state.nextStepAt < state.ctx.currentTime + 0.35) {
        scheduleBgmStep(state.step, state.nextStepAt);
        state.nextStepAt += stepDuration;
        state.step += 1;
      }
    }, 55);
    audioRef.current.scheduler = scheduler;
  };

  const stopFuse = (bombId) => {
    const state = audioRef.current;
    const fuse = state.fuses?.get(bombId);
    if (!fuse || !state.ctx || state.ctx.state === 'closed') return;
    const now = state.ctx.currentTime;
    try {
      fuse.gain.gain.cancelScheduledValues(now);
      fuse.gain.gain.setTargetAtTime(0.0001, now, 0.008);
      fuse.source.stop(now + 0.06);
    } catch {
      // Audio node may already have ended after a chained explosion.
    }
    state.fuses.delete(bombId);
  };

  const stopAllFuses = () => {
    const fuseIds = [...(audioRef.current.fuses?.keys() || [])];
    fuseIds.forEach(stopFuse);
  };

  const startFuse = (bombId, durationMs = 1650) => {
    const state = audioRef.current;
    const { ctx, sfxBus, noise } = state;
    if (!ctx || !sfxBus || !noise || ctx.state === 'closed') return;
    stopFuse(bombId);

    const now = ctx.currentTime;
    const duration = Math.max(0.2, durationMs / 1000);
    const source = ctx.createBufferSource();
    const high = ctx.createBiquadFilter();
    const low = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = noise;
    source.loop = true;
    high.type = 'highpass';
    high.frequency.setValueAtTime(1450, now);
    low.type = 'lowpass';
    low.frequency.setValueAtTime(3600, now);
    low.frequency.exponentialRampToValueAtTime(7200, now + duration);
    gain.gain.setValueCurveAtTime(
      new Float32Array([
        0.012, 0.026, 0.009, 0.035, 0.014, 0.029, 0.011, 0.041,
        0.016, 0.033, 0.013, 0.047, 0.019, 0.038, 0.016, 0.055,
      ]),
      now,
      duration
    );
    source.connect(high);
    high.connect(low);
    low.connect(gain);
    gain.connect(sfxBus);
    source.start(now);
    state.fuses.set(bombId, { source, gain });
  };

  const stop = () => {
    const state = audioRef.current;
    stopAllFuses();
    if (state.scheduler) window.clearInterval(state.scheduler);
    if (state.ctx && state.ctx.state !== 'closed') {
      state.ctx.close().catch(() => {});
    }
    audioRef.current = {
      ctx: null,
      master: null,
      bgmBus: null,
      sfxBus: null,
      noise: null,
      scheduler: null,
      nextStepAt: 0,
      step: 0,
      stageIndex: 0,
      fuses: new Map(),
    };
  };

  const setStage = (stageIndex) => {
    const state = audioRef.current;
    const normalizedStage = Math.max(0, Math.min(BGM_PROFILES.length - 1, Number(stageIndex) || 0));
    if (state.stageIndex === normalizedStage) return;
    state.stageIndex = normalizedStage;
    state.step = 0;
    if (state.ctx && state.ctx.state !== 'closed') {
      state.nextStepAt = state.ctx.currentTime + 0.08;
      if (state.bgmBus) {
        state.bgmBus.gain.cancelScheduledValues(state.ctx.currentTime);
        state.bgmBus.gain.setValueAtTime(0.12, state.ctx.currentTime);
        state.bgmBus.gain.linearRampToValueAtTime(0.28, state.ctx.currentTime + 0.35);
      }
    }
  };

  const play = (effect) => {
    const { ctx, sfxBus } = audioRef.current;
    if (!ctx || !sfxBus || ctx.state === 'closed') return;
    const now = ctx.currentTime + 0.003;

    if (effect === 'move') {
      const nowMs = performance.now();
      if (nowMs - lastMoveAtRef.current < 60) return;
      lastMoveAtRef.current = nowMs;
      playTone(ctx, sfxBus, {
        frequency: 210,
        endFrequency: 160,
        time: now,
        duration: 0.035,
        level: 0.018,
        wave: 'square',
      });
      return;
    }

    if (effect === 'place') {
      playTone(ctx, sfxBus, {
        frequency: 520,
        endFrequency: 230,
        time: now,
        duration: 0.13,
        level: 0.075,
        wave: 'square',
      });
      playTone(ctx, sfxBus, {
        frequency: 120,
        time: now,
        duration: 0.09,
        level: 0.055,
        wave: 'sine',
      });
      return;
    }

    if (effect === 'kick') {
      playTone(ctx, sfxBus, {
        frequency: 190,
        endFrequency: 92,
        time: now,
        duration: 0.11,
        level: 0.12,
        wave: 'triangle',
      });
      playNoise(ctx, sfxBus, {
        time: now,
        duration: 0.055,
        level: 0.07,
        lowpass: 1200,
        highpass: 120,
      });
      return;
    }

    if (effect === 'explosion') {
      playNoise(ctx, sfxBus, {
        time: now,
        duration: 0.58,
        level: 0.42,
        lowpass: 2100,
        highpass: 28,
      });
      playNoise(ctx, sfxBus, {
        time: now + 0.012,
        duration: 0.14,
        level: 0.13,
        lowpass: 8200,
        highpass: 1900,
      });
      playTone(ctx, sfxBus, {
        frequency: 112,
        endFrequency: 24,
        time: now,
        duration: 0.62,
        level: 0.46,
        wave: 'sine',
      });
      playTone(ctx, sfxBus, {
        frequency: 62,
        endFrequency: 27,
        time: now + 0.018,
        duration: 0.48,
        level: 0.24,
        wave: 'triangle',
      });
      return;
    }

    if (effect === 'defeat') {
      [64, 69, 76].forEach((midi, index) => {
        playTone(ctx, sfxBus, {
          frequency: midiToFrequency(midi),
          time: now + index * 0.055,
          duration: 0.12,
          level: 0.07,
          wave: 'square',
        });
      });
      return;
    }

    if (effect === 'clear') {
      [60, 64, 67, 72, 76].forEach((midi, index) => {
        playTone(ctx, sfxBus, {
          frequency: midiToFrequency(midi),
          time: now + index * 0.09,
          duration: 0.22,
          level: 0.085,
          wave: index % 2 === 0 ? 'square' : 'triangle',
        });
      });
      return;
    }

    if (effect === 'lose') {
      [67, 63, 60, 55].forEach((midi, index) => {
        playTone(ctx, sfxBus, {
          frequency: midiToFrequency(midi),
          time: now + index * 0.11,
          duration: 0.2,
          level: 0.075,
          wave: 'sawtooth',
        });
      });
      return;
    }

    if (effect === 'powerup') {
      [72, 76, 79, 84].forEach((midi, index) => {
        playTone(ctx, sfxBus, {
          frequency: midiToFrequency(midi),
          time: now + index * 0.045,
          duration: 0.13,
          level: 0.07,
          wave: index % 2 === 0 ? 'square' : 'triangle',
        });
      });
      return;
    }

    if (effect === 'tick') {
      playTone(ctx, sfxBus, {
        frequency: 1320,
        time: now,
        duration: 0.045,
        level: 0.04,
        wave: 'square',
      });
    }
  };

  useEffect(() => stop, []);

  return {
    start,
    stop,
    play,
    setStage,
    startFuse,
    stopFuse,
    stopAllFuses,
  };
}
