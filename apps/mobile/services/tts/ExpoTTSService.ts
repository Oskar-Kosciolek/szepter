import * as Speech from 'expo-speech'
import { TTSService, TTSOptions } from './TTSService'
import { useSettingsStore } from '../../store/settingsStore'

export class ExpoTTSService implements TTSService {
  async speak(text: string, options?: TTSOptions): Promise<void> {
    const voice = useSettingsStore.getState().voice

    if (voice.ttsSilentMode) return

    Speech.stop()

    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        language: options?.language ?? 'pl-PL',
        rate: options?.rate ?? voice.ttsRate,
        pitch: options?.pitch ?? voice.ttsPitch,
        voice: options?.voice ?? (options?.language ? undefined : voice.ttsVoice),
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
