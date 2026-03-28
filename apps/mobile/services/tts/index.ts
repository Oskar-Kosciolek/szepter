import { TTSService } from './TTSService'
import { ExpoTTSService } from './ExpoTTSService'

export const ttsService: TTSService = new ExpoTTSService()

export type { TTSService, TTSOptions } from './TTSService'