declare module 'whisper.rn' {
  export interface WhisperContext {
    transcribe(uri: string, options?: { language?: string }): Promise<{ result: string }>
    release(): Promise<void>
  }

  export function initWhisper(options: { filePath: string }): Promise<WhisperContext>
}