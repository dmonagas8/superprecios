let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      ctx = new AC()
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export function tick(freq = 900) {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'square'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.12, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.06)
}

export function fanfare() {
  const c = getCtx()
  if (!c) return
  const notas = [523.25, 659.25, 783.99, 1046.5]
  notas.forEach((freq, i) => {
    const inicio = c.currentTime + i * 0.11
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, inicio)
    gain.gain.exponentialRampToValueAtTime(0.28, inicio + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.4)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(inicio)
    osc.stop(inicio + 0.45)
  })
}
