import * as Speech from 'expo-speech'
import { TTSService, TTSOptions } from './TTSService'

export class ExpoTTSService implements TTSService {
  async speak(text: string, options?: TTSOptions): Promise<void> {
  Speech.stop()

  return new Promise((resolve, reject) => {
    Speech.speak(text, {
      language: options?.language ?? 'pl-PL',
      rate: options?.rate ?? 0.9,
      pitch: options?.pitch ?? 1.0,
      voice: 'pl-pl-x-bmg-network', // ← zmień ten identifier żeby testować
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