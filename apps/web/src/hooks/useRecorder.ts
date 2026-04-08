import { useRef, useState, useCallback } from 'react'

function getSupportedMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? ''
}

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType()
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch {
      setError('Brak dostępu do mikrofonu')
    }
  }, [])

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise(resolve => {
      const mr = mediaRecorderRef.current
      if (!mr) { resolve(null); return }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        mr.stream.getTracks().forEach(t => t.stop())
        mediaRecorderRef.current = null
        setRecording(false)
        resolve(blob)
      }
      mr.stop()
    })
  }, [])

  return { recording, error, start, stop }
}
