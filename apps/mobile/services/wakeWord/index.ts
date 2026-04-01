/**
 * @module wakeWord/index
 * @description Fabryka detektora wake word. Wzorzec Strategy.
 * Aktualnie: WhisperWakeWordService (energy+whisper lokalnie).
 */

import { WakeWordDetector, WakeWordStrategy } from './WakeWordDetector.types'
import { WhisperWakeWordService } from './WhisperWakeWordService'

export function createWakeWordDetector(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _strategy: WakeWordStrategy = 'energy+whisper',
): WakeWordDetector {
  return new WhisperWakeWordService()
}

export type { WakeWordDetector, WakeWordStrategy } from './WakeWordDetector.types'
