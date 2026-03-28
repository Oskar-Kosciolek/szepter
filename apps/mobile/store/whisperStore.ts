import { create } from 'zustand'
import { initWhisper, WhisperContext } from 'whisper.rn'
import * as FileSystem from 'expo-file-system'
import { Asset } from 'expo-asset'

type WhisperStore = {
  whisper: WhisperContext | null
  transcribing: boolean
  ready: boolean
  initModel: () => Promise<void>
  transcribe: (uri: string) => Promise<string | null>
}

export const useWhisperStore = create<WhisperStore>((set, get) => ({
  whisper: null,
  transcribing: false,
  ready: false,

  initModel: async () => {
    if (get().whisper) return

    try {
      const modelPath = `${FileSystem.documentDirectory}ggml-small.bin`
      const fileInfo = await FileSystem.getInfoAsync(modelPath)

      if (!fileInfo.exists) {
        console.log('Kopiuję model...')
        const asset = Asset.fromModule(require('../assets/ggml-small.bin'))
        await asset.downloadAsync()
        await FileSystem.copyAsync({
          from: asset.localUri!,
          to: modelPath,
        })
      }

      const ctx = await initWhisper({ filePath: modelPath })
      set({ whisper: ctx, ready: true })
      console.log('Model gotowy!')
    } catch (e) {
      console.warn('Błąd ładowania modelu:', e)
      set({ ready: false })
    }
  },

  transcribe: async (uri: string) => {
    const { whisper } = get()
    if (!whisper) return null

    set({ transcribing: true })
    try {
      const { result } = await whisper.transcribe(uri, { language: 'pl' })
      return result
    } catch (e) {
      console.warn('Błąd transkrypcji:', e)
      return null
    } finally {
      set({ transcribing: false })
    }
  },
}))