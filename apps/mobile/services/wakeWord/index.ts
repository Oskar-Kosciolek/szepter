/**
 * @module wakeWord/index
 * @description Fabryka detektora wake word. Wzorzec Strategy.
 * Aktualnie: WhisperWakeWordService (energy+whisper lokalnie).
 */

import { WakeWordDetector, WakeWordStrategy } from './WakeWordDetector.types'
import { WhisperWakeWordService } from './WhisperWakeWordService'
import { GroqWakeWordService } from './GroqWakeWordService'

export function createWakeWordDetector(
  _strategy: WakeWordStrategy = 'energy+groq',
): WakeWordDetector {
  if ('energy+whisper' === _strategy) {
    return new WhisperWakeWordService()
  } else if ('energy+groq' === _strategy) {
    return new GroqWakeWordService()
  } else {
    throw new Error('Niepoprawny WakeWordDetector.')
  }
}

export type { WakeWordDetector, WakeWordStrategy } from './WakeWordDetector.types'
