/**
 * @module reminderTask
 * @description BackgroundFetch task sprawdzający notatki z deadline <= now().
 * Uruchamia się co ~60s w tle (Android Foreground Service / iOS BGFetch).
 * Wyświetla powiadomienie i oznacza notatkę jako notified = true.
 */

import * as TaskManager from 'expo-task-manager'
import * as BackgroundFetch from 'expo-background-fetch'
import { createClient } from '@supabase/supabase-js'
import { notificationService } from '../services/notifications'

export const BACKGROUND_REMINDER_TASK = 'szepter-reminder-check'

/**
 * Tworzy osobnego klienta Supabase dla taska (działa poza React — bez AsyncStorage).
 * Używa zmiennych env, które są dostępne w task managerze.
 */
function getSupabaseClient() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

TaskManager.defineTask(BACKGROUND_REMINDER_TASK, async () => {
  try {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, content, deadline')
      .lte('deadline', now)
      .eq('notified', false)
      .not('deadline', 'is', null)
      .limit(10)

    if (error || !notes || notes.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData
    }

    for (const note of notes) {
      await notificationService.scheduleImmediate(
        '⏰ Przypomnienie',
        note.content.slice(0, 100),
        { noteId: note.id },
      )
      await supabase
        .from('notes')
        .update({ notified: true })
        .eq('id', note.id)
    }

    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch (e) {
    console.warn('[reminderTask] błąd:', e)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

export async function registerReminderTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_REMINDER_TASK)
  if (isRegistered) return

  await BackgroundFetch.registerTaskAsync(BACKGROUND_REMINDER_TASK, {
    minimumInterval: 60,       // co 60 sekund
    stopOnTerminate: false,    // restart po ubiciu przez system
    startOnBoot: true,         // restart po reboocie telefonu
  })
}
