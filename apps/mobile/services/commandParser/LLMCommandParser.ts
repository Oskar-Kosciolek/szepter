import { fetch } from 'expo/fetch'
import { CommandParser, ParsedCommand } from './CommandParser'
import { RegexCommandParser } from './RegexCommandParser'

const getSystemPrompt = () => {
  const now = new Date().toISOString()
  return `Jesteś parserem komend głosowych dla aplikacji do notatek i list.
Przeanalizuj tekst i zwróć JSON z intencją użytkownika.
Aktualna data i czas (UTC): ${now}. Strefa czasowa użytkownika: UTC+1 (Polska).

Dostępne typy komend:
- save_note: użytkownik chce zapisać notatkę lub pomysł (bez daty)
- save_task: użytkownik chce zapisać notatkę/zadanie Z terminem (deadline)
- add_to_list: użytkownik chce dodać element do listy (bez daty)
- add_task_to_list: użytkownik chce dodać zadanie do listy Z terminem (deadline)
- read_notes: użytkownik chce odczytać notatki
- create_list: użytkownik chce utworzyć nową listę
- delete_last_note: użytkownik chce usunąć ostatnią notatkę
- read_lists: użytkownik chce odczytać wszystkie listy (np. "odczytaj moje listy", "jakie mam listy")
- read_list: użytkownik chce odczytać konkretną listę (np. "odczytaj listę zakupów", "co jest na liście zakupów")
- check_item: użytkownik chce oznaczyć element jako zrobiony (np. "zaznacz mleko na liście zakupów", "odznacz jako zrobione mleko")
- uncheck_item: użytkownik chce odznaczyć element (np. "odznacz mleko", "cofnij zaznaczenie mleka")
- delete_list_item: użytkownik chce usunąć element z listy (np. "usuń mleko z listy zakupów")
- summarize_list: użytkownik chce podsumowanie listy (np. "podsumuj listę zakupów", "ile zostało do zrobienia na liście")
- unknown: nie rozpoznano intencji

Rozpoznawanie dat (zawsze w strefie UTC+1):
- "jutro o 18" → następny dzień, 18:00
- "na piątek" → najbliższy piątek
- "za tydzień" → za 7 dni
- "co tydzień w poniedziałek" → isRecurring: true, recurrenceRule: "weekly"
- "co dzień" / "codziennie" → isRecurring: true, recurrenceRule: "daily"
- "co miesiąc" → isRecurring: true, recurrenceRule: "monthly"
- Deadline zawsze jako ISO 8601, np. "2026-04-01T18:00:00+01:00"

Odpowiedz TYLKO w formacie JSON, bez żadnego tekstu przed ani po:
{
  "type": "nazwa_komendy",
  "payload": {
    "content": "treść notatki lub elementu (jeśli dotyczy)",
    "listName": "nazwa listy (jeśli dotyczy)",
    "itemName": "nazwa elementu listy (dla check_item, uncheck_item, delete_list_item)",
    "deadline": "ISO 8601 (tylko jeśli podano datę)",
    "isRecurring": false,
    "recurrenceRule": "weekly|daily|monthly (tylko jeśli cykliczne)"
  }
}`
}

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
            { role: 'system', content: getSystemPrompt() },
            { role: 'user', content: transcript },
          ],
          temperature: 0,
          max_tokens: 300,
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
