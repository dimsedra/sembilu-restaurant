/**
 * Plays a dual-tone brass kitchen alert chime using Web Audio API synthesis.
 * Gracefully ignores execution in headless/unsupported environments or when muted.
 *
 * @param muted Whether sound playback is currently muted.
 */
export function playKitchenBell(muted: boolean = false): void {
  if (muted) return

  try {
    const AudioCtxClass =
      (typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext)) ||
      (typeof globalThis !== "undefined" && ((globalThis as any).AudioContext || (globalThis as any).webkitAudioContext))

    if (!AudioCtxClass) {
      return
    }

    const ctx: AudioContext = new AudioCtxClass()
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {
        // Ignored if user hasn't interacted with document yet
      })
    }

    const now = ctx.currentTime

    // --- Fundamental Tone 1 (880Hz -> 440Hz) ---
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()

    osc1.type = "sine"
    osc1.frequency.setValueAtTime(880, now)
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.8)

    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + 0.8)

    // --- Harmonic Overtone 2 (1320Hz -> 660Hz) ---
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()

    osc2.type = "triangle"
    osc2.frequency.setValueAtTime(1320, now + 0.05)
    osc2.frequency.exponentialRampToValueAtTime(660, now + 0.65)

    gain2.gain.setValueAtTime(0.2, now + 0.05)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.start(now + 0.05)
    osc2.stop(now + 0.65)
  } catch (_err) {
    // Graceful fallback: audio autoplay restriction or audio context failure shouldn't crash UI
  }
}
