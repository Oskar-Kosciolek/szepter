export type CommandType =
  | 'save_note'
  | 'add_to_list'
  | 'read_notes'
  | 'create_list'
  | 'delete_last_note'
  | 'save_task'
  | 'add_task_to_list'
  | 'read_lists'
  | 'read_list'
  | 'check_item'
  | 'uncheck_item'
  | 'delete_list_item'
  | 'summarize_list'
  | 'unknown'

export type ParsedCommand = {
  type: CommandType
  payload?: {
    content?: string
    listName?: string
    itemName?: string
    deadline?: string
    isRecurring?: boolean
    recurrenceRule?: string
  }
  confidence: 'high' | 'low'
}

export interface CommandParser {
  parse(transcript: string): Promise<ParsedCommand>
}
