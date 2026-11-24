/** Tiny WebAudio synth — no audio files. Silent unless enabled from the sound toggle. */
type Cue = 'blip' | 'select' | 'confirm' | 'deny' | 'alarm' | 'hit' | 'heavy' | 'heal' | 'whoosh' | 'win' | 'lose'

let enabled = false
let ctx: AudioContext | null = null

export const setSfxEnabled = (on: boolean) => {
  enabled = on
}

function ac() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', gain = 0.06, at = 0, slideTo?: number) {
  const a = ac()
  const t = a.currentTime + at
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function noise(dur: number, gain = 0.08, at = 0) {
  const a = ac()
  const t = a.currentTime + at
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const src = a.createBufferSource()
  const g = a.createGain()
  src.buffer = buf
  g.gain.value = gain
  src.connect(g).connect(a.destination)
  src.start(t)
}

export function sfx(cue: Cue) {
  if (!enabled || typeof window === 'undefined') return
  try {
    switch (cue) {
      case 'blip': return tone(880, 0.05)
      case 'select': tone(660, 0.05); return tone(990, 0.06, 'square', 0.05, 0.05)
      case 'confirm': tone(523, 0.07); tone(784, 0.1, 'square', 0.05, 0.07); return
      case 'deny': return tone(180, 0.15, 'sawtooth', 0.05)
      case 'alarm': tone(740, 0.12, 'sawtooth', 0.05); tone(554, 0.12, 'sawtooth', 0.05, 0.14); return
      case 'hit': noise(0.08, 0.1); return tone(160, 0.08, 'square', 0.06, 0, 60)
      case 'heavy': noise(0.25, 0.14); return tone(110, 0.3, 'sawtooth', 0.08, 0, 40)
      case 'heal': tone(523, 0.08, 'triangle', 0.06); tone(659, 0.08, 'triangle', 0.06, 0.08); return tone(784, 0.12, 'triangle', 0.06, 0.16)
      case 'whoosh': return noise(0.6, 0.05)
      case 'win': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'square', 0.05, i * 0.11)); return
      case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, 0.18, 'sawtooth', 0.05, i * 0.14)); return
    }
  } catch {
    /* audio unavailable — ignore */
  }
}
