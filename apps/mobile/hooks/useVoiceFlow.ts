import { useState, useRef } from 'react'
import * as Haptics from 'expo-haptics'
import { useRecorder } from './useRecorder'
import { useCommand } from './useCommand'
import { useWhisperStore } from '../store/whisperStore'
import { useRecordingsStore } from '../store/recordingsStore'
import { getErrorMessage } from '../utils/errors'

export function useVoiceFlow() {
  const [status, setStatus] = useState('Naciśnij aby mówić')
  const { startRecording, stopRecording, isRecording } = useRecorder()
  const { executeCommand } = useCommand()
  const { transcribing, transcribe } = useWhisperStore()
  const { addRecording } = useRecordingsStore()
  const startTimeRef = useRef<number>(0)
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startAutoRecording = async () => {
    if (isRecording) return
    await startRecording()
    startTimeRef.current = Date.now()
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setStatus('Słucham...')

    autoStopTimer.current = setTimeout(async () => {
      autoStopTimer.current = null
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      const uri = await stopRecording()
      const duration = (Date.now() - startTimeRef.current) / 1000
      setStatus('Przetwarzam...')

      if (!uri) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setStatus('Błąd nagrywania.')
        setTimeout(() => setStatus('Naciśnij aby mówić'), 2000)
        return
      }

      try {
        const transcript = await transcribe(uri)

        if (transcript?.trim()) {
          setStatus(`"${transcript}"`)
          const result = await executeCommand(transcript)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

          await addRecording({
            transcript: transcript.trim(),
            command_type: null,
            command_payload: null,
            duration_seconds: Math.round(duration * 10) / 10,
          })

          setStatus(result)
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          setStatus('Nie rozpoznano. Spróbuj ponownie.')
        }
      } catch (err) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setStatus(getErrorMessage(err))
      }

      setTimeout(() => setStatus('Naciśnij aby mówić'), 3000)
    }, 5000)
  }

  const handlePress = async () => {
    if (!isRecording) {
      await startRecording()
      startTimeRef.current = Date.now()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setStatus('Słucham...')
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      const uri = await stopRecording()
      const duration = (Date.now() - startTimeRef.current) / 1000
      setStatus('Przetwarzam...')

      if (!uri) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setStatus('Błąd nagrywania.')
        setTimeout(() => setStatus('Naciśnij aby mówić'), 2000)
        return
      }

      try {
        const transcript = await transcribe(uri)

        if (transcript?.trim()) {
          setStatus(`"${transcript}"`)
          const result = await executeCommand(transcript)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

          await addRecording({
            transcript: transcript.trim(),
            command_type: null,
            command_payload: null,
            duration_seconds: Math.round(duration * 10) / 10,
          })

          setStatus(result)
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          setStatus('Nie rozpoznano. Spróbuj ponownie.')
        }
      } catch (err) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setStatus(getErrorMessage(err))
      }

      setTimeout(() => setStatus('Naciśnij aby mówić'), 3000)
    }
  }

  return { handlePress, startAutoRecording, listening: isRecording, status, transcribing }
}
