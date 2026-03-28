export type CommandType =
  | 'save_note'
  | 'add_to_list'
  | 'read_notes'
  | 'create_list'
  | 'delete_last_note'
  | 'unknown'

export type ParsedCommand = {
  type: CommandType
  payload?: {
    content?: string    // treść notatki / elementu listy
    listName?: string   // nazwa listy
  }
  confidence: 'high' | 'low'
}

export interface CommandParser {
  parse(transcript: string): Promise<ParsedCommand>
}