import { useEffect, useRef } from 'react';

export function useRetroAudio() {
  const audioCtxRef = useRef(null);
  const queuedBgmRef = useRef(false);
  const bgmStateRef = useRef({ isRunning: false, schedulerId: null, nextNoteTime: 0, step: 0, master: null });
  const noiseBufferRef = useRef({ ctx: null, buffer: null });
  const lastInputSeTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      const bgmState = bgmStateRef.current;
      if (bgmState.schedulerId) {
        clearInterval(bgmState.schedulerId);
        bgmState.schedulerId = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
    };
  }, []);

  const ensureAudioContext = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
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

  const startRetroBgmLoop = () => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const state = bgmStateRef.current;
    if (state.isRunning) return;

    const master = ctx.createGain();
    const melodyBus = ctx.createGain();
    const harmonyBus = ctx.createGain();
    const bassBus = ctx.createGain();
    const bellBus = ctx.createGain();
    const noiseBus = ctx.createGain();
    melodyBus.gain.value = 0.22;
    harmonyBus.gain.value = 0.14;
    bassBus.gain.value = 0.2;
    bellBus.gain.value = 0.1;
    noiseBus.gain.value = 0.05;
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.32);
    melodyBus.connect(master);
    harmonyBus.connect(master);
    bassBus.connect(master);
    bellBus.connect(master);
    noiseBus.connect(master);
    master.connect(ctx.destination);

    const waltzBarSteps = 12;
    const barPatterns = [
      { bass: [50, 57, 62], harmony: [66, 69], bell: 81 },
      { bass: [45, 52, 57], harmony: [64, 69], bell: 83 },
      { bass: [47, 54, 59], harmony: [62, 66], bell: 81 },
      { bass: [43, 50, 55], harmony: [59, 62], bell: 79 },
      { bass: [42, 50, 57], harmony: [62, 66], bell: 81 },
      { bass: [43, 50, 55], harmony: [59, 62], bell: 86 },
      { bass: [45, 52, 57], harmony: [61, 64], bell: 83 },
      { bass: [50, 57, 62], harmony: [62, 66], bell: 81 },
    ];
    const cycleSteps = barPatterns.length * waltzBarSteps;
    const bassPattern = Array.from({ length: cycleSteps }, () => null);
    const harmonyPattern = Array.from({ length: cycleSteps }, () => null);
    const bellPattern = Array.from({ length: cycleSteps }, () => null);
    barPatterns.forEach((bar, barIdx) => {
      const base = barIdx * waltzBarSteps;
      bassPattern[base] = bar.bass[0];
      bassPattern[base + 4] = bar.bass[1];
      bassPattern[base + 8] = bar.bass[2];
      harmonyPattern[base + 4] = bar.harmony[0];
      harmonyPattern[base + 8] = bar.harmony[1];
      bellPattern[base + 10] = bar.bell;
    });

    const melodyEvents = new Map([
      [0, { midi: 74, dur: 6 }],
      [6, { midi: 76, dur: 2 }],
      [8, { midi: 78, dur: 4 }],
      [12, { midi: 81, dur: 4 }],
      [16, { midi: 79, dur: 4 }],
      [20, { midi: 78, dur: 4 }],
      [24, { midi: 74, dur: 6 }],
      [30, { midi: 71, dur: 2 }],
      [32, { midi: 74, dur: 4 }],
      [36, { midi: 79, dur: 4 }],
      [40, { midi: 78, dur: 4 }],
      [44, { midi: 76, dur: 4 }],
      [48, { midi: 74, dur: 4 }],
      [52, { midi: 78, dur: 4 }],
      [56, { midi: 81, dur: 4 }],
      [60, { midi: 83, dur: 4 }],
      [64, { midi: 81, dur: 4 }],
      [68, { midi: 79, dur: 4 }],
      [72, { midi: 78, dur: 4 }],
      [76, { midi: 76, dur: 4 }],
      [80, { midi: 74, dur: 2 }],
      [82, { midi: 71, dur: 2 }],
      [84, { midi: 69, dur: 4 }],
      [88, { midi: 73, dur: 2 }],
      [90, { midi: 74, dur: 6 }],
    ]);

    const tempo = 104;
    const stepDuration = 60 / tempo / 4;
    const scheduleAheadTime = 0.45;

    state.isRunning = true;
    state.master = master;
    state.nextNoteTime = ctx.currentTime + 0.04;
    state.step = 0;

    const scheduler = () => {
      while (state.nextNoteTime < ctx.currentTime + scheduleAheadTime) {
        const step = state.step;
        const cycleStep = step % cycleSteps;
        const melodyEvent = melodyEvents.get(cycleStep);
        const harmonyMidi = harmonyPattern[cycleStep];
        const bassMidi = bassPattern[cycleStep];
        const bellMidi = bellPattern[cycleStep];

        if (melodyEvent) {
          scheduleChipNote(
            ctx,
            melodyBus,
            midiToFreq(melodyEvent.midi),
            state.nextNoteTime,
            stepDuration * melodyEvent.dur,
            "square",
            0.11,
            cycleStep % waltzBarSteps === 0 ? 5 : 0
          );
        }
        if (harmonyMidi !== null) {
          scheduleChipNote(
            ctx,
            harmonyBus,
            midiToFreq(harmonyMidi),
            state.nextNoteTime,
            stepDuration * 2.9,
            "square",
            0.062,
            -5
          );
        }
        if (bassMidi !== null) {
          scheduleChipNote(
            ctx,
            bassBus,
            midiToFreq(bassMidi),
            state.nextNoteTime,
            stepDuration * 3.4,
            "triangle",
            0.088
          );
        }
        if (bellMidi !== null) {
          scheduleChipNote(
            ctx,
            bellBus,
            midiToFreq(bellMidi),
            state.nextNoteTime,
            stepDuration * 1.25,
            "triangle",
            0.05,
            11
          );
        }

        if (cycleStep % waltzBarSteps === 0) {
          scheduleNoiseHit(ctx, noiseBus, state.nextNoteTime, 0.05, 0.02);
        } else if (cycleStep % waltzBarSteps === 8) {
          scheduleNoiseHit(ctx, noiseBus, state.nextNoteTime, 0.04, 0.013);
        }

        state.nextNoteTime += stepDuration;
        state.step += 1;
      }
    };

    scheduler();
    state.schedulerId = window.setInterval(scheduler, 70);
  };

  const playRetroBgm = () => {
    queuedBgmRef.current = true;
    const ctx = ensureAudioContext();
    if (!ctx) return;
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
      const destination = bgmStateRef.current.master || ctx.destination;
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
      const destination = bgmStateRef.current.master || ctx.destination;
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

  return { playRetroBgm, playInputSe, playPopupSe };
}