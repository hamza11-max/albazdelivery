import type { KdsColumnKey } from "./kitchen-kds-preferences"

type WindowWithWebkit = Window & {
  AudioContext?: typeof AudioContext
  webkitAudioContext?: typeof AudioContext
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  const W = window as WindowWithWebkit
  const C = W.AudioContext || W.webkitAudioContext
  if (!C) return null
  try {
    return new C()
  } catch {
    return null
  }
}

/** Short chime per column (different pitch). */
export function playKitchenColumnChime(column: KdsColumnKey): void {
  const audioContext = getCtx()
  if (!audioContext) return

  const freqByColumn: Record<KdsColumnKey, number> = {
    pending: 660,
    accepted: 520,
    preparing: 440,
    ready: 880,
  }
  const freq = freqByColumn[column]
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  oscillator.frequency.value = freq
  oscillator.type = "sine"
  gainNode.gain.setValueAtTime(0.22, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.18)
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.18)
}
