export interface TTSService {
  speak(text: string, options?: TTSOptions): Promise<void>
  stop(): void
  isSpeaking(): Promise<boolean>
}

export type TTSOptions = {
  language?: string
  rate?: number    // 0.0 - 1.0, domyślnie 0.9
  pitch?: number   // 0.0 - 2.0, domyślnie 1.0
  voice?: string
}