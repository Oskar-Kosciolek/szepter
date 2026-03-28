import * as Speech from 'expo-speech'
import { TTSService, TTSOptions } from './TTSService'

export class ExpoTTSService implements TTSService {
  async speak(text: string, options?: TTSOptions): Promise<void> {
    // Zatrzymaj poprzednie odczytywanie jeśli trwa
    Speech.stop()

    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        language: options?.language ?? 'pl-PL',
        rate: options?.rate ?? 0.9,
        pitch: options?.pitch ?? 1.0,
        onDone: resolve,
        onError: reject,
      })
    })
  }

  stop(): void {
    Speech.stop()
  }

  async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync()
  }
}