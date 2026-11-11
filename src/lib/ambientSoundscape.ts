// Zero-dependency procedural Web Audio Ambient Soundscape Engine for AirIQ
// Synthesizes dynamic nature sounds (forest canopy wind, stream, songbirds) for clean air
// and low-frequency atmospheric industrial drones for polluted air.
// 100% client-side Web Audio API — zero external mp3/wav 404 dependencies.

export type SoundscapePreset = 'auto' | 'forest' | 'meadow' | 'haze' | 'industrial';

export interface SoundscapeState {
  isPlaying: boolean;
  volume: number; // 0 to 1
  preset: SoundscapePreset;
  currentAqi: number;
  activeProfileName: string;
  activeProfileDescription: string;
}

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

// Nature sound nodes
let natureWindSource: AudioBufferSourceNode | null = null;
let natureWindFilter: BiquadFilterNode | null = null;
let natureWindGain: GainNode | null = null;

let streamSource: AudioBufferSourceNode | null = null;
let streamFilter: BiquadFilterNode | null = null;
let streamGain: GainNode | null = null;

let harmonicChordsGain: GainNode | null = null;
let harmonicOsc1: OscillatorNode | null = null;
let harmonicOsc2: OscillatorNode | null = null;

// Birdsong timer
let birdTimer: ReturnType<typeof setTimeout> | null = null;

// Industrial / Smog hum nodes
let industrialGain: GainNode | null = null;
let humOsc1: OscillatorNode | null = null;
let humOsc2: OscillatorNode | null = null;
let industrialNoiseSource: AudioBufferSourceNode | null = null;
let industrialFilter: BiquadFilterNode | null = null;

// Internal state
let isPlaying = false;
let currentVolume = 0.45;
let currentPreset: SoundscapePreset = 'auto';
let currentAqi = 45;

const listeners = new Set<(state: SoundscapeState) => void>();

function notifyListeners(): void {
  const state = getSoundscapeState();
  listeners.forEach((cb) => cb(state));
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Generate pink noise buffer for organic wind turbulence
function createPinkNoiseBuffer(ctx: AudioContext, durationSec = 3): AudioBuffer {
  const bufferSize = ctx.sampleRate * durationSec;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
    b6 = white * 0.115926;
  }
  return buffer;
}

// Generate filtered white noise buffer for water trickles
function createWhiteNoiseBuffer(ctx: AudioContext, durationSec = 2): AudioBuffer {
  const bufferSize = ctx.sampleRate * durationSec;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.03;
  }
  return buffer;
}

// Synthesize a single organic bird tweet or song phrase
function playBirdTweet(ctx: AudioContext, destination: GainNode): void {
  if (!isPlaying) return;

  const effectiveTier = getEffectiveTier();
  if (effectiveTier > 2) return; // No birds in severe smog

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    // Randomize birdsong melodic motif
    const motifs = [
      [2800, 3400, 2900, 3600],
      [3200, 2600, 3800],
      [2400, 3100, 2700, 3300, 2900],
      [3600, 3100, 3900],
    ];
    const motif = motifs[Math.floor(Math.random() * motifs.length)];
    const noteDuration = 0.07 + Math.random() * 0.05;

    let noteTime = now;
    osc.frequency.setValueAtTime(motif[0], noteTime);

    for (let i = 1; i < motif.length; i++) {
      noteTime += noteDuration;
      osc.frequency.exponentialRampToValueAtTime(motif[i], noteTime);
    }

    const totalDuration = noteDuration * motif.length;

    // Smooth bell-like envelope
    const maxGain = 0.025 + Math.random() * 0.02;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(maxGain, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + totalDuration + 0.05);
  } catch {
    // Ignore audio error
  }
}

function scheduleNextBirdsong(): void {
  if (birdTimer) clearTimeout(birdTimer);
  if (!isPlaying) return;

  const effectiveTier = getEffectiveTier();
  if (effectiveTier > 2) return; // No birds in smoggy air

  // Interval between songs: 3.5s to 8s in clean air, 7s to 14s in moderate
  const minInterval = effectiveTier === 1 ? 3500 : 7000;
  const maxInterval = effectiveTier === 1 ? 8500 : 14000;
  const delay = minInterval + Math.random() * (maxInterval - minInterval);

  birdTimer = setTimeout(() => {
    if (isPlaying && audioCtx && masterGain) {
      playBirdTweet(audioCtx, masterGain);
      scheduleNextBirdsong();
    }
  }, delay);
}

// Map AQI to Tier (1 = Clean, 2 = Moderate, 3 = Sensitive/Poor, 4 = Severe/Hazardous)
function getEffectiveTier(): number {
  if (currentPreset === 'forest') return 1;
  if (currentPreset === 'meadow') return 2;
  if (currentPreset === 'haze') return 3;
  if (currentPreset === 'industrial') return 4;

  // Auto preset based on real-time AQI
  if (currentAqi <= 50) return 1; // Clean
  if (currentAqi <= 100) return 2; // Moderate
  if (currentAqi <= 175) return 3; // Unhealthy
  return 4; // Very Unhealthy / Severe
}

export function getSoundscapeProfileInfo(): { name: string; description: string } {
  const tier = getEffectiveTier();
  switch (tier) {
    case 1:
      return {
        name: 'Forest Canopy & Songbirds',
        description: 'Lush woodland breeze, forest stream, and melodious songbirds reflecting pure clean air.',
      };
    case 2:
      return {
        name: 'Open Meadow Breeze',
        description: 'Gentle rustling winds and soft warm harmonics for moderate atmospheric balance.',
      };
    case 3:
      return {
        name: 'Suburban Haze & Muffled Wind',
        description: 'Dampened high frequencies with a low urban hum reflecting rising particulate concentration.',
      };
    case 4:
    default:
      return {
        name: 'Industrial Smog Drone',
        description: 'Low-frequency 55Hz electrical sub-bass hum and combustion resonance from severe pollution inversion.',
      };
  }
}

function updateCrossfadeGains(): void {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const tier = getEffectiveTier();

  // Tier 1: 100% nature, 0% industrial
  // Tier 2: 70% nature, 15% industrial
  // Tier 3: 25% nature, 75% industrial
  // Tier 4: 0% nature, 100% industrial
  let targetNatureGain = 0.05;
  let targetStreamGain = 0.035;
  let targetHarmonicGain = 0.02;
  let targetIndustrialGain = 0.0;

  if (tier === 1) {
    targetNatureGain = 0.06;
    targetStreamGain = 0.035;
    targetHarmonicGain = 0.02;
    targetIndustrialGain = 0.0;
  } else if (tier === 2) {
    targetNatureGain = 0.045;
    targetStreamGain = 0.015;
    targetHarmonicGain = 0.015;
    targetIndustrialGain = 0.015;
  } else if (tier === 3) {
    targetNatureGain = 0.015;
    targetStreamGain = 0.0;
    targetHarmonicGain = 0.005;
    targetIndustrialGain = 0.05;
  } else {
    // Severe / Industrial
    targetNatureGain = 0.0;
    targetStreamGain = 0.0;
    targetHarmonicGain = 0.0;
    targetIndustrialGain = 0.08;
  }

  if (natureWindGain) natureWindGain.gain.setTargetAtTime(targetNatureGain, now, 1.5);
  if (streamGain) streamGain.gain.setTargetAtTime(targetStreamGain, now, 1.5);
  if (harmonicChordsGain) harmonicChordsGain.gain.setTargetAtTime(targetHarmonicGain, now, 1.5);
  if (industrialGain) industrialGain.gain.setTargetAtTime(targetIndustrialGain, now, 1.5);

  // Filter shifts
  if (natureWindFilter) {
    const windFreq = tier === 1 ? 520 : tier === 2 ? 380 : 220;
    natureWindFilter.frequency.setTargetAtTime(windFreq, now, 2.0);
  }

  if (industrialFilter) {
    const indFreq = tier === 4 ? 140 : 110;
    industrialFilter.frequency.setTargetAtTime(indFreq, now, 2.0);
  }
}

export function startSoundscape(): boolean {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  if (isPlaying) return true;

  try {
    const now = ctx.currentTime;

    // Master Gain
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(currentVolume, now + 1.2);
    masterGain.connect(ctx.destination);

    // 1. Nature Wind (Pink noise loop)
    const pinkBuffer = createPinkNoiseBuffer(ctx, 3);
    natureWindSource = ctx.createBufferSource();
    natureWindSource.buffer = pinkBuffer;
    natureWindSource.loop = true;

    natureWindFilter = ctx.createBiquadFilter();
    natureWindFilter.type = 'lowpass';
    natureWindFilter.frequency.setValueAtTime(450, now);
    natureWindFilter.Q.setValueAtTime(1.5, now);

    natureWindGain = ctx.createGain();
    natureWindGain.gain.setValueAtTime(0.04, now);

    natureWindSource.connect(natureWindFilter);
    natureWindFilter.connect(natureWindGain);
    natureWindGain.connect(masterGain);
    natureWindSource.start(0);

    // 2. Forest Stream Trickles (Bandpass white noise loop)
    const whiteBuffer = createWhiteNoiseBuffer(ctx, 2.5);
    streamSource = ctx.createBufferSource();
    streamSource.buffer = whiteBuffer;
    streamSource.loop = true;

    streamFilter = ctx.createBiquadFilter();
    streamFilter.type = 'bandpass';
    streamFilter.frequency.setValueAtTime(1600, now);
    streamFilter.Q.setValueAtTime(3.0, now);

    streamGain = ctx.createGain();
    streamGain.gain.setValueAtTime(0.02, now);

    streamSource.connect(streamFilter);
    streamFilter.connect(streamGain);
    streamGain.connect(masterGain);
    streamSource.start(0);

    // 3. Gentle Harmonic Nature Drone (432Hz / 216Hz warm fifth)
    harmonicChordsGain = ctx.createGain();
    harmonicChordsGain.gain.setValueAtTime(0.015, now);

    harmonicOsc1 = ctx.createOscillator();
    harmonicOsc1.type = 'sine';
    harmonicOsc1.frequency.setValueAtTime(216, now); // Warm A low

    harmonicOsc2 = ctx.createOscillator();
    harmonicOsc2.type = 'triangle';
    harmonicOsc2.frequency.setValueAtTime(324, now); // Pure fifth

    harmonicOsc1.connect(harmonicChordsGain);
    harmonicOsc2.connect(harmonicChordsGain);
    harmonicChordsGain.connect(masterGain);

    harmonicOsc1.start();
    harmonicOsc2.start();

    // 4. Industrial / Smog Hum (55Hz / 110Hz + brown noise low rumble)
    industrialGain = ctx.createGain();
    industrialGain.gain.setValueAtTime(0.0, now);

    humOsc1 = ctx.createOscillator();
    humOsc1.type = 'sawtooth';
    humOsc1.frequency.setValueAtTime(55, now); // Low industrial transformer frequency

    humOsc2 = ctx.createOscillator();
    humOsc2.type = 'sine';
    humOsc2.frequency.setValueAtTime(56.2, now); // 1.2Hz binaural pulsation

    const industrialHumFilter = ctx.createBiquadFilter();
    industrialHumFilter.type = 'lowpass';
    industrialHumFilter.frequency.setValueAtTime(120, now);

    humOsc1.connect(industrialHumFilter);
    humOsc2.connect(industrialHumFilter);

    // Deep low brown noise rumble
    const brownBuffer = createPinkNoiseBuffer(ctx, 4);
    industrialNoiseSource = ctx.createBufferSource();
    industrialNoiseSource.buffer = brownBuffer;
    industrialNoiseSource.loop = true;

    industrialFilter = ctx.createBiquadFilter();
    industrialFilter.type = 'lowpass';
    industrialFilter.frequency.setValueAtTime(100, now);

    industrialNoiseSource.connect(industrialFilter);
    industrialFilter.connect(industrialHumFilter);

    industrialHumFilter.connect(industrialGain);
    industrialGain.connect(masterGain);

    humOsc1.start();
    humOsc2.start();
    industrialNoiseSource.start(0);

    isPlaying = true;
    updateCrossfadeGains();
    scheduleNextBirdsong();
    notifyListeners();
    return true;
  } catch (err) {
    console.error('Failed to start ambient soundscape:', err);
    return false;
  }
}

export function stopSoundscape(): void {
  if (!isPlaying) return;

  if (birdTimer) {
    clearTimeout(birdTimer);
    birdTimer = null;
  }

  if (audioCtx && masterGain) {
    const now = audioCtx.currentTime;
    masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    setTimeout(() => {
      try {
        natureWindSource?.stop();
        streamSource?.stop();
        harmonicOsc1?.stop();
        harmonicOsc2?.stop();
        humOsc1?.stop();
        humOsc2?.stop();
        industrialNoiseSource?.stop();

        natureWindSource?.disconnect();
        streamSource?.disconnect();
        harmonicOsc1?.disconnect();
        harmonicOsc2?.disconnect();
        humOsc1?.disconnect();
        humOsc2?.disconnect();
        industrialNoiseSource?.disconnect();

        natureWindSource = null;
        streamSource = null;
        harmonicOsc1 = null;
        harmonicOsc2 = null;
        humOsc1 = null;
        humOsc2 = null;
        industrialNoiseSource = null;
      } catch {
        // Safe disconnect
      }
    }, 700);
  }

  isPlaying = false;
  notifyListeners();
}

export function toggleSoundscape(): boolean {
  if (isPlaying) {
    stopSoundscape();
    return false;
  } else {
    return startSoundscape();
  }
}

export function setSoundscapeVolume(vol: number): void {
  currentVolume = Math.max(0, Math.min(1, vol));
  if (audioCtx && masterGain && isPlaying) {
    masterGain.gain.setTargetAtTime(currentVolume, audioCtx.currentTime, 0.1);
  }
  notifyListeners();
}

export function setSoundscapePreset(preset: SoundscapePreset): void {
  currentPreset = preset;
  if (isPlaying) {
    updateCrossfadeGains();
  }
  notifyListeners();
}

export function updateSoundscapeAqi(aqi: number): void {
  currentAqi = Math.max(0, aqi);
  if (isPlaying && currentPreset === 'auto') {
    updateCrossfadeGains();
  }
  notifyListeners();
}

export function getSoundscapeState(): SoundscapeState {
  const profile = getSoundscapeProfileInfo();
  return {
    isPlaying,
    volume: currentVolume,
    preset: currentPreset,
    currentAqi,
    activeProfileName: profile.name,
    activeProfileDescription: profile.description,
  };
}

export function subscribeSoundscape(cb: (state: SoundscapeState) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
