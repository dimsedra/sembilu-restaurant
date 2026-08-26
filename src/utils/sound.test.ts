import { describe, it, expect, vi, afterEach } from "vitest"
import { playKitchenBell } from "./sound"

describe("sound utility", () => {
  const originalAudioContext = (globalThis as any).AudioContext
  const originalWebkitAudioContext = (globalThis as any).webkitAudioContext

  afterEach(() => {
    ;(globalThis as any).AudioContext = originalAudioContext
    ;(globalThis as any).webkitAudioContext = originalWebkitAudioContext
    vi.restoreAllMocks()
  })

  it("does not play or initialize audio if muted is true", () => {
    const mockConstructor = vi.fn()
    ;(globalThis as any).AudioContext = mockConstructor

    playKitchenBell(true)
    expect(mockConstructor).not.toHaveBeenCalled()
  })

  it("handles headless or unsupported AudioContext environments gracefully without error", () => {
    delete (globalThis as any).AudioContext
    delete (globalThis as any).webkitAudioContext

    expect(() => {
      playKitchenBell(false)
    }).not.toThrow()
  })

  it("creates oscillators and gain nodes to play dual-tone brass chime when AudioContext is present", () => {
    const startOsc = vi.fn()
    const stopOsc = vi.fn()
    const setValueAtTime = vi.fn()
    const exponentialRampToValueAtTime = vi.fn()
    const connectGain = vi.fn()
    const connectOsc = vi.fn()

    const mockOscillator = {
      type: "sine",
      frequency: {
        setValueAtTime,
        exponentialRampToValueAtTime,
      },
      connect: connectOsc,
      start: startOsc,
      stop: stopOsc,
    }

    const mockGain = {
      gain: {
        setValueAtTime,
        exponentialRampToValueAtTime,
      },
      connect: connectGain,
    }

    class MockAudioContext {
      currentTime = 10
      state = "running"
      destination = {}
      resume = vi.fn().mockResolvedValue(undefined)
      createOscillator = vi.fn().mockReturnValue(mockOscillator)
      createGain = vi.fn().mockReturnValue(mockGain)
    }

    let createdCtx: MockAudioContext | null = null
    ;(globalThis as any).AudioContext = vi.fn().mockImplementation(function (this: any) {
      createdCtx = new MockAudioContext()
      return createdCtx
    })

    playKitchenBell()

    expect(createdCtx).not.toBeNull()
    expect(createdCtx!.createOscillator).toHaveBeenCalledTimes(2)
    expect(createdCtx!.createGain).toHaveBeenCalledTimes(2)
    expect(startOsc).toHaveBeenCalledTimes(2)
    expect(stopOsc).toHaveBeenCalledTimes(2)
    expect(connectGain).toHaveBeenCalled()
  })
})
