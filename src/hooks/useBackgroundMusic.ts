import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'bg_music_muted'
const BPM = 126
const BEAT = 60 / BPM // ~0.476s

// Note frequencies
const N: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
  C6: 1046.50,
}

// Catchy pentatonic melody — 32 beats loop (~15s)
// Uses C major pentatonic (C D E G A) for always-pleasant sound
const MELODY: (number | 0)[] = [
  // Phrase A — rising playful line
  N.C5, N.E5, N.G5, N.A5, N.G5, N.E5, N.D5, N.C5,
  // Phrase B — higher energy call
  N.E5, N.G5, N.A5, N.C6, N.A5, N.G5, N.E5, 0,
  // Phrase C — bouncy answer
  N.G5, N.A5, N.G5, N.E5, N.D5, N.E5, N.G5, N.A5,
  // Phrase D — resolve back down
  N.G5, N.E5, N.D5, N.C5, N.D5, N.E5, N.C5, 0,
]

// Bass hits on beats 0, 4, 8, ... (every 4 beats = bar downbeats + mid)
const BASS_PATTERN: { beat: number; note: number }[] = [
  { beat: 0, note: N.C3 }, { beat: 2, note: N.G3 },
  { beat: 4, note: N.C3 }, { beat: 6, note: N.E3 },
  { beat: 8, note: N.A3 }, { beat: 10, note: N.E3 },
  { beat: 12, note: N.A3 }, { beat: 14, note: N.G3 },
  { beat: 16, note: N.F3 }, { beat: 18, note: N.C3 },
  { beat: 20, note: N.F3 }, { beat: 22, note: N.G3 },
  { beat: 24, note: N.G3 }, { beat: 26, note: N.D3 },
  { beat: 28, note: N.G3 }, { beat: 30, note: N.G3 },
]
const bassBeats = new Map(BASS_PATTERN.map(b => [b.beat, b.note]))

// Chord pads change per 8-beat phrase
const PADS = [
  [N.C4, N.E4, N.G4],  // C major
  [N.A3, N.C4, N.E4],  // A minor
  [N.F3, N.A3, N.C4],  // F major
  [N.G3, N.B3, N.D4],  // G major
]

export function useBackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const beatRef = useRef(0)
  const padOscsRef = useRef<OscillatorNode[]>([])
  const noiseBufferRef = useRef<AudioBuffer | null>(null)

  const getMuted = () => localStorage.getItem(STORAGE_KEY) === 'true'

  const ensureCtx = useCallback(() => {
    if (ctxRef.current) return ctxRef.current
    const ctx = new AudioContext()
    ctxRef.current = ctx
    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    masterRef.current = master
    // Pre-create noise buffer for hi-hats
    const len = Math.floor(ctx.sampleRate * 0.06)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    noiseBufferRef.current = buf
    return ctx
  }, [])

  // Marimba/xylophone pluck
  const pluck = useCallback((freq: number, time: number, vol: number, dur: number) => {
    const ctx = ctxRef.current, master = masterRef.current
    if (!ctx || !master) return
    // Main tone
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    // Harmonic overtone for brightness
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = freq * 2
    const g = ctx.createGain()
    const g2 = ctx.createGain()
    const filt = ctx.createBiquadFilter()
    filt.type = 'lowpass'
    filt.frequency.setValueAtTime(freq * 6, time)
    filt.frequency.exponentialRampToValueAtTime(freq * 2, time + dur * 0.5)
    filt.Q.value = 1.2
    // Envelope: fast attack, smooth decay
    g.gain.setValueAtTime(0.001, time)
    g.gain.linearRampToValueAtTime(vol, time + 0.008)
    g.gain.exponentialRampToValueAtTime(0.001, time + dur)
    g2.gain.setValueAtTime(0.001, time)
    g2.gain.linearRampToValueAtTime(vol * 0.25, time + 0.008)
    g2.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.6)
    osc.connect(filt)
    osc2.connect(g2)
    filt.connect(g)
    g.connect(master)
    g2.connect(master)
    osc.start(time)
    osc.stop(time + dur + 0.05)
    osc2.start(time)
    osc2.stop(time + dur + 0.05)
  }, [])

  // Bass thump
  const bass = useCallback((freq: number, time: number) => {
    const ctx = ctxRef.current, master = masterRef.current
    if (!ctx || !master) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const sub = ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.value = freq * 0.5
    const g = ctx.createGain()
    const gs = ctx.createGain()
    g.gain.setValueAtTime(0.001, time)
    g.gain.linearRampToValueAtTime(0.1, time + 0.015)
    g.gain.exponentialRampToValueAtTime(0.001, time + BEAT * 1.6)
    gs.gain.setValueAtTime(0.001, time)
    gs.gain.linearRampToValueAtTime(0.06, time + 0.015)
    gs.gain.exponentialRampToValueAtTime(0.001, time + BEAT * 1.2)
    osc.connect(g)
    sub.connect(gs)
    g.connect(master)
    gs.connect(master)
    osc.start(time)
    osc.stop(time + BEAT * 2)
    sub.start(time)
    sub.stop(time + BEAT * 2)
  }, [])

  // Kick drum
  const kick = useCallback((time: number) => {
    const ctx = ctxRef.current, master = masterRef.current
    if (!ctx || !master) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(160, time)
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.1)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.18, time)
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
    osc.connect(g)
    g.connect(master)
    osc.start(time)
    osc.stop(time + 0.25)
  }, [])

  // Hi-hat (noise burst)
  const hat = useCallback((time: number, open: boolean) => {
    const ctx = ctxRef.current, master = masterRef.current
    if (!ctx || !master || !noiseBufferRef.current) return
    const src = ctx.createBufferSource()
    src.buffer = noiseBufferRef.current
    const filt = ctx.createBiquadFilter()
    filt.type = 'highpass'
    filt.frequency.value = 9000
    const g = ctx.createGain()
    const vol = open ? 0.035 : 0.025
    const decay = open ? 0.08 : 0.04
    g.gain.setValueAtTime(vol, time)
    g.gain.exponentialRampToValueAtTime(0.001, time + decay)
    src.connect(filt)
    filt.connect(g)
    g.connect(master)
    src.start(time)
  }, [])

  // Start/update pad chords
  const updatePads = useCallback((chordIdx: number) => {
    const ctx = ctxRef.current, master = masterRef.current
    if (!ctx || !master) return
    const chord = PADS[chordIdx % PADS.length]
    const t = ctx.currentTime
    if (padOscsRef.current.length === 0) {
      // Create pad oscillators
      chord.forEach(freq => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq
        osc.detune.value = (Math.random() - 0.5) * 8
        const g = ctx.createGain()
        g.gain.value = 0.02
        osc.connect(g)
        g.connect(master)
        osc.start()
        padOscsRef.current.push(osc)
      })
    } else {
      padOscsRef.current.forEach((osc, i) => {
        if (chord[i]) osc.frequency.exponentialRampToValueAtTime(chord[i], t + 0.4)
      })
    }
  }, [])

  const tick = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const b = beatRef.current
    const t = ctx.currentTime + 0.04 // lookahead

    // Melody note
    const note = MELODY[b % MELODY.length]
    if (note > 0) {
      pluck(note, t, 0.07, BEAT * 0.75)
    }

    // Bass
    const bassNote = bassBeats.get(b % 32)
    if (bassNote) bass(bassNote, t)

    // Drums: kick on 0,2 of each 4-beat bar, hat on every beat
    const inBar = b % 4
    if (inBar === 0) kick(t)
    if (inBar === 2) kick(t)
    hat(t, inBar === 1 || inBar === 3)

    // Pad chord change every 8 beats
    if (b % 8 === 0) updatePads(Math.floor(b / 8) % PADS.length)

    beatRef.current = (b + 1) % 32
  }, [pluck, bass, kick, hat, updatePads])

  const start = useCallback(() => {
    if (getMuted()) return
    const ctx = ensureCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const master = masterRef.current
    if (!master) return

    const t = ctx.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setValueAtTime(master.gain.value, t)
    master.gain.linearRampToValueAtTime(1, t + 1.2)

    beatRef.current = 0
    padOscsRef.current.forEach(o => { try { o.stop() } catch { /* */ } })
    padOscsRef.current = []

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(tick, BEAT * 1000)
    tick()

    setIsPlaying(true)
  }, [ensureCtx, tick])

  const stop = useCallback(() => {
    const master = masterRef.current
    const ctx = ctxRef.current
    if (!master || !ctx) return
    const t = ctx.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setValueAtTime(master.gain.value, t)
    master.gain.linearRampToValueAtTime(0, t + 0.8)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop()
      localStorage.setItem(STORAGE_KEY, 'true')
    } else {
      localStorage.setItem(STORAGE_KEY, 'false')
      start()
    }
  }, [isPlaying, start, stop])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      padOscsRef.current.forEach(o => { try { o.stop() } catch { /* */ } })
      ctxRef.current?.close().catch(() => { /* */ })
    }
  }, [])

  return { isPlaying, toggle, start, stop }
}
