import { fetch } from 'expo/fetch'
import { File } from 'expo-file-system'
import { TranscriptionService, TranscriptionResult } from './TranscriptionService'

export class GroqTranscriptionService implements TranscriptionService {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = 'whisper-large-v3') {
    this.apiKey = apiKey
    this.model = model
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async transcribe(audioUri: string): Promise<TranscriptionResult> {
    try {
      const audioFile = new File(audioUri)

      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('model', this.model)
      formData.append('language', 'pl')
      formData.append('response_format', 'json')

      const response = await fetch(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.warn('Groq error:', data)
        return { text: '', error: data?.error?.message ?? 'Błąd API' }
      }

      return { text: data.text?.trim() ?? '', language: 'pl' }
    } catch (e: any) {
      console.warn('GroqTranscriptionService error:', e)
      return { text: '', error: e.message }
    }
  }
}