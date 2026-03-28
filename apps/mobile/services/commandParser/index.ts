import { CommandParser } from './CommandParser'
import { LLMCommandParser } from './LLMCommandParser'

const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? ''

export const commandParser: CommandParser = new LLMCommandParser(groqApiKey)

export type { CommandParser, ParsedCommand, CommandType } from './CommandParser'