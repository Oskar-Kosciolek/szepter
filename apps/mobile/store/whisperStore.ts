import { create } from 'zustand'
import { initWhisper, WhisperContext } from 'whisper.rn'
import { File, Paths } from 'expo-file-system'
import { Asset } from 'expo-asset'

type WhisperStore = {
  whisper: WhisperContext | null
  transcribing: boolean
  ready: boolean
  initModel: () => Promise<void>
startRealtime: () => Promise<((cb: (evt: any) => void) => void) | null>
  stopRealtime: () => Promise<string | null>
  _stopFn: (() => Promise<void>) | null
}

export const useWhisperStore = create<WhisperStore>((set, get) => ({
  whisper: null,
  transcribing: false,
  ready: false,
  _stopFn: null,

  initModel: async () => {
    if (get().whisper) return

    try {
      const modelFile = new File(Paths.document, 'ggml-small.bin')

      if (!modelFile.exists) {
        console.log('Kopiuję model...')
        const asset = Asset.fromModule(require('../assets/ggml-small.bin'))
        await asset.downloadAsync()
        const sourceFile = new File(asset.localUri!)
        sourceFile.copy(modelFile)
      }

      const ctx = await initWhisper({ filePath: modelFile.uri })
      set({ whisper: ctx, ready: true })
      console.log('Model gotowy!')
    } catch (e) {
      console.warn('Błąd ładowania modelu:', e)
      set({ ready: false })
    }
  },

  startRealtime: async () => {
    const { whisper } = get()
    if (!whisper) return null

    const result = await (whisper as any).transcribeRealtime({
        language: 'pl',
        realtimeAudioSec: 30,
        realtimeAudioSliceSec: 2,
    })

    set({ _stopFn: result.stop })
    return result.subscribe
    },

  stopRealtime: async () => {
    const { _stopFn } = get()
    if (!_stopFn) return null

    try {
      await _stopFn()
    } catch (e) {
      console.warn('Błąd zatrzymywania realtime:', e)
    } finally {
      set({ transcribing: false, _stopFn: null })
    }

    // Ostateczny wynik zbieramy przez onPartial w komponencie
    return null
  },
}))
