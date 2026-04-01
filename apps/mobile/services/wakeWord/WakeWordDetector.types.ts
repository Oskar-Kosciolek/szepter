/**
 * @module WakeWordDetector.types
 * @description Interfejs detektora wake word. Wzorzec Strategy —
 * aktualna implementacja: WhisperWakeWordService (energy+whisper).
 * Rozszerzalne o np. cloud-based detection w przyszłości.
 */

export interface WakeWordDetector {
  /** Uruchamia nasłuch. */
  start(): Promise<void>
  /** Zatrzymuje nasłuch i zwalnia zasoby audio. */
  stop(): Promise<void>
  /** Callback wywoływany gdy wykryto wake word. */
  onWakeWord: (() => void) | null
}

/** Strategia detekcji wake word. Rozszerzalne. */
export type WakeWordStrategy = 'energy+whisper'
