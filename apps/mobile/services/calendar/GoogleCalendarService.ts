import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import * as SecureStore from 'expo-secure-store'
import { CalendarService, CalendarEvent } from './CalendarService'

WebBrowser.maybeCompleteAuthSession()

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

const REDIRECT_URI = 'szepter://'
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
]

export class GoogleCalendarService implements CalendarService {
  private clientId: string

  constructor(clientId: string) {
    this.clientId = clientId
  }

  async authorize(): Promise<boolean> {
    const request = new AuthSession.AuthRequest({
      clientId: this.clientId,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    })

    const result = await request.promptAsync(DISCOVERY)
    if (result.type !== 'success') return false

    const tokenResult = await AuthSession.exchangeCodeAsync(
      {
        clientId: this.clientId,
        code: result.params.code,
        redirectUri: REDIRECT_URI,
        extraParams: {
          code_verifier: request.codeVerifier!,
        },
      },
      DISCOVERY
    )

    await SecureStore.setItemAsync('google_access_token', tokenResult.accessToken)
    await SecureStore.setItemAsync(
      'google_token_expiry',
      String(Date.now() + (tokenResult.expiresIn ?? 3600) * 1000)
    )
    if (tokenResult.refreshToken) {
      await SecureStore.setItemAsync('google_refresh_token', tokenResult.refreshToken)
    }

    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
      })
      const info = await res.json()
      if (info.email) {
        await SecureStore.setItemAsync('google_account_email', info.email)
      }
    } catch {}

    return true
  }

  async isAuthorized(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('google_access_token')
    const expiry = await SecureStore.getItemAsync('google_token_expiry')
    if (!token || !expiry) return false
    return Date.now() < parseInt(expiry)
  }

  async getAccountEmail(): Promise<string | null> {
    return SecureStore.getItemAsync('google_account_email')
  }

  private async getValidToken(): Promise<string | null> {
    const isValid = await this.isAuthorized()
    if (isValid) {
      return SecureStore.getItemAsync('google_access_token')
    }

    const refreshToken = await SecureStore.getItemAsync('google_refresh_token')
    if (!refreshToken) return null

    try {
      const result = await AuthSession.refreshAsync(
        {
          clientId: this.clientId,
          refreshToken,
        },
        DISCOVERY
      )
      await SecureStore.setItemAsync('google_access_token', result.accessToken)
      await SecureStore.setItemAsync(
        'google_token_expiry',
        String(Date.now() + (result.expiresIn ?? 3600) * 1000)
      )
      return result.accessToken
    } catch {
      return null
    }
  }

  async createEvent(event: CalendarEvent): Promise<string> {
    const token = await this.getValidToken()
    if (!token) throw new Error('Brak autoryzacji Google Calendar')

    const body = {
      summary: event.title,
      description: event.description,
      start: event.isAllDay
        ? { date: event.startTime.toISOString().split('T')[0] }
        : { dateTime: event.startTime.toISOString(), timeZone: 'Europe/Warsaw' },
      end: event.isAllDay
        ? { date: (event.endTime ?? event.startTime).toISOString().split('T')[0] }
        : { dateTime: (event.endTime ?? event.startTime).toISOString(), timeZone: 'Europe/Warsaw' },
    }

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message ?? 'Błąd Google Calendar')
    return data.id
  }

  async updateEvent(id: string, event: Partial<CalendarEvent>): Promise<void> {
    const token = await this.getValidToken()
    if (!token) throw new Error('Brak autoryzacji Google Calendar')

    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
        }),
      }
    )
  }

  async deleteEvent(id: string): Promise<void> {
    const token = await this.getValidToken()
    if (!token) throw new Error('Brak autoryzacji Google Calendar')

    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    )
  }

  async disconnect(): Promise<void> {
    await SecureStore.deleteItemAsync('google_access_token')
    await SecureStore.deleteItemAsync('google_refresh_token')
    await SecureStore.deleteItemAsync('google_token_expiry')
    await SecureStore.deleteItemAsync('google_account_email')
  }
}
