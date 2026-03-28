import { create } from 'zustand'
import { transcriptionService } from '../services/transcription'

type TranscriptionStore = {
  transcribing: boolean
  transcribe: (uri: string) => Promise<string | null>
}

export const useWhisperStore = create<TranscriptionStore>((set) => ({
  transcribing: false,

  transcribe: async (uri: string) => {
    set({ transcribing: true })
    try {
      const result = await transcriptionService.transcribe(uri)
      if (result.error) {
        console.warn('Błąd transkrypcji:', result.error)
        return null
      }
      console.log('transkrypt:', result.text)
      return result.text || null
    } finally {
      set({ transcribing: false })
    }
  },
}))