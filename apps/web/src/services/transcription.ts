const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'

export async function transcribeAudio(audioBlob: Blob, apiKey: string): Promise<string> {
  // Determine file extension from MIME type for Groq's file detection
  const ext = audioBlob.type.includes('mp4') ? 'm4a'
    : audioBlob.type.includes('ogg') ? 'ogg'
    : 'webm'

  const formData = new FormData()
  formData.append('file', audioBlob, `audio.${ext}`)
  formData.append('model', 'whisper-large-v3')
  formData.append('language', 'pl')
  formData.append('response_format', 'json')

  const response = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'Błąd transkrypcji Groq')
  }
  return data.text?.trim() ?? ''
}
