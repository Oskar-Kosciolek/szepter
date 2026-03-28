import { TranscriptionService } from './TranscriptionService'
import { GroqTranscriptionService } from './GroqTranscriptionService'

const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? ''

export const transcriptionService: TranscriptionService =
  new GroqTranscriptionService(groqApiKey)

export type { TranscriptionService, TranscriptionResult } from './TranscriptionService'