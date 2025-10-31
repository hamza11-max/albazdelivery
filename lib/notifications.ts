interface WindowWithWebkit extends Window {
  AudioContext?: typeof AudioContext
  webkitAudioContext?: typeof AudioContext
}

export const playNotificationSound = () => {
  const AudioClass = (window as WindowWithWebkit).AudioContext || (window as WindowWithWebkit).webkitAudioContext
  const audioContext = new (AudioClass as unknown as typeof AudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.value = 800
  oscillator.type = "sine"

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
}

export const playSuccessSound = () => {
  const AudioClass = (window as WindowWithWebkit).AudioContext || (window as WindowWithWebkit).webkitAudioContext
  const audioContext = new (AudioClass as unknown as typeof AudioContext)()
  const notes = [523.25, 659.25, 783.99] // C, E, G

  notes.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = freq
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + index * 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.3)

    oscillator.start(audioContext.currentTime + index * 0.1)
    oscillator.stop(audioContext.currentTime + index * 0.1 + 0.3)
  })
}
