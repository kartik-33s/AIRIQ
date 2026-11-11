// Zero-dependency procedural Web Audio API synthesizer for the 3D Atmospheric Digital Twin
// Adheres strictly to Three.js audio directives: 100% procedural, zero external .mp3/.wav 404s.

let audioCtx: AudioContext | null = null;
let windGainNode: GainNode | null = null;
let windFilterNode: BiquadFilterNode | null = null;
let windSource: AudioBufferSourceNode | null = null;
let isMuted = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Generate pink/brownian noise buffer for procedural wind turbulence
function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds of seamless loop noise
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
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
    b6 = white * 0.115926;
  }

  return buffer;
}

export function initProceduralAudio(): void {
  const ctx = getAudioContext();
  if (!ctx || windSource) return;

  try {
    const noiseBuffer = createNoiseBuffer(ctx);
    windSource = ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    windFilterNode = ctx.createBiquadFilter();
    windFilterNode.type = 'lowpass';
    windFilterNode.frequency.setValueAtTime(320, ctx.currentTime);
    windFilterNode.Q.setValueAtTime(1.8, ctx.currentTime);

    windGainNode = ctx.createGain();
    windGainNode.gain.setValueAtTime(isMuted ? 0 : 0.04, ctx.currentTime);

    windSource.connect(windFilterNode);
    windFilterNode.connect(windGainNode);
    windGainNode.connect(ctx.destination);
    windSource.start(0);
  } catch {
    // Graceful fallback if audio context blocked
  }
}

export function setWindSoundSpeed(windSpeedKmH: number): void {
  if (!windFilterNode || !windGainNode || !audioCtx) return;
  const normalizedSpeed = Math.min(1.0, Math.max(0.05, windSpeedKmH / 50));
  const targetFreq = 180 + normalizedSpeed * 520;
  const targetGain = isMuted ? 0 : 0.02 + normalizedSpeed * 0.05;

  windFilterNode.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.5);
  windGainNode.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.5);
}

// Crisp dual-frequency telemetry ping when inspecting or switching sensors
export function playTelemetryChirp(highFreq = 1480): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(highFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(highFreq * 1.5, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Ignore audio error
  }
}

export function setAudioMuted(muted: boolean): boolean {
  isMuted = muted;
  const ctx = getAudioContext();
  if (ctx && windGainNode) {
    windGainNode.gain.setTargetAtTime(isMuted ? 0 : 0.04, ctx.currentTime, 0.1);
  }
  if (!muted && !windSource) {
    initProceduralAudio();
  }
  return isMuted;
}

export function getAudioMuted(): boolean {
  return isMuted;
}
