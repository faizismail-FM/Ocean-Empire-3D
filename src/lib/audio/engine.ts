import { intensityFor, melodyNotes, midiToHz, mulberry32, nextNoteIndex, paletteFor, type Palette, type SceneMode } from "./music";

/**
 * Procedural sound for the game, built on the Web Audio API so no audio files are shipped.
 *
 *  - Ambience: a looping noise source split into an ocean path (low-passed, with a slow
 *    swell) and a wind path (band-passed, scaled by the simulated wind), plus a hull creak
 *    for sailing ships and an engine hum for motor ships.
 *  - Music: a drone and a sparse generative melody in the palette chosen for the campaign.
 *
 * Browsers only allow sound after a user gesture, so `start()` is called from a click or
 * key handler; before that every call is a no-op. All parameters move with short ramps.
 */

export interface AudioMix {
  enabled: boolean;
  master: number;
  music: number;
  ambience: number;
}

export interface AudioScene {
  mode: SceneMode;
  family: string | null;
  docked: boolean;
  paused: boolean;
  speedKnots: number;
  windKnots: number;
  throttle: number;
  propulsion: "sail" | "engine" | null;
}

const DEFAULT_SCENE: AudioScene = { mode: "off", family: null, docked: true, paused: false, speedKnots: 0, windKnots: 0, throttle: 0, propulsion: null };

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicGain!: GainNode;
  private ambienceGain!: GainNode;
  private oceanGain!: GainNode;
  private windGain!: GainNode;
  private windFilter!: BiquadFilterNode;
  private engineGain!: GainNode;
  private engineOsc!: OscillatorNode;
  private droneGain!: GainNode;
  private droneOscs: OscillatorNode[] = [];
  private noise!: AudioBufferSourceNode;
  private creakTimer: number | null = null;
  private schedulerTimer: number | null = null;
  private nextBeatTime = 0;
  private beatCount = 0;
  private noteIndex = 0;
  private palette: Palette | null = null;
  private paletteFamily: string | null | undefined = undefined;
  private rand = mulberry32(Date.now() >>> 0);
  private mix: AudioMix = { enabled: true, master: 0.7, music: 0.6, ambience: 0.8 };
  private scene: AudioScene = DEFAULT_SCENE;
  private visibilityBound = false;

  get started(): boolean {
    return this.ctx !== null;
  }

  /** Create the context and graph. Must run inside a user gesture handler. */
  start(): void {
    if (this.ctx || typeof window === "undefined") return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0;
    this.musicGain.connect(this.master);
    this.ambienceGain = ctx.createGain();
    this.ambienceGain.gain.value = 0;
    this.ambienceGain.connect(this.master);

    // Noise source shared by ocean and wind.
    const seconds = 4;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      // Lightly pinked noise: average with the previous sample.
      const white = Math.random() * 2 - 1;
      last = (last + white * 0.4) * 0.72;
      data[i] = last * 2.4;
    }
    this.noise = ctx.createBufferSource();
    this.noise.buffer = buffer;
    this.noise.loop = true;

    const ocean = ctx.createBiquadFilter();
    ocean.type = "lowpass";
    ocean.frequency.value = 320;
    ocean.Q.value = 0.5;
    this.oceanGain = ctx.createGain();
    this.oceanGain.gain.value = 0;
    this.noise.connect(ocean).connect(this.oceanGain).connect(this.ambienceGain);
    // Swell: a slow LFO on the ocean level.
    const swell = ctx.createOscillator();
    swell.type = "sine";
    swell.frequency.value = 0.11;
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = 0.08;
    swell.connect(swellDepth).connect(this.oceanGain.gain);
    swell.start();

    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.value = 700;
    this.windFilter.Q.value = 0.6;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    this.noise.connect(this.windFilter).connect(this.windGain).connect(this.ambienceGain);
    const gust = ctx.createOscillator();
    gust.type = "sine";
    gust.frequency.value = 0.07;
    const gustDepth = ctx.createGain();
    gustDepth.gain.value = 180;
    gust.connect(gustDepth).connect(this.windFilter.frequency);
    gust.start();
    this.noise.start();

    // Engine hum for motor ships.
    this.engineOsc = ctx.createOscillator();
    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.value = 46;
    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 160;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineOsc.connect(engineFilter).connect(this.engineGain).connect(this.ambienceGain);
    this.engineOsc.start();

    // Drone.
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0;
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 900;
    this.droneGain.connect(droneFilter).connect(this.musicGain);

    if (!this.visibilityBound) {
      this.visibilityBound = true;
      document.addEventListener("visibilitychange", () => {
        if (!this.ctx) return;
        if (document.hidden) void this.ctx.suspend();
        else void this.ctx.resume();
      });
    }
    this.applyMix();
    this.applyScene();
    this.schedulerTimer = window.setInterval(() => this.schedule(), 120);
    this.creakTimer = window.setInterval(() => this.maybeCreak(), 2500);
  }

  setMix(mix: AudioMix): void {
    this.mix = mix;
    this.applyMix();
  }

  setScene(scene: AudioScene): void {
    this.scene = scene;
    this.applyScene();
  }

  private ramp(param: AudioParam, value: number, seconds = 0.6): void {
    if (!this.ctx) return;
    param.setTargetAtTime(value, this.ctx.currentTime, seconds / 3);
  }

  private applyMix(): void {
    if (!this.ctx) return;
    const { enabled, master, music, ambience } = this.mix;
    this.ramp(this.master.gain, enabled ? master : 0, 0.4);
    this.ramp(this.musicGain.gain, music, 0.6);
    this.ramp(this.ambienceGain.gain, ambience, 0.6);
    if (enabled && this.ctx.state === "suspended" && !document.hidden) void this.ctx.resume();
  }

  private applyScene(): void {
    if (!this.ctx) return;
    const s = this.scene;
    const sailing = s.mode === "sailing";
    const atSea = sailing && !s.docked;
    // Ambience.
    const ocean = sailing ? (s.docked ? 0.14 : 0.3 + 0.1 * Math.min(1, s.windKnots / 25)) : 0;
    const wind = atSea ? 0.4 * Math.min(1, s.windKnots / 30) : sailing ? 0.06 : 0;
    const engine = atSea && s.propulsion === "engine" ? 0.05 + 0.18 * s.throttle : 0;
    this.ramp(this.oceanGain.gain, ocean, 1.5);
    this.ramp(this.windGain.gain, wind, 2);
    this.ramp(this.windFilter.frequency, 500 + 900 * Math.min(1, s.windKnots / 30), 3);
    this.ramp(this.engineGain.gain, engine, 1);
    this.ramp(this.engineOsc.frequency, 40 + 30 * s.throttle, 2);
    // Music.
    if (s.family !== this.paletteFamily) {
      this.paletteFamily = s.family;
      this.palette = paletteFor(s.family);
      this.noteIndex = Math.floor(melodyNotes(this.palette).length / 2);
      this.restartDrone();
    }
    const intensity = intensityFor(s);
    this.ramp(this.droneGain.gain, intensity.level * 0.07, 2);
  }

  private restartDrone(): void {
    if (!this.ctx || !this.palette) return;
    for (const o of this.droneOscs) {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    }
    this.droneOscs = [];
    const notes = [this.palette.root - 12, this.palette.root];
    if (this.palette.fifth) notes.push(this.palette.root + 7);
    for (const n of notes) {
      for (const detune of [-4, 4]) {
        const o = this.ctx.createOscillator();
        o.type = n === notes[0] ? "triangle" : "sawtooth";
        o.frequency.value = midiToHz(n);
        o.detune.value = detune;
        const g = this.ctx.createGain();
        g.gain.value = n === notes[0] ? 0.5 : 0.22;
        o.connect(g).connect(this.droneGain);
        o.start();
        this.droneOscs.push(o);
      }
    }
  }

  /** Look-ahead scheduler: queue the next beats a little ahead of the audio clock. */
  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || !this.palette || ctx.state !== "running") return;
    const intensity = intensityFor(this.scene);
    if (intensity.level <= 0 || !this.mix.enabled) {
      this.nextBeatTime = ctx.currentTime + 0.2;
      return;
    }
    const beat = 60 / this.palette.tempo_bpm;
    if (this.nextBeatTime < ctx.currentTime - 1) this.nextBeatTime = ctx.currentTime + 0.1;
    while (this.nextBeatTime < ctx.currentTime + 0.3) {
      const t = this.nextBeatTime;
      const onBar = this.beatCount % 8 === 0;
      if (onBar && this.rand() < 0.7) this.playNote(this.palette.root + (this.rand() < 0.6 ? 0 : this.palette.fifth ? 7 : 12), t, beat * 6, intensity.level * 0.5, true);
      if (this.rand() < intensity.density * 0.9) {
        const notes = melodyNotes(this.palette);
        this.noteIndex = nextNoteIndex(this.noteIndex, notes.length, this.rand);
        const semis = notes[this.noteIndex] ?? 0;
        const lengthBeats = this.rand() < 0.25 ? 3 : this.rand() < 0.5 ? 2 : 1;
        this.playNote(this.palette.root + semis, t + (this.rand() < 0.3 ? beat / 2 : 0), beat * lengthBeats, intensity.level * (0.6 + 0.4 * this.rand()), false);
      }
      this.beatCount++;
      this.nextBeatTime += beat;
    }
  }

  private playNote(midi: number, at: number, duration: number, velocity: number, bass: boolean): void {
    const ctx = this.ctx;
    if (!ctx || !this.palette) return;
    const hz = midiToHz(midi);
    const timbre = bass ? "pad" : this.palette.timbre;
    const out = ctx.createGain();
    out.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    out.connect(filter).connect(this.musicGain);
    const oscs: OscillatorNode[] = [];
    const osc = (type: OscillatorType, ratio: number, gain: number, detune = 0) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = hz * ratio;
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g).connect(out);
      oscs.push(o);
    };
    const v = Math.min(1, velocity) * (bass ? 0.5 : 0.32);
    let attack = 0.01;
    let release = 0.8;
    let hold = 0;
    switch (timbre) {
      case "pluck":
        osc("triangle", 1, 0.8);
        osc("sawtooth", 1, 0.25);
        filter.frequency.setValueAtTime(2600, at);
        filter.frequency.exponentialRampToValueAtTime(500, at + 0.5);
        release = 1.4;
        break;
      case "zither":
        osc("sawtooth", 1, 0.45);
        osc("triangle", 2, 0.25);
        filter.frequency.setValueAtTime(4200, at);
        filter.frequency.exponentialRampToValueAtTime(700, at + 0.7);
        release = 1.8;
        break;
      case "marimba":
        osc("sine", 1, 0.9);
        osc("sine", 4, 0.18);
        filter.frequency.value = 5000;
        release = 0.7;
        break;
      case "metal":
        osc("sine", 1, 0.7);
        osc("sine", 2.76, 0.22);
        osc("sine", 5.4, 0.1);
        filter.frequency.value = 6000;
        release = 1.6;
        break;
      case "bowed":
        osc("sawtooth", 1, 0.5, -5);
        osc("sawtooth", 1, 0.5, 5);
        filter.frequency.value = 1300;
        attack = 0.35;
        hold = Math.max(0.2, duration - 0.6);
        release = 0.9;
        break;
      case "harpsichord":
        osc("square", 1, 0.35);
        osc("sawtooth", 1, 0.35);
        osc("square", 2, 0.12);
        filter.frequency.setValueAtTime(5000, at);
        filter.frequency.exponentialRampToValueAtTime(1500, at + 0.3);
        attack = 0.004;
        release = 0.55;
        break;
      case "pad":
        osc("sawtooth", 1, 0.45, -7);
        osc("sawtooth", 1, 0.45, 7);
        osc("sine", 0.5, 0.3);
        filter.frequency.value = bass ? 400 : 900;
        attack = bass ? 0.8 : 1.4;
        hold = Math.max(0.5, duration - 1);
        release = 2.2;
        break;
    }
    out.gain.setValueAtTime(0, at);
    out.gain.linearRampToValueAtTime(v, at + attack);
    const releaseStart = at + attack + hold;
    out.gain.setTargetAtTime(0, releaseStart, release / 4);
    const end = releaseStart + release * 1.5;
    for (const o of oscs) {
      o.start(at);
      o.stop(end);
    }
    oscs[oscs.length - 1]?.addEventListener("ended", () => {
      out.disconnect();
      filter.disconnect();
    });
  }

  /** Occasional hull creak for sailing ships under way. */
  private maybeCreak(): void {
    const ctx = this.ctx;
    const s = this.scene;
    if (!ctx || ctx.state !== "running" || !this.mix.enabled) return;
    if (s.mode !== "sailing" || s.docked || s.propulsion !== "sail") return;
    const chance = 0.25 + 0.4 * Math.min(1, s.windKnots / 30);
    if (this.rand() > chance) return;
    const t = ctx.currentTime + this.rand() * 1.5;
    const src = ctx.createBufferSource();
    src.buffer = this.noise.buffer;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(180 + this.rand() * 160, t);
    f.frequency.exponentialRampToValueAtTime(90 + this.rand() * 60, t + 0.5);
    f.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.08);
    g.gain.setTargetAtTime(0, t + 0.2, 0.15);
    src.connect(f).connect(g).connect(this.ambienceGain);
    src.start(t);
    src.stop(t + 1.2);
  }
}

let engine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
