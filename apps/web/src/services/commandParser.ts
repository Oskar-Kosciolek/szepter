// Port of apps/mobile/services/commandParser — zero React Native dependencies.
// RegexCommandParser: pure JS. LLMCommandParser: uses global fetch (browser-native).

// ─── Types (mirrors mobile CommandParser.ts) ─────────────────────────────────

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

// ─── RegexCommandParser ───────────────────────────────────────────────────────

function parseDate(text: string): string | undefined {
  const t = text.toLowerCase()
  const now = new Date()
  const polandOffset = 60

  const toPolandISO = (d: Date) => {
    const utcMs = d.getTime() + (d.getTimezoneOffset() + polandOffset) * 60000
    const local = new Date(utcMs)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:00+01:00`
  }

  const hourMatch = t.match(/o (\d{1,2})(?::(\d{2}))?/)
  const hour = hourMatch ? parseInt(hourMatch[1]) : 9
  const minute = hourMatch?.[2] ? parseInt(hourMatch[2]) : 0

  if (t.includes('jutro')) {
    const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(hour, minute, 0, 0)
    return toPolandISO(d)
  }
  if (t.includes('pojutrze')) {
    const d = new Date(now); d.setDate(d.getDate() + 2); d.setHours(hour, minute, 0, 0)
    return toPolandISO(d)
  }
  if (t.match(/za tydzień|za tydzien/)) {
    const d = new Date(now); d.setDate(d.getDate() + 7); d.setHours(hour, minute, 0, 0)
    return toPolandISO(d)
  }

  const days = ['niedziel', 'poniedział', 'wtorek|wtorek', 'środ', 'czwartek', 'piątek|piatek', 'sobot']
  for (let i = 0; i < days.length; i++) {
    if (t.match(new RegExp(days[i]))) {
      const d = new Date(now)
      const diff = (i - d.getDay() + 7) % 7 || 7
      d.setDate(d.getDate() + diff); d.setHours(hour, minute, 0, 0)
      return toPolandISO(d)
    }
  }
  return undefined
}

function parseRecurrence(text: string): { isRecurring: boolean; recurrenceRule?: string } {
  const t = text.toLowerCase()
  if (t.match(/co dzień|codziennie/)) return { isRecurring: true, recurrenceRule: 'daily' }
  if (t.match(/co tydzień|co tydzie[nń]|co poniedziałek|co wtorek|co środę|co czwartek|co piątek/)) return { isRecurring: true, recurrenceRule: 'weekly' }
  if (t.match(/co miesiąc/)) return { isRecurring: true, recurrenceRule: 'monthly' }
  return { isRecurring: false }
}

export class RegexCommandParser {
  async parse(transcript: string): Promise<ParsedCommand> {
    const t = transcript.toLowerCase().trim()
    const deadline = parseDate(t)
    const { isRecurring, recurrenceRule } = parseRecurrence(t)
    const hasDate = !!deadline || isRecurring

    if (t.match(/odczytaj (moje )?listy|jakie mam listy|pokaż (moje )?listy|wyświetl (moje )?listy/))
      return { type: 'read_lists', confidence: 'low' }

    if (t.match(/podsumuj listę|podsumowanie listy|ile (zostało|jest) (do zrobienia )?na liście/)) {
      const m = transcript.match(/(?:podsumuj listę|podsumowanie listy|na liście)\s+(.+)/i)
      return { type: 'summarize_list', payload: { listName: m?.[1]?.trim() ?? '' }, confidence: 'low' }
    }

    if (t.match(/odczytaj listę|przeczytaj listę|co jest na liście|pokaż listę/)) {
      const m = transcript.match(/(?:odczytaj|przeczytaj|pokaż) listę (.+)/i)
        ?? transcript.match(/co jest na liście (.+)/i)
      return { type: 'read_list', payload: { listName: m?.[1]?.trim() ?? '' }, confidence: 'low' }
    }

    if (t.match(/zaznacz|oznacz.*(zrobion|gotow)/)) {
      const m = transcript.match(/(?:zaznacz|oznacz)\s+(.+?)(?:\s+(?:na liście|z listy)\s+(.+))?$/i)
      return { type: 'check_item', payload: { itemName: m?.[1]?.trim() ?? '', listName: m?.[2]?.trim() }, confidence: 'low' }
    }

    if (t.match(/odznacz|cofnij zaznaczenie/)) {
      const m = transcript.match(/(?:odznacz|cofnij zaznaczenie)\s+(.+?)(?:\s+(?:na liście|z listy)\s+(.+))?$/i)
      return { type: 'uncheck_item', payload: { itemName: m?.[1]?.trim() ?? '', listName: m?.[2]?.trim() }, confidence: 'low' }
    }

    if (t.match(/usuń .+ z listy|skasuj .+ z listy/)) {
      const m = transcript.match(/(?:usuń|skasuj)\s+(.+?)\s+z listy\s+(.+)/i)
      return { type: 'delete_list_item', payload: { itemName: m?.[1]?.trim() ?? '', listName: m?.[2]?.trim() ?? '' }, confidence: 'low' }
    }

    if (t.match(/zapisz|notatka|pomysł|zapamiętaj/))
      return { type: hasDate ? 'save_task' : 'save_note', payload: { content: transcript, deadline, isRecurring, recurrenceRule }, confidence: 'low' }

    if (t.match(/dodaj .+ (do listy|na listę)/)) {
      const m = transcript.match(/dodaj (.+?) (?:do listy|na listę)(?: (.+))?/i)
      return { type: hasDate ? 'add_task_to_list' : 'add_to_list', payload: { content: m?.[1] ?? transcript, listName: m?.[2] ?? 'domyślna', deadline, isRecurring, recurrenceRule }, confidence: 'low' }
    }

    if (t.match(/odczytaj|pokaż|wyświetl|przeczytaj.*(notatk|pomysł)/))
      return { type: 'read_notes', confidence: 'low' }

    if (t.match(/utwórz|stwórz|nowa lista|nową listę/)) {
      const m = transcript.match(/(?:utwórz|stwórz|nowa lista|nową listę)(?: o nazwie| nazw[aą])? (.+)/i)
      return { type: 'create_list', payload: { listName: m?.[1]?.trim() ?? 'nowa lista' }, confidence: 'low' }
    }

    if (t.match(/usuń|skasuj|wymaż.*(ostatni|notatk)/))
      return { type: 'delete_last_note', confidence: 'low' }

    return { type: 'unknown', confidence: 'low' }
  }
}

// ─── LLMCommandParser ─────────────────────────────────────────────────────────

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'

function getSystemPrompt() {
  const now = new Date().toISOString()
  return `Jesteś parserem komend głosowych dla aplikacji do notatek i list.
Przeanalizuj tekst i zwróć JSON z intencją użytkownika.
Aktualna data i czas (UTC): ${now}. Strefa czasowa użytkownika: UTC+1 (Polska).

Dostępne typy komend:
- save_note: zapisz notatkę (bez daty)
- save_task: zapisz notatkę/zadanie Z terminem (deadline)
- add_to_list: dodaj element do listy (bez daty)
- add_task_to_list: dodaj zadanie do listy Z terminem
- read_notes: odczytaj notatki
- create_list: utwórz nową listę
- delete_last_note: usuń ostatnią notatkę
- read_lists: odczytaj wszystkie listy
- read_list: odczytaj konkretną listę
- check_item: oznacz element jako zrobiony
- uncheck_item: odznacz element
- delete_list_item: usuń element z listy
- summarize_list: podsumuj listę
- unknown: nie rozpoznano intencji

Deadline zawsze jako ISO 8601 w UTC+1. Odpowiedz TYLKO w formacie JSON:
{
  "type": "nazwa_komendy",
  "payload": {
    "content": "treść (jeśli dotyczy)",
    "listName": "nazwa listy (jeśli dotyczy)",
    "itemName": "nazwa elementu (dla check/uncheck/delete_item)",
    "deadline": "ISO 8601 (tylko jeśli podano datę)",
    "isRecurring": false,
    "recurrenceRule": "weekly|daily|monthly (tylko jeśli cykliczne)"
  }
}`
}

export class LLMCommandParser {
  private apiKey: string
  private fallback = new RegexCommandParser()

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async parse(transcript: string): Promise<ParsedCommand> {
    try {
      const response = await fetch(GROQ_CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
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
      return { type: parsed.type ?? 'unknown', payload: parsed.payload, confidence: 'high' }
    } catch {
      return this.fallback.parse(transcript)
    }
  }
}
