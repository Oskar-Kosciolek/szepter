import { CommandParser, ParsedCommand } from './CommandParser'

function parseDate(text: string): string | undefined {
  const t = text.toLowerCase()
  const now = new Date()
  const polandOffset = 60 // UTC+1 w minutach

  const toPolandISO = (d: Date) => {
    const utcMs = d.getTime() + (d.getTimezoneOffset() + polandOffset) * 60000
    const local = new Date(utcMs)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:00+01:00`
  }

  const setHour = (d: Date, h: number) => { d.setHours(h, 0, 0, 0); return d }

  // Godzina z tekstu np. "o 18", "o 9:30"
  const hourMatch = t.match(/o (\d{1,2})(?::(\d{2}))?/)
  const hour = hourMatch ? parseInt(hourMatch[1]) : 9
  const minute = hourMatch?.[2] ? parseInt(hourMatch[2]) : 0

  if (t.includes('jutro')) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    d.setHours(hour, minute, 0, 0)
    return toPolandISO(d)
  }

  if (t.includes('pojutrze')) {
    const d = new Date(now)
    d.setDate(d.getDate() + 2)
    d.setHours(hour, minute, 0, 0)
    return toPolandISO(d)
  }

  if (t.match(/za tydzień|za tydzien/)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 7)
    d.setHours(hour, minute, 0, 0)
    return toPolandISO(d)
  }

  const days = ['niedziel', 'poniedział', 'wtorek|wtorek', 'środ', 'czwartek', 'piątek|piatek', 'sobot']
  for (let i = 0; i < days.length; i++) {
    if (t.match(new RegExp(days[i]))) {
      const d = new Date(now)
      const diff = (i - d.getDay() + 7) % 7 || 7
      d.setDate(d.getDate() + diff)
      d.setHours(hour, minute, 0, 0)
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

export class RegexCommandParser implements CommandParser {
  async parse(transcript: string): Promise<ParsedCommand> {
    const t = transcript.toLowerCase().trim()
    const deadline = parseDate(t)
    const { isRecurring, recurrenceRule } = parseRecurrence(t)
    const hasDate = !!deadline || isRecurring

    if (t.match(/zapisz|notatka|pomysł|zapamiętaj/)) {
      return {
        type: hasDate ? 'save_task' : 'save_note',
        payload: { content: transcript, deadline, isRecurring, recurrenceRule },
        confidence: 'low',
      }
    }

    if (t.match(/dodaj .+ (do listy|na listę)/)) {
      const match = transcript.match(/dodaj (.+?) (?:do listy|na listę)(?: (.+))?/i)
      return {
        type: hasDate ? 'add_task_to_list' : 'add_to_list',
        payload: {
          content: match?.[1] ?? transcript,
          listName: match?.[2] ?? 'domyślna',
          deadline,
          isRecurring,
          recurrenceRule,
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
