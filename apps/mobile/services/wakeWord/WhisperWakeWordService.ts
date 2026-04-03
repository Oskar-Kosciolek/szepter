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
import { containsWakeWord } from '../../utils/fuzzyMatch'

const MODEL_PATH = require('../../assets/ggml-small.bin')

export class WhisperWakeWordService implements WakeWordDetector {
  onWakeWord: (() => void) | null = null

  private ctx: WhisperContext | null = null
  private energy = new EnergyDetector()
  private running = false
  private isTranscribing = false

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
    if (this.isTranscribing) return

    this.isTranscribing = true

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
    } finally {
      this.isTranscribing = false
    }
  }
}
