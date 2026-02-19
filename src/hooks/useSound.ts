import { useCallback, useRef } from 'react'
import { getSoundEnabled, getVibrationEnabled } from '../utils/shop'

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const playTone = useCallback((
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.15,
    delay = 0
  ) => {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + duration)
  }, [getCtx])

  const playNoise = useCallback((duration: number, volume = 0.1, delay = 0) => {
    const ctx = getCtx()
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 1.5
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)
    source.connect(filter).connect(gain).connect(ctx.destination)
    source.start(ctx.currentTime + delay)
    source.stop(ctx.currentTime + delay + duration)
  }, [getCtx])

  const play = useCallback((name: 'roll' | 'move' | 'capture' | 'win' | 'snake' | 'ladder') => {
    if (!getSoundEnabled()) {
      // Still allow vibration if enabled
      if (getVibrationEnabled() && typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (name) {
          case 'roll': navigator.vibrate(30); break
          case 'move': navigator.vibrate(15); break
          case 'capture': navigator.vibrate([20, 30, 20]); break
          case 'win': navigator.vibrate([50, 30, 50]); break
          case 'snake': navigator.vibrate([40, 20, 40, 20, 60]); break
          case 'ladder': navigator.vibrate([20, 10, 20, 10, 20]); break
        }
      }
      return
    }
    try {
      switch (name) {
        case 'roll':
          // Dice rattle: filtered noise bursts + landing thud
          for (let i = 0; i < 4; i++) {
            playNoise(0.04, 0.08, i * 0.045)
          }
          playTone(180, 0.12, 'triangle', 0.1, 0.2)
          playTone(120, 0.08, 'sine', 0.06, 0.25)
          break

        case 'move':
          // Token slide: soft pop
          playTone(520, 0.07, 'sine', 0.1)
          playTone(680, 0.05, 'sine', 0.04, 0.02)
          break

        case 'capture':
          // Capture: dramatic descending hit
          playTone(600, 0.12, 'sawtooth', 0.08)
          playTone(400, 0.15, 'square', 0.06, 0.08)
          playTone(800, 0.1, 'triangle', 0.1, 0.15)
          playNoise(0.08, 0.06, 0.05)
          break

        case 'win': {
          // Victory fanfare: ascending C major arpeggio
          const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
          notes.forEach((freq, i) => {
            playTone(freq, 0.35, 'sine', 0.12, i * 0.15)
            playTone(freq * 1.5, 0.25, 'triangle', 0.04, i * 0.15 + 0.05)
          })
          // Final chord
          playTone(1047, 0.5, 'sine', 0.1, 0.65)
          playTone(1319, 0.5, 'sine', 0.06, 0.65)
          playTone(1568, 0.5, 'triangle', 0.04, 0.65)
          break
        }

        case 'snake': {
          // Snake: descending chromatic slide
          const snakeFreqs = [600, 500, 400, 300, 200]
          snakeFreqs.forEach((freq, i) => {
            playTone(freq, 0.12, 'sawtooth', 0.07, i * 0.06)
          })
          break
        }

        case 'ladder': {
          // Ladder: ascending bright climb
          const ladderFreqs = [400, 500, 600, 700, 800]
          ladderFreqs.forEach((freq, i) => {
            playTone(freq, 0.1, 'triangle', 0.08, i * 0.06)
          })
          break
        }
      }
    } catch {
      // Silently fail if audio not available
    }

    // Vibration feedback
    if (getVibrationEnabled() && typeof navigator !== 'undefined' && navigator.vibrate) {
      switch (name) {
        case 'roll': navigator.vibrate(30); break
        case 'move': navigator.vibrate(15); break
        case 'capture': navigator.vibrate([20, 30, 20]); break
        case 'win': navigator.vibrate([50, 30, 50]); break
        case 'snake': navigator.vibrate([40, 20, 40, 20, 60]); break
        case 'ladder': navigator.vibrate([20, 10, 20, 10, 20]); break
      }
    }
  }, [playTone, playNoise])

  return { play }
}
