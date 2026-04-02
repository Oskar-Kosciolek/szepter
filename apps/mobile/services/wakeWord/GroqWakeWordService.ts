/**
 * @module GroqWakeWordService
 * @description Implementacja WakeWordDetector. Dwustopniowa architektura:
 * 1. EnergyDetector filtruje ciszę
 * 2. GroqTranscriptionService transkrybuje audio
 * 3. Sprawdza podobieństwo do "szepter" (Levenshtein <= 2)
 */

import { WakeWordDetector } from './WakeWordDetector.types'
import { EnergyDetector } from './EnergyDetector'
import { transcriptionService } from '../transcription'

const WAKE_WORD = 'szepter'

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

export class GroqWakeWordService implements WakeWordDetector {
  private transcriptionService = transcriptionService

  onWakeWord: (() => void) | null = null

  private energy = new EnergyDetector()
  private running = false
  private isTranscribing = false

  async start(): Promise<void> {
    if (this.running) return
    this.running = true

    this.energy.onEnergyDetected = (uri) => this.handleAudio(uri)
    await this.energy.start()
  }

  async stop(): Promise<void> {
    this.running = false
    await this.energy.stop()
    this.energy.onEnergyDetected = null
  }

  private async handleAudio(uri: string): Promise<void | null> {
    if (!this.running) return
    if (this.isTranscribing) return

    this.isTranscribing = true

    try {
      const result = await this.transcriptionService.transcribe(uri)
        if (result.error) {
          console.warn('Błąd transkrypcji:', result.error)
          return null
        }
        console.log('transkrypt:', result.text)

      if (result && containsWakeWord(result.text)) {
        this.onWakeWord?.()
      }
    } catch (e) {
      console.warn('[GroqWakeWordService] błąd transkrypcji:', e)
    } finally {
      this.isTranscribing = false
    }
  }
}
