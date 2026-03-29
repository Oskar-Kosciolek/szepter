import { calendarService } from '../services/calendar'
import { useSettingsStore } from '../store/settingsStore'
import { supabase } from '../lib/supabase'

type ItemWithDeadline = {
  id: string
  content: string
  deadline?: string | null
  google_event_id?: string | null
}

export function useReminders() {
  const { settings } = useSettingsStore()

  const scheduleRemindersForNote = async (note: ItemWithDeadline) => {
    if (!note.deadline) return
    await syncWithCalendar(note, 'note')
  }

  const scheduleRemindersForItem = async (item: ItemWithDeadline, listId: string) => {
    if (!item.deadline) return
    await syncWithCalendar(item, 'list_item', listId)
  }

  const cancelReminders = async (googleEventId: string) => {
    try {
      const authorized = await calendarService.isAuthorized()
      if (authorized) await calendarService.deleteEvent(googleEventId)
    } catch (e) {
      console.warn('Błąd usuwania eventu z kalendarza:', e)
    }
  }

  return { scheduleRemindersForNote, scheduleRemindersForItem, cancelReminders }
}

async function syncWithCalendar(
  item: ItemWithDeadline,
  type: 'note' | 'list_item',
  listId?: string
) {
  try {
    const authorized = await calendarService.isAuthorized()
    if (!authorized) return

    const startTime = new Date(item.deadline!)
    const eventId = await calendarService.createEvent({
      title: item.content,
      startTime,
    })

    const table = type === 'note' ? 'notes' : 'list_items'
    await supabase.from(table).update({ google_event_id: eventId }).eq('id', item.id)
  } catch (e) {
    console.warn('Błąd synchronizacji z Google Calendar:', e)
  }
}
