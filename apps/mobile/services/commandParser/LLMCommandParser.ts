import { fetch } from 'expo/fetch'
import { CommandParser, ParsedCommand } from './CommandParser'
import { RegexCommandParser } from './RegexCommandParser'

const SYSTEM_PROMPT = `Jesteś parserem komend głosowych dla aplikacji do notatek i list.
Przeanalizuj tekst i zwróć JSON z intencją użytkownika.

Dostępne typy komend:
- save_note: użytkownik chce zapisać notatkę lub pomysł
- add_to_list: użytkownik chce dodać element do listy
- read_notes: użytkownik chce odczytać notatki
- create_list: użytkownik chce utworzyć nową listę
- delete_last_note: użytkownik chce usunąć ostatnią notatkę
- unknown: nie rozpoznano intencji

Odpowiedz TYLKO w formacie JSON, bez żadnego tekstu przed ani po:
{
  "type": "nazwa_komendy",
  "payload": {
    "content": "treść notatki lub elementu (jeśli dotyczy)",
    "listName": "nazwa listy (jeśli dotyczy)"
  }
}`

export class LLMCommandParser implements CommandParser {
  private apiKey: string
  private fallback: RegexCommandParser

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.fallback = new RegexCommandParser()
  }

  async parse(transcript: string): Promise<ParsedCommand> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: transcript },
          ],
          temperature: 0,
          max_tokens: 200,
        }),
      })

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content?.trim()

      if (!text) throw new Error('Pusta odpowiedź LLM')

      const parsed = JSON.parse(text)
      console.log('LLM parser:', parsed)

      return {
        type: parsed.type ?? 'unknown',
        payload: parsed.payload,
        confidence: 'high',
      }
    } catch (e) {
      console.warn('LLM parser błąd, używam fallback:', e)
      return this.fallback.parse(transcript)
    }
  }
}