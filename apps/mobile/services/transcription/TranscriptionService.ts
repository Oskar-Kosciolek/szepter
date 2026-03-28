export interface TranscriptionService {
  transcribe(audioUri: string): Promise<TranscriptionResult>
  isAvailable(): Promise<boolean>
}

export type TranscriptionResult = {
  text: string
  language?: string
  error?: string
}