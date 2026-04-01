/**
 * @module WhisperWakeWordService
 * @description Implementacja WakeWordDetector. Dwustopniowa architektura:
 * 1. EnergyDetector (tani) filtruje ciszę
 * 2. whisper.rn transkrybuje lokalnie 2s okno audio
 * 3. Sprawdza podobieństwo do "szepter" (Levenshtein <= 2)
 * Whisper context inicjowany lazy przy pierwszym starcie.
 */

import { initWhisper, WhisperContext } from 'whisper.rn'
import { WakeWordDetector } from './WakeWordDetector.types'
import { EnergyDetector } from './EnergyDetector'

const WAKE_WORD = 'szepter'
const MODEL_PATH = require('../../../assets/ggml-small.bin')

/** Prosta odległość Levenshteina dla krótkich stringów. */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[m][n]
}

/** Sprawdza czy transkrypt zawiera wake word (tolerancja ±2 litery). */
function containsWakeWord(transcript: string): boolean {
  const words = transcript.toLowerCase().split(/\s+/)
  return words.some(word => levenshtein(word, WAKE_WORD) <= 2)
}

export class WhisperWakeWordService implements WakeWordDetector {
  onWakeWord: (() => void) | null = null

  private ctx: WhisperContext | null = null
  private energy = new EnergyDetector()
  private running = false

  async start(): Promise<void> {
    if (this.running) return
    this.running = true

    // Lazy init kontekstu Whispera
    if (!this.ctx) {
      this.ctx = await initWhisper({ filePath: MODEL_PATH })
    }

    this.energy.onEnergyDetected = (uri) => this.handleAudio(uri)
    await this.energy.start()
  }

  async stop(): Promise<void> {
    this.running = false
    await this.energy.stop()
    this.energy.onEnergyDetected = null
  }

  private async handleAudio(uri: string): Promise<void> {
    if (!this.ctx || !this.running) return

    try {
      const { promise } = this.ctx.transcribe(uri, {
        language: 'pl',
        maxLen: 1,      // jeden token — szybko
        noContext: true,
        singleSegment: true,
      })
      const { result } = await promise

      if (result && containsWakeWord(result)) {
        this.onWakeWord?.()
      }
    } catch (e) {
      console.warn('[WhisperWakeWordService] błąd transkrypcji:', e)
    }
  }
}
