export type CommandType =
  | 'save_note'
  | 'add_to_list'
  | 'read_notes'
  | 'create_list'
  | 'delete_last_note'
  | 'save_task'
  | 'add_task_to_list'
  | 'unknown'

export type ParsedCommand = {
  type: CommandType
  payload?: {
    content?: string
    listName?: string
    deadline?: string       // ISO 8601, np. "2026-04-01T18:00:00"
    isRecurring?: boolean
    recurrenceRule?: string // "weekly", "daily", "monthly"
  }
  confidence: 'high' | 'low'
}

export interface CommandParser {
  parse(transcript: string): Promise<ParsedCommand>
}
