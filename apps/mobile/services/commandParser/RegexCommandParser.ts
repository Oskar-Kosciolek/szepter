import { CommandParser, ParsedCommand } from './CommandParser'

export class RegexCommandParser implements CommandParser {
  async parse(transcript: string): Promise<ParsedCommand> {
    const t = transcript.toLowerCase().trim()

    if (t.match(/zapisz|notatka|pomysł|zapamiętaj/)) {
      return {
        type: 'save_note',
        payload: { content: transcript },
        confidence: 'low',
      }
    }

    if (t.match(/dodaj .+ (do listy|na listę)/)) {
      const match = transcript.match(/dodaj (.+?) (?:do listy|na listę)(?: (.+))?/i)
      return {
        type: 'add_to_list',
        payload: {
          content: match?.[1] ?? transcript,
          listName: match?.[2] ?? 'domyślna',
        },
        confidence: 'low',
      }
    }

    if (t.match(/odczytaj|pokaż|wyświetl|przeczytaj.*(notatk|pomysł)/)) {
      return { type: 'read_notes', confidence: 'low' }
    }

    if (t.match(/utwórz|stwórz|nowa lista|nową listę/)) {
      const match = transcript.match(/(?:utwórz|stwórz|nowa lista|nową listę)(?: o nazwie| nazw[aą])? (.+)/i)
      return {
        type: 'create_list',
        payload: { listName: match?.[1]?.trim() ?? 'nowa lista' },
        confidence: 'low',
      }
    }

    if (t.match(/usuń|skasuj|wymaż.*(ostatni|notatk)/)) {
      return { type: 'delete_last_note', confidence: 'low' }
    }

    return { type: 'unknown', confidence: 'low' }
  }
} 