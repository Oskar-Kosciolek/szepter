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
import { containsWakeWord } from '../../utils/fuzzyMatch'

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
