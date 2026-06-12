// Lightweight client-side check that a video's audio matches an uploaded audio file.
// Uses Web Audio decoding + downsampled normalized cross-correlation.

const TARGET_RATE = 4000; // Hz, downsampled mono
const MAX_SECONDS = 30;   // analyze up to first 30s for speed

async function decodeMono(file: File): Promise<{ data: Float32Array; sampleRate: number; duration: number }> {
  const buf = await file.arrayBuffer();
  const Ctx: typeof AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
  const ctx = new Ctx();
  try {
    const audioBuf = await ctx.decodeAudioData(buf.slice(0));
    const ch0 = audioBuf.getChannelData(0);
    let mono: Float32Array;
    if (audioBuf.numberOfChannels > 1) {
      const ch1 = audioBuf.getChannelData(1);
      mono = new Float32Array(ch0.length);
      for (let i = 0; i < ch0.length; i++) mono[i] = (ch0[i] + ch1[i]) / 2;
    } else {
      mono = new Float32Array(ch0);
    }
    return { data: mono, sampleRate: audioBuf.sampleRate, duration: audioBuf.duration };
  } finally {
    try { await ctx.close(); } catch {}
  }
}

function downsample(data: Float32Array, fromRate: number, toRate: number, maxSamples: number): Float32Array {
  const ratio = fromRate / toRate;
  const length = Math.min(Math.floor(data.length / ratio), maxSamples);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(data.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += Math.abs(data[j]);
    out[i] = sum / Math.max(1, end - start);
  }
  // Normalize
  let max = 0;
  for (let i = 0; i < out.length; i++) if (out[i] > max) max = out[i];
  if (max > 0) for (let i = 0; i < out.length; i++) out[i] /= max;
  return out;
}

function correlate(a: Float32Array, b: Float32Array, maxLagFrac = 0.1): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  const maxLag = Math.floor(n * maxLagFrac);
  let best = -1;
  // Try a few lags to allow small alignment drift between encodings
  for (let lag = -maxLag; lag <= maxLag; lag += Math.max(1, Math.floor(maxLag / 8))) {
    let sum = 0, na = 0, nb = 0;
    for (let i = 0; i < n; i++) {
      const ai = a[i];
      const bj = b[i + lag];
      if (bj === undefined) continue;
      sum += ai * bj;
      na += ai * ai;
      nb += bj * bj;
    }
    const denom = Math.sqrt(na * nb);
    const r = denom > 0 ? sum / denom : 0;
    if (r > best) best = r;
  }
  return best;
}

export interface MatchResult {
  match: boolean;
  similarity: number;
  audioDuration: number;
  videoAudioDuration: number;
  reason?: string;
}

export async function audioMatchesVideo(audioFile: File, videoFile: File): Promise<MatchResult> {
  let audio, video;
  try {
    audio = await decodeMono(audioFile);
  } catch {
    return { match: false, similarity: 0, audioDuration: 0, videoAudioDuration: 0, reason: "Could not decode audio file." };
  }
  try {
    video = await decodeMono(videoFile);
  } catch {
    return { match: false, similarity: 0, audioDuration: audio.duration, videoAudioDuration: 0, reason: "Video has no readable audio track." };
  }

  // Duration check (within 1s or 2%)
  const tol = Math.max(1, audio.duration * 0.02);
  if (Math.abs(audio.duration - video.duration) > tol) {
    return {
      match: false,
      similarity: 0,
      audioDuration: audio.duration,
      videoAudioDuration: video.duration,
      reason: `Durations don't match (audio ${audio.duration.toFixed(1)}s vs video ${video.duration.toFixed(1)}s).`,
    };
  }

  const maxSamples = TARGET_RATE * MAX_SECONDS;
  const a = downsample(audio.data, audio.sampleRate, TARGET_RATE, maxSamples);
  const b = downsample(video.data, video.sampleRate, TARGET_RATE, maxSamples);
  const sim = correlate(a, b);

  return {
    match: sim >= 0.7,
    similarity: sim,
    audioDuration: audio.duration,
    videoAudioDuration: video.duration,
    reason: sim >= 0.7 ? undefined : `Audio in video doesn't match the uploaded track (similarity ${(sim * 100).toFixed(0)}%).`,
  };
}
