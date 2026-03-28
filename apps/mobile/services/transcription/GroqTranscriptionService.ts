import * as FileSystem from 'expo-file-system'
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
      const uploadResult = await FileSystem.uploadAsync(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        audioUri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType: 'audio/m4a',
          parameters: {
            model: this.model,
            language: 'pl',
            response_format: 'json',
          },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      )

      const response = JSON.parse(uploadResult.body)

      if (uploadResult.status !== 200) {
        console.warn('Groq error:', response)
        return { text: '', error: response?.error?.message ?? 'Błąd API' }
      }

      return { text: response.text?.trim() ?? '', language: 'pl' }
    } catch (e: any) {
      console.warn('GroqTranscriptionService error:', e)
      return { text: '', error: e.message }
    }
  }
}