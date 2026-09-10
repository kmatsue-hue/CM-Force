import { useEffect, useRef } from 'react';

let activeRetroAudioSession = null;

export function useRetroAudio() {
  const audioCtxRef = useRef(null);
  const queuedBgmRef = useRef(false);
  const bgmStateRef = useRef({
    isRunning: false,
    schedulerId: null,
    nextNoteTime: 0,
    step: 0,
    master: null,
    effects: null,
  });
  const noiseBufferRef = useRef({ ctx: null, buffer: null });
  const lastInputSeTimeRef = useRef(0);
  const selectedTrackRef = useRef(Math.floor(Math.random() * 4));
  const isDuckedRef = useRef(false);

  const stopCurrentAudio = () => {
    const bgmState = bgmStateRef.current;
    if (bgmState.schedulerId) {
      clearInterval(bgmState.schedulerId);
      bgmState.schedulerId = null;
    }
    const context = audioCtxRef.current;
    if (context && context.state !== "closed") {
      context.close().catch(() => {});
    }
    if (activeRetroAudioSession?.context === context) activeRetroAudioSession = null;
    audioCtxRef.current = null;
    queuedBgmRef.current = false;
    bgmState.isRunning = false;
    bgmState.master = null;
    bgmState.effects = null;
  };

  useEffect(() => stopCurrentAudio, []);

  const ensureAudioContext = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        if (
          activeRetroAudioSession
          && activeRetroAudioSession.context.state !== 'closed'
          && activeRetroAudioSession.context !== audioCtxRef.current
        ) {
          activeRetroAudioSession.stop();
        }
        audioCtxRef.current = new Ctx();
        activeRetroAudioSession = {
          context: audioCtxRef.current,
          stop: stopCurrentAudio,
        };
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  const getNoiseBuffer = (ctx) => {
    if (noiseBufferRef.current.buffer && noiseBufferRef.current.ctx === ctx) {
      return noiseBufferRef.current.buffer;
    }
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBufferRef.current = { ctx, buffer };
    return buffer;
  };

  const scheduleChipNote = (ctx, destination, freq, time, duration, wave = "square", level = 0.1, detune = 0) => {
    if (!freq || duration <= 0) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);
    if (detune !== 0) {
      osc.detune.setValueAtTime(detune, time);
    }
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), time + 0.006);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, level * 0.42), time + Math.max(0.02, duration * 0.38));
    amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(amp);
    amp.connect(destination);
    osc.start(time);
    osc.stop(time + duration + 0.03);
  };

  const scheduleNoiseHit = (ctx, destination, time, duration = 0.05, level = 0.04) => {
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer(ctx);
    source.playbackRate.setValueAtTime(2.2, time);
    const highPass = ctx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.setValueAtTime(1200, time);
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.setValueAtTime(3600, time);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), time + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(amp);
    amp.connect(destination);
    source.start(time);
    source.stop(time + duration + 0.03);
  };

  const scheduleMarimbaNote = (ctx, destination, freq, time, level = 0.08) => {
    const body = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    const overtoneGain = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    body.type = "sine";
    overtone.type = "sine";
    body.frequency.setValueAtTime(freq, time);
    overtone.frequency.setValueAtTime(freq * 3.02, time);
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(Math.min(5200, freq * 7), time);
    tone.Q.setValueAtTime(1.4, time);
    bodyGain.gain.setValueAtTime(0.0001, time);
    bodyGain.gain.exponentialRampToValueAtTime(level, time + 0.004);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);
    overtoneGain.gain.setValueAtTime(0.0001, time);
    overtoneGain.gain.exponentialRampToValueAtTime(level * 0.34, time + 0.003);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);
    body.connect(bodyGain);
    overtone.connect(overtoneGain);
    bodyGain.connect(tone);
    overtoneGain.connect(tone);
    tone.connect(destination);
    body.start(time);
    overtone.start(time);
    body.stop(time + 0.36);
    overtone.stop(time + 0.15);
  };

  const scheduleOrganNote = (ctx, destination, freq, time, duration, level = 0.035) => {
    const amp = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    const oscillators = [
      { ratio: 1, wave: "sine", gain: 1 },
      { ratio: 2, wave: "sine", gain: 0.28 },
      { ratio: 0.5, wave: "triangle", gain: 0.22 },
    ];
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(2400, time);
    tone.Q.setValueAtTime(0.8, time);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.linearRampToValueAtTime(level, time + 0.025);
    amp.gain.setValueAtTime(level * 0.86, time + Math.max(0.04, duration * 0.55));
    amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillators.forEach(({ ratio, wave, gain }) => {
      const osc = ctx.createOscillator();
      const partialGain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq * ratio, time);
      partialGain.gain.setValueAtTime(gain, time);
      osc.connect(partialGain);
      partialGain.connect(tone);
      osc.start(time);
      osc.stop(time + duration + 0.04);
    });
    tone.connect(amp);
    amp.connect(destination);
  };

  const schedulePluckNote = (ctx, destination, freq, time, level = 0.055) => {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);
    tone.type = "lowpass";
    tone.Q.setValueAtTime(5.5, time);
    tone.frequency.setValueAtTime(Math.min(6000, freq * 8), time);
    tone.frequency.exponentialRampToValueAtTime(Math.max(420, freq * 1.2), time + 0.18);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(level, time + 0.003);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    osc.connect(tone);
    tone.connect(amp);
    amp.connect(destination);
    osc.start(time);
    osc.stop(time + 0.25);
  };

  const scheduleStringsNote = (ctx, destination, freq, time, duration, level = 0.03) => {
    const tone = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(Math.min(3200, freq * 5.2), time);
    tone.Q.setValueAtTime(0.65, time);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.linearRampToValueAtTime(level, time + 0.12);
    amp.gain.setValueAtTime(level * 0.88, time + Math.max(0.16, duration * 0.68));
    amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    [
      { detune: -8, wave: "sawtooth", gain: 0.24 },
      { detune: 0, wave: "triangle", gain: 0.72 },
      { detune: 8, wave: "sawtooth", gain: 0.24 },
    ].forEach(({ detune, wave, gain }) => {
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, time);
      osc.detune.setValueAtTime(detune, time);
      voiceGain.gain.setValueAtTime(gain, time);
      osc.connect(voiceGain);
      voiceGain.connect(tone);
      osc.start(time);
      osc.stop(time + duration + 0.08);
    });
    tone.connect(amp);
    amp.connect(destination);
  };

  const scheduleHarpsichordNote = (ctx, destination, freq, time, level = 0.045) => {
    const tone = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    tone.type = "highpass";
    tone.frequency.setValueAtTime(260, time);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(level, time + 0.003);
    amp.gain.exponentialRampToValueAtTime(level * 0.3, time + 0.09);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);
    [
      { ratio: 1, wave: "triangle", gain: 0.8 },
      { ratio: 2, wave: "square", gain: 0.17 },
      { ratio: 3, wave: "sine", gain: 0.09 },
    ].forEach(({ ratio, wave, gain }) => {
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq * ratio, time);
      voiceGain.gain.setValueAtTime(gain, time);
      osc.connect(voiceGain);
      voiceGain.connect(tone);
      osc.start(time);
      osc.stop(time + 0.45);
    });
    tone.connect(amp);
    amp.connect(destination);
  };

  const scheduleRoundBass = (ctx, destination, freq, time, duration, level = 0.085) => {
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const amp = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    osc.type = "triangle";
    sub.type = "sine";
    osc.frequency.setValueAtTime(freq, time);
    sub.frequency.setValueAtTime(freq * 0.5, time);
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(720, time);
    tone.Q.setValueAtTime(2.2, time);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(level, time + 0.008);
    amp.gain.exponentialRampToValueAtTime(level * 0.58, time + duration * 0.5);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(tone);
    sub.connect(tone);
    tone.connect(amp);
    amp.connect(destination);
    osc.start(time);
    sub.start(time);
    osc.stop(time + duration + 0.03);
    sub.stop(time + duration + 0.03);
  };

  const scheduleKick = (ctx, destination, time, level = 0.12) => {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(135, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.095);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(level, time + 0.003);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
    osc.connect(amp);
    amp.connect(destination);
    osc.start(time);
    osc.stop(time + 0.16);
  };

  const startRetroBgmLoop = () => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const state = bgmStateRef.current;
    if (state.isRunning) return;

    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    const melodyBus = ctx.createGain();
    const organBus = ctx.createGain();
    const marimbaBus = ctx.createGain();
    const pluckBus = ctx.createGain();
    const bassBus = ctx.createGain();
    const bellBus = ctx.createGain();
    const percussionBus = ctx.createGain();
    const effectsBus = ctx.createGain();
    melodyBus.gain.value = 0.21;
    organBus.gain.value = 0.1;
    marimbaBus.gain.value = 0.22;
    pluckBus.gain.value = 0.12;
    bassBus.gain.value = 0.24;
    bellBus.gain.value = 0.08;
    percussionBus.gain.value = 0.16;
    effectsBus.gain.value = 0.34;
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(isDuckedRef.current ? 0.0001 : 0.58, ctx.currentTime + 0.12);
    compressor.threshold.setValueAtTime(-20, ctx.currentTime);
    compressor.knee.setValueAtTime(16, ctx.currentTime);
    compressor.ratio.setValueAtTime(3.2, ctx.currentTime);
    compressor.attack.setValueAtTime(0.004, ctx.currentTime);
    compressor.release.setValueAtTime(0.22, ctx.currentTime);
    melodyBus.connect(master);
    organBus.connect(master);
    marimbaBus.connect(master);
    pluckBus.connect(master);
    bassBus.connect(master);
    bellBus.connect(master);
    percussionBus.connect(master);
    master.connect(compressor);
    effectsBus.connect(compressor);
    compressor.connect(ctx.destination);

    // 起動ごとに「レトロポップ」「ボサノバ」「教会風」「70sイージーリスニング」から1曲を選ぶ。
    const barSteps = 16;
    const defaultBarPatterns = [
      { bass: [48, 55, 57, 58], chord: [60, 64, 67, 69], bell: 84 }, // C6
      { bass: [46, 53, 57, 52], chord: [58, 62, 65, 69], bell: 81 }, // Bbmaj7
      { bass: [41, 48, 50, 52], chord: [57, 60, 65, 69], bell: 86 }, // F6
      { bass: [43, 50, 53, 54], chord: [59, 62, 65, 71], bell: 83 }, // G7
      { bass: [48, 55, 58, 57], chord: [60, 64, 67, 70], bell: 88 }, // C7
      { bass: [45, 52, 55, 61], chord: [57, 61, 64, 67], bell: 85 }, // A7
      { bass: [50, 57, 60, 61], chord: [62, 65, 69, 72], bell: 86 }, // Dm7
      { bass: [43, 50, 54, 59], chord: [59, 62, 65, 71], bell: 91 }, // G7
    ];
    const bossaBarPatterns = [
      { bass: [50, 57, 61, 64], chord: [62, 66, 69, 73], bell: 85 }, // Dmaj9
      { bass: [47, 54, 57, 62], chord: [59, 62, 66, 69], bell: 81 }, // Bm7
      { bass: [43, 50, 54, 57], chord: [55, 59, 62, 66], bell: 83 }, // Gmaj7
      { bass: [45, 52, 55, 61], chord: [57, 61, 64, 67], bell: 80 }, // A7
      { bass: [50, 57, 61, 64], chord: [62, 66, 69, 73], bell: 88 }, // Dmaj9
      { bass: [49, 56, 59, 64], chord: [61, 64, 68, 71], bell: 83 }, // C#7
      { bass: [54, 61, 64, 69], chord: [66, 69, 73, 76], bell: 85 }, // F#m7
      { bass: [45, 52, 55, 61], chord: [57, 61, 64, 67], bell: 81 }, // A7
    ];
    const churchBarPatterns = [
      { bass: [36, 43, 48, 43], chord: [55, 60, 64, 67], bell: 84 }, // C
      { bass: [45, 52, 57, 52], chord: [57, 60, 64, 69], bell: 81 }, // Am
      { bass: [41, 48, 53, 48], chord: [53, 57, 60, 65], bell: 84 }, // F
      { bass: [43, 50, 55, 50], chord: [55, 59, 62, 67], bell: 83 }, // G
      { bass: [41, 48, 53, 48], chord: [53, 57, 60, 65], bell: 81 }, // F
      { bass: [36, 43, 48, 43], chord: [55, 60, 64, 67], bell: 84 }, // C
      { bass: [38, 45, 50, 45], chord: [57, 62, 65, 69], bell: 86 }, // Dm
      { bass: [43, 50, 55, 47], chord: [55, 59, 62, 65], bell: 83 }, // G7
    ];
    const hotelBarPatterns = [
      { bass: [39, 46, 50, 55], chord: [55, 58, 62, 63], bell: 82 }, // Ebmaj7
      { bass: [36, 43, 46, 51], chord: [55, 58, 60, 63], bell: 79 }, // Cm7
      { bass: [41, 48, 51, 56], chord: [56, 60, 63, 65], bell: 84 }, // Fm7
      { bass: [46, 53, 56, 62], chord: [58, 62, 65, 68], bell: 82 }, // Bb7
      { bass: [44, 51, 55, 60], chord: [56, 60, 63, 67], bell: 84 }, // Abmaj7
      { bass: [43, 50, 53, 58], chord: [55, 58, 62, 65], bell: 82 }, // Gm7
      { bass: [36, 43, 46, 52], chord: [55, 58, 60, 64], bell: 79 }, // C7
      { bass: [46, 53, 56, 62], chord: [58, 62, 65, 68], bell: 82 }, // Bb7
    ];
    const trackType = selectedTrackRef.current;
    const barPatterns = [
      defaultBarPatterns,
      bossaBarPatterns,
      churchBarPatterns,
      hotelBarPatterns,
    ][trackType];
    if (trackType === 1) {
      melodyBus.gain.value = 0.16;
      organBus.gain.value = 0.08;
      marimbaBus.gain.value = 0.2;
      pluckBus.gain.value = 0.1;
      bassBus.gain.value = 0.2;
      bellBus.gain.value = 0.06;
      percussionBus.gain.value = 0.11;
    } else if (trackType === 2) {
      melodyBus.gain.value = 0.17;
      organBus.gain.value = 0.18;
      marimbaBus.gain.value = 0.04;
      pluckBus.gain.value = 0;
      bassBus.gain.value = 0.16;
      bellBus.gain.value = 0.1;
      percussionBus.gain.value = 0;
    } else if (trackType === 3) {
      melodyBus.gain.value = 0.14;
      organBus.gain.value = 0.16;
      marimbaBus.gain.value = 0.03;
      pluckBus.gain.value = 0.13;
      bassBus.gain.value = 0.16;
      bellBus.gain.value = 0.05;
      percussionBus.gain.value = 0.075;
    }
    const cycleSteps = barPatterns.length * barSteps;
    const bassPattern = Array.from({ length: cycleSteps }, () => null);
    const organPattern = Array.from({ length: cycleSteps }, () => null);
    const marimbaPattern = Array.from({ length: cycleSteps }, () => null);
    const pluckPattern = Array.from({ length: cycleSteps }, () => null);
    const bellPattern = Array.from({ length: cycleSteps }, () => null);
    barPatterns.forEach((bar, barIdx) => {
      const base = barIdx * barSteps;
      organPattern[base] = bar.chord;
      organPattern[base + 8] = [...bar.chord.slice(1), bar.chord[0] + 12];

      if (trackType === 2) {
        bassPattern[base] = bar.bass[0];
        bassPattern[base + 8] = bar.bass[1];
        bellPattern[base + 12] = bar.bell;
        return;
      }

      if (trackType === 3) {
        bassPattern[base] = bar.bass[0];
        bassPattern[base + 8] = bar.bass[1];
        bassPattern[base + 14] = bar.bass[3];
        pluckPattern[base + 2] = bar.chord[2] + 12;
        pluckPattern[base + 6] = bar.chord[1] + 12;
        pluckPattern[base + 10] = bar.chord[3] + 12;
        pluckPattern[base + 14] = bar.chord[0] + 24;
        bellPattern[base + 12] = bar.bell;
        return;
      }

      if (trackType === 1) {
        bassPattern[base] = bar.bass[0];
        bassPattern[base + 5] = bar.bass[1];
        bassPattern[base + 8] = bar.bass[2];
        bassPattern[base + 13] = bar.bass[3];
        marimbaPattern[base + 3] = bar.chord[1] + 12;
        marimbaPattern[base + 6] = bar.chord[2] + 12;
        marimbaPattern[base + 11] = bar.chord[3] + 12;
        marimbaPattern[base + 14] = bar.chord[1] + 12;
        pluckPattern[base + 4] = bar.chord[2] + 12;
        pluckPattern[base + 10] = bar.chord[0] + 24;
        bellPattern[base + 15] = bar.bell;
        return;
      }

      bassPattern[base] = bar.bass[0];
      bassPattern[base + 3] = bar.bass[1];
      bassPattern[base + 6] = bar.bass[2];
      bassPattern[base + 8] = bar.bass[0] + 12;
      bassPattern[base + 11] = bar.bass[1];
      bassPattern[base + 14] = bar.bass[3];
      marimbaPattern[base + 2] = bar.chord[1] + 12;
      marimbaPattern[base + 5] = bar.chord[2] + 12;
      marimbaPattern[base + 10] = bar.chord[3] + 12;
      marimbaPattern[base + 13] = bar.chord[1] + 12;
      pluckPattern[base + 3] = bar.chord[2] + 12;
      pluckPattern[base + 7] = bar.chord[0] + 24;
      pluckPattern[base + 11] = bar.chord[1] + 12;
      pluckPattern[base + 15] = bar.chord[3] + 12;
      bellPattern[base + 7] = bar.bell;
      bellPattern[base + 15] = bar.bell - (barIdx % 2 === 0 ? 5 : 7);
    });

    const defaultMelodyEvents = [
      [0, { midi: 76, dur: 2 }],
      [3, { midi: 79, dur: 2 }],
      [6, { midi: 81, dur: 2 }],
      [9, { midi: 79, dur: 1 }],
      [11, { midi: 76, dur: 2 }],
      [14, { midi: 74, dur: 2 }],
      [16, { midi: 73, dur: 2 }],
      [19, { midi: 76, dur: 2 }],
      [22, { midi: 79, dur: 2 }],
      [25, { midi: 81, dur: 2 }],
      [28, { midi: 84, dur: 2 }],
      [31, { midi: 81, dur: 1 }],
      [32, { midi: 77, dur: 3 }],
      [36, { midi: 74, dur: 2 }],
      [39, { midi: 77, dur: 2 }],
      [42, { midi: 81, dur: 2 }],
      [45, { midi: 79, dur: 2 }],
      [48, { midi: 74, dur: 2 }],
      [51, { midi: 79, dur: 2 }],
      [54, { midi: 83, dur: 2 }],
      [57, { midi: 81, dur: 1 }],
      [59, { midi: 79, dur: 1 }],
      [61, { midi: 77, dur: 2 }],
      [64, { midi: 76, dur: 2 }],
      [67, { midi: 71, dur: 2 }],
      [70, { midi: 74, dur: 2 }],
      [73, { midi: 76, dur: 2 }],
      [76, { midi: 79, dur: 3 }],
      [80, { midi: 85, dur: 2 }],
      [83, { midi: 81, dur: 2 }],
      [86, { midi: 79, dur: 2 }],
      [89, { midi: 76, dur: 2 }],
      [92, { midi: 73, dur: 3 }],
      [96, { midi: 74, dur: 2 }],
      [99, { midi: 77, dur: 2 }],
      [102, { midi: 81, dur: 2 }],
      [105, { midi: 86, dur: 2 }],
      [108, { midi: 84, dur: 2 }],
      [111, { midi: 81, dur: 1 }],
      [112, { midi: 83, dur: 2 }],
      [115, { midi: 79, dur: 2 }],
      [118, { midi: 77, dur: 2 }],
      [121, { midi: 74, dur: 2 }],
      [124, { midi: 71, dur: 1 }],
      [126, { midi: 72, dur: 1 }],
      [127, { midi: 74, dur: 1 }],
    ];
    const bossaMelodyEvents = [
      [0, { midi: 78, dur: 3 }],
      [4, { midi: 81, dur: 2 }],
      [7, { midi: 85, dur: 3 }],
      [12, { midi: 83, dur: 2 }],
      [16, { midi: 78, dur: 3 }],
      [21, { midi: 76, dur: 2 }],
      [24, { midi: 74, dur: 3 }],
      [29, { midi: 78, dur: 2 }],
      [32, { midi: 79, dur: 3 }],
      [36, { midi: 83, dur: 2 }],
      [40, { midi: 86, dur: 3 }],
      [45, { midi: 85, dur: 2 }],
      [48, { midi: 81, dur: 3 }],
      [53, { midi: 78, dur: 2 }],
      [56, { midi: 76, dur: 3 }],
      [61, { midi: 73, dur: 2 }],
      [64, { midi: 78, dur: 3 }],
      [68, { midi: 81, dur: 2 }],
      [72, { midi: 85, dur: 3 }],
      [77, { midi: 88, dur: 2 }],
      [80, { midi: 83, dur: 3 }],
      [85, { midi: 81, dur: 2 }],
      [88, { midi: 78, dur: 3 }],
      [93, { midi: 76, dur: 2 }],
      [96, { midi: 73, dur: 3 }],
      [101, { midi: 76, dur: 2 }],
      [104, { midi: 80, dur: 3 }],
      [109, { midi: 83, dur: 2 }],
      [112, { midi: 81, dur: 3 }],
      [117, { midi: 78, dur: 2 }],
      [120, { midi: 76, dur: 3 }],
      [125, { midi: 74, dur: 2 }],
    ];
    const churchMelodyEvents = [
      [0, { midi: 72, dur: 8 }],
      [12, { midi: 74, dur: 4 }],
      [16, { midi: 76, dur: 8 }],
      [28, { midi: 79, dur: 4 }],
      [32, { midi: 77, dur: 8 }],
      [44, { midi: 76, dur: 4 }],
      [48, { midi: 74, dur: 8 }],
      [60, { midi: 71, dur: 4 }],
      [64, { midi: 72, dur: 8 }],
      [76, { midi: 76, dur: 4 }],
      [80, { midi: 81, dur: 8 }],
      [92, { midi: 79, dur: 4 }],
      [96, { midi: 77, dur: 8 }],
      [108, { midi: 74, dur: 4 }],
      [112, { midi: 71, dur: 6 }],
      [120, { midi: 72, dur: 8 }],
    ];
    const hotelMelodyEvents = [
      [0, { midi: 75, dur: 4 }],
      [5, { midi: 79, dur: 3 }],
      [9, { midi: 82, dur: 4 }],
      [14, { midi: 79, dur: 2 }],
      [16, { midi: 75, dur: 4 }],
      [21, { midi: 74, dur: 3 }],
      [25, { midi: 72, dur: 4 }],
      [30, { midi: 70, dur: 2 }],
      [32, { midi: 72, dur: 4 }],
      [37, { midi: 77, dur: 3 }],
      [41, { midi: 80, dur: 4 }],
      [46, { midi: 77, dur: 2 }],
      [48, { midi: 75, dur: 4 }],
      [53, { midi: 72, dur: 3 }],
      [57, { midi: 70, dur: 4 }],
      [62, { midi: 68, dur: 2 }],
      [64, { midi: 75, dur: 4 }],
      [69, { midi: 79, dur: 3 }],
      [73, { midi: 82, dur: 4 }],
      [78, { midi: 84, dur: 2 }],
      [80, { midi: 80, dur: 4 }],
      [85, { midi: 79, dur: 3 }],
      [89, { midi: 75, dur: 4 }],
      [94, { midi: 72, dur: 2 }],
      [96, { midi: 77, dur: 4 }],
      [101, { midi: 80, dur: 3 }],
      [105, { midi: 79, dur: 4 }],
      [110, { midi: 75, dur: 2 }],
      [112, { midi: 74, dur: 4 }],
      [117, { midi: 72, dur: 3 }],
      [121, { midi: 70, dur: 3 }],
      [125, { midi: 75, dur: 3 }],
    ];
    const melodyEvents = new Map([
      defaultMelodyEvents,
      bossaMelodyEvents,
      churchMelodyEvents,
      hotelMelodyEvents,
    ][trackType]);

    const tempo = [116, 94, 72, 102][trackType];
    const stepDuration = 60 / tempo / 4;
    const scheduleAheadTime = 0.45;

    state.isRunning = true;
    state.master = master;
    state.effects = effectsBus;
    state.nextNoteTime = ctx.currentTime + 0.01;
    state.step = 0;

    const scheduler = () => {
      while (state.nextNoteTime < ctx.currentTime + scheduleAheadTime) {
        const step = state.step;
        const cycleStep = step % cycleSteps;
        const melodyEvent = melodyEvents.get(cycleStep);
        const organMidi = organPattern[cycleStep];
        const marimbaMidi = marimbaPattern[cycleStep];
        const pluckMidi = pluckPattern[cycleStep];
        const bassMidi = bassPattern[cycleStep];
        const bellMidi = bellPattern[cycleStep];
        const swingAmount = [0.22, 0.1, 0, 0.08][trackType];
        const noteTime = state.nextNoteTime + (cycleStep % 2 === 1 ? stepDuration * swingAmount : 0);

        if (melodyEvent) {
          if (trackType === 2) {
            scheduleOrganNote(
              ctx,
              melodyBus,
              midiToFreq(melodyEvent.midi),
              noteTime,
              stepDuration * melodyEvent.dur * 0.94,
              0.05
            );
            scheduleChipNote(
              ctx,
              bellBus,
              midiToFreq(melodyEvent.midi + 12),
              noteTime + 0.015,
              stepDuration * 1.6,
              "sine",
              0.018
            );
          } else if (trackType === 1) {
            scheduleMarimbaNote(ctx, melodyBus, midiToFreq(melodyEvent.midi), noteTime, 0.064);
            scheduleChipNote(
              ctx,
              melodyBus,
              midiToFreq(melodyEvent.midi),
              noteTime + 0.008,
              stepDuration * melodyEvent.dur,
              "triangle",
              0.05,
              3
            );
          } else if (trackType === 3) {
            scheduleStringsNote(
              ctx,
              melodyBus,
              midiToFreq(melodyEvent.midi),
              noteTime,
              stepDuration * melodyEvent.dur * 0.92,
              0.034
            );
            scheduleHarpsichordNote(
              ctx,
              bellBus,
              midiToFreq(melodyEvent.midi + 12),
              noteTime + 0.012,
              0.014
            );
          } else {
            scheduleChipNote(
              ctx,
              melodyBus,
              midiToFreq(melodyEvent.midi),
              noteTime,
              stepDuration * melodyEvent.dur,
              "triangle",
              0.085,
              cycleStep % barSteps === 0 ? 5 : 0
            );
            scheduleChipNote(
              ctx,
              melodyBus,
              midiToFreq(melodyEvent.midi + 12),
              noteTime + 0.008,
              stepDuration * Math.max(0.75, melodyEvent.dur * 0.72),
              "square",
              0.022,
              7
            );
          }
        }
        if (organMidi !== null) {
          organMidi.forEach((midi, chordIdx) => {
            if (trackType === 3) {
              scheduleStringsNote(
                ctx,
                organBus,
                midiToFreq(midi),
                noteTime + chordIdx * 0.006,
                stepDuration * 7.75,
                0.026
              );
            } else {
              scheduleOrganNote(
                ctx,
                organBus,
                midiToFreq(midi),
                noteTime + chordIdx * 0.004,
                stepDuration * (trackType === 2 ? 7.85 : trackType === 1 ? 7.45 : 7.2),
                trackType === 2 ? 0.034 : trackType === 1 ? 0.021 : 0.026
              );
            }
          });
        }
        if (marimbaMidi !== null) {
          scheduleMarimbaNote(ctx, marimbaBus, midiToFreq(marimbaMidi), noteTime, trackType === 1 ? 0.06 : 0.075);
        }
        if (pluckMidi !== null) {
          if (trackType === 3) {
            scheduleHarpsichordNote(ctx, pluckBus, midiToFreq(pluckMidi), noteTime, 0.04);
          } else {
            schedulePluckNote(ctx, pluckBus, midiToFreq(pluckMidi), noteTime, trackType === 1 ? 0.038 : 0.05);
          }
        }
        if (bassMidi !== null) {
          scheduleRoundBass(
            ctx,
            bassBus,
            midiToFreq(bassMidi),
            noteTime,
            stepDuration * (trackType === 2 ? 6.6 : trackType === 3 ? 4.8 : trackType === 1 ? 2.7 : 1.85),
            trackType === 2 ? 0.055 : trackType === 3 ? 0.05 : trackType === 1 ? 0.068 : 0.082
          );
        }
        if (bellMidi !== null) {
          if (trackType === 3) {
            scheduleHarpsichordNote(ctx, bellBus, midiToFreq(bellMidi), noteTime, 0.024);
          } else {
            scheduleMarimbaNote(ctx, bellBus, midiToFreq(bellMidi), noteTime, 0.045);
            scheduleChipNote(ctx, bellBus, midiToFreq(bellMidi + 12), noteTime + 0.018, stepDuration * 0.65, "sine", 0.022, 9);
          }
        }

        const beatStep = cycleStep % barSteps;
        if (trackType === 3) {
          if (beatStep === 0 || beatStep === 8) {
            scheduleKick(ctx, percussionBus, noteTime, beatStep === 0 ? 0.052 : 0.036);
          }
          if (beatStep === 4 || beatStep === 12) {
            scheduleNoiseHit(ctx, percussionBus, noteTime, 0.06, 0.015);
          } else if (beatStep % 2 === 0) {
            scheduleNoiseHit(ctx, percussionBus, noteTime, 0.018, 0.004);
          }
        } else if (trackType === 1) {
          if ([0, 6, 8, 14].includes(beatStep)) {
            scheduleKick(ctx, percussionBus, noteTime, beatStep === 0 ? 0.075 : 0.048);
          }
          if (beatStep === 4 || beatStep === 12) {
            scheduleNoiseHit(ctx, percussionBus, noteTime, 0.055, 0.024);
          } else if (beatStep % 2 === 0) {
            scheduleNoiseHit(ctx, percussionBus, noteTime, 0.018, 0.006);
          }
        } else if (trackType === 0) {
          if (beatStep === 0 || beatStep === 8) {
            scheduleKick(ctx, percussionBus, noteTime, beatStep === 0 ? 0.12 : 0.095);
          }
          if (beatStep === 4 || beatStep === 12) {
            scheduleNoiseHit(ctx, percussionBus, noteTime, 0.075, 0.038);
          } else if (beatStep % 2 === 0) {
            scheduleNoiseHit(ctx, percussionBus, noteTime, 0.022, 0.009);
          }
          if (beatStep === 6 || beatStep === 14) {
            scheduleChipNote(ctx, percussionBus, 980, noteTime, 0.028, "square", 0.015, beatStep === 14 ? 18 : -12);
          }
        }

        state.nextNoteTime += stepDuration;
        state.step += 1;
      }
    };

    scheduler();
    state.schedulerId = window.setInterval(scheduler, 70);
  };

  const playRetroBgm = () => {
    if (bgmStateRef.current.isRunning || queuedBgmRef.current) return;
    queuedBgmRef.current = true;
    const ctx = ensureAudioContext();
    if (!ctx) {
      queuedBgmRef.current = false;
      return;
    }
    const run = () => {
      queuedBgmRef.current = false;
      startRetroBgmLoop();
    };
    if (ctx.state === "suspended") {
      ctx.resume().then(run).catch(() => {
        queuedBgmRef.current = true;
      });
      return;
    }
    run();
  };

  const playInputSe = () => {
    const nowMs = performance.now();
    if (nowMs - lastInputSeTimeRef.current < 65) return;
    lastInputSeTimeRef.current = nowMs;

    const ctx = ensureAudioContext();
    if (!ctx) return;

    const run = () => {
      const destination = bgmStateRef.current.effects || ctx.destination;
      const t = ctx.currentTime + 0.002;
      scheduleChipNote(ctx, destination, 1174.66, t, 0.042, "square", 0.045);
      scheduleChipNote(ctx, destination, 1567.98, t + 0.028, 0.028, "square", 0.032);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(run).catch(() => {
        queuedBgmRef.current = true;
      });
      return;
    }
    run();
  };

  const playPopupSe = (isHighlight) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const run = () => {
      const destination = bgmStateRef.current.effects || ctx.destination;
      const t = ctx.currentTime + 0.01;
      const notes = isHighlight
        ? [659.25, 783.99, 1046.5]
        : [523.25, 659.25];
      notes.forEach((freq, idx) => {
        scheduleChipNote(
          ctx,
          destination,
          freq,
          t + idx * 0.07,
          isHighlight ? 0.11 : 0.08,
          idx === notes.length - 1 && isHighlight ? "triangle" : "square",
          isHighlight ? 0.08 : 0.055
        );
      });
      scheduleNoiseHit(ctx, destination, t + (isHighlight ? 0.03 : 0.015), 0.04, isHighlight ? 0.035 : 0.022);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(run).catch(() => {
        queuedBgmRef.current = true;
      });
      return;
    }
    run();
  };

  const playTabSe = (screen) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const run = () => {
      const destination = bgmStateRef.current.effects || ctx.destination;
      const t = ctx.currentTime + 0.002;
      const patterns = {
        home: [
          { midi: 76, offset: 0, wave: "square" },
          { midi: 83, offset: 0.055, wave: "triangle" },
        ],
        village: [
          { midi: 67, offset: 0, wave: "triangle" },
          { midi: 72, offset: 0.06, wave: "square" },
        ],
        map: [
          { midi: 72, offset: 0, wave: "square" },
          { midi: 76, offset: 0.045, wave: "square" },
          { midi: 79, offset: 0.09, wave: "triangle" },
        ],
        guild: [
          { midi: 79, offset: 0, wave: "triangle" },
          { midi: 84, offset: 0.065, wave: "triangle" },
        ],
      };
      const notes = patterns[screen] || patterns.home;
      notes.forEach((note, idx) => {
        scheduleChipNote(
          ctx,
          destination,
          midiToFreq(note.midi),
          t + note.offset,
          idx === notes.length - 1 ? 0.11 : 0.075,
          note.wave,
          0.065,
          idx * 3
        );
      });
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(run).catch(() => {
        queuedBgmRef.current = false;
      });
      return;
    }
    run();
  };

  const setRetroBgmDucked = (ducked) => {
    isDuckedRef.current = ducked;
    const ctx = audioCtxRef.current;
    const master = bgmStateRef.current.master;
    if (!ctx || !master || ctx.state === 'closed') return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(ducked ? 0.0001 : 0.58, now, ducked ? 0.03 : 0.12);
  };

  return { playRetroBgm, playInputSe, playPopupSe, playTabSe, setRetroBgmDucked };
}
