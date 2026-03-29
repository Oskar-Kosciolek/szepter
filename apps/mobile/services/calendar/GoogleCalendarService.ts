import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import * as SecureStore from 'expo-secure-store'
import { fetch } from 'expo/fetch'
import { CalendarService, CalendarEvent } from './CalendarService'

WebBrowser.maybeCompleteAuthSession()

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
]
const TOKEN_KEY = 'google_calendar_token'
const ACCOUNT_KEY = 'google_calendar_email'
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export class GoogleCalendarService implements CalendarService {
  private clientId: string

  constructor(clientId: string) {
    this.clientId = clientId
  }

  async isAuthorized(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY)
    return !!token
  }

  async getAccountEmail(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCOUNT_KEY)
  }

  async authorize(): Promise<boolean> {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'szepter' })

    const discovery = await AuthSession.fetchDiscoveryAsync(
      'https://accounts.google.com'
    )

    const request = new AuthSession.AuthRequest({
      clientId: this.clientId,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    })

    const result = await request.promptAsync(discovery)

    if (result.type !== 'success') return false

    const accessToken = result.params.access_token
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken)

    // Pobierz email konta
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const info = await res.json()
      if (info.email) await SecureStore.setItemAsync(ACCOUNT_KEY, info.email)
    } catch {}

    return true
  }

  async disconnect(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(ACCOUNT_KEY)
  }

  private async getToken(): Promise<string> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY)
    if (!token) throw new Error('Brak autoryzacji Google Calendar')
    return token
  }

  private toGoogleEvent(event: CalendarEvent | Partial<CalendarEvent>) {
    const start = event.startTime
    const end = event.endTime ?? (start ? new Date(start.getTime() + 60 * 60 * 1000) : undefined)

    return {
      summary: event.title,
      description: event.description,
      start: event.isAllDay
        ? { date: start?.toISOString().split('T')[0] }
        : { dateTime: start?.toISOString(), timeZone: 'Europe/Warsaw' },
      end: event.isAllDay
        ? { date: end?.toISOString().split('T')[0] }
        : { dateTime: end?.toISOString(), timeZone: 'Europe/Warsaw' },
    }
  }

  async createEvent(event: CalendarEvent): Promise<string> {
    const token = await this.getToken()
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.toGoogleEvent(event)),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message ?? 'Błąd tworzenia eventu')
    return data.id
  }

  async updateEvent(id: string, event: Partial<CalendarEvent>): Promise<void> {
    const token = await this.getToken()
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.toGoogleEvent(event)),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error?.message ?? 'Błąd aktualizacji eventu')
    }
  }

  async deleteEvent(id: string): Promise<void> {
    const token = await this.getToken()
    await fetch(`${CALENDAR_API}/calendars/primary/events/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }
}
