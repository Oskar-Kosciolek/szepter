import { useState } from 'react'
import { useRecorder } from './useRecorder'
import { useCommand } from './useCommand'
import { useWhisperStore } from '../store/whisperStore'

export function useVoiceFlow() {
  const [status, setStatus] = useState('Naciśnij aby mówić')
  const { startRecording, stopRecording, isRecording } = useRecorder()
  const { executeCommand } = useCommand()
  const { transcribing, transcribe } = useWhisperStore()

  const handlePress = async () => {
    if (!isRecording) {
      await startRecording()
      setStatus('Słucham...')
    } else {
      const uri = await stopRecording()
      setStatus('Przetwarzam...')

      if (!uri) {
        setStatus('Błąd nagrywania.')
        setTimeout(() => setStatus('Naciśnij aby mówić'), 2000)
        return
      }

      const transcript = await transcribe(uri)

      if (transcript?.trim()) {
        setStatus(`"${transcript}"`)
        const result = await executeCommand(transcript)
        setStatus(result)
      } else {
        setStatus('Nie rozpoznano. Spróbuj ponownie.')
      }

      setTimeout(() => setStatus('Naciśnij aby mówić'), 3000)
    }
  }

  return { handlePress, listening: isRecording, status, transcribing }
}
