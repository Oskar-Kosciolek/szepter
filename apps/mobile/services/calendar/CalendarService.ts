export type CalendarEvent = {
  title: string
  description?: string
  startTime: Date
  endTime?: Date
  isAllDay?: boolean
}

export interface CalendarService {
  authorize(): Promise<boolean>
  createEvent(event: CalendarEvent): Promise<string>
  updateEvent(id: string, event: Partial<CalendarEvent>): Promise<void>
  deleteEvent(id: string): Promise<void>
  isAuthorized(): Promise<boolean>
  getAccountEmail(): Promise<string | null>
}
