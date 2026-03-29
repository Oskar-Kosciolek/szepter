import { useState } from 'react'
import { useAudioRecorder, RecordingPresets, setAudioModeAsync } from 'expo-audio'

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)

  const startRecording = async () => {
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
    await recorder.prepareToRecordAsync()
    recorder.record()
    setIsRecording(true)
  }

  const stopRecording = async (): Promise<string | null> => {
    await recorder.stop()
    setIsRecording(false)
    return recorder.uri ?? null
  }

  return { startRecording, stopRecording, isRecording }
}
