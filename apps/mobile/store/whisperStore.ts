import { create } from 'zustand'
import { Audio } from 'expo-av'
import { initWhisper, WhisperContext } from 'whisper.rn'

type WhisperStore = {
  whisper: WhisperContext | null
  recording: Audio.Recording | null
  transcribing: boolean
  ready: boolean
  initModel: () => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<string | null>
}

export const useWhisperStore = create<WhisperStore>((set, get) => ({
  whisper: null,
  recording: null,
  transcribing: false,
  ready: false,

  initModel: async () => {
    const { whisper } = get()
    if (whisper) return

    try {
        const ctx = await initWhisper({
        filePath: require('../assets/ggml-small.bin'),
        })
        set({ whisper: ctx, ready: true })
    } catch (e) {
        console.warn('Whisper model nie znaleziony:', e)
        set({ ready: false })
    }
    },

  startRecording: async () => {
    await Audio.requestPermissionsAsync()
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    })

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    )
    set({ recording })
  },

  stopRecording: async () => {
    const { recording, whisper } = get()
    if (!recording || !whisper) return null

    await recording.stopAndUnloadAsync()
    const uri = recording.getURI()
    set({ recording: null, transcribing: true })

    if (!uri) return null

    const { result } = await whisper.transcribe(uri, {
      language: 'pl',
    })

    set({ transcribing: false })
    return result
  },
}))