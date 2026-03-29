import { GoogleCalendarService } from './GoogleCalendarService'

const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? ''

export const calendarService = new GoogleCalendarService(clientId)
export type { CalendarService, CalendarEvent } from './CalendarService'
