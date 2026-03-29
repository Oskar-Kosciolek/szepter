import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type ReminderSettings = {
  remindBeforeMinutes: number[]
  remindDayBefore: boolean
  remindMorningOf: boolean
  morningReminderHour: number
}

const DEFAULTS: ReminderSettings = {
  remindBeforeMinutes: [60],
  remindDayBefore: true,
  remindMorningOf: true,
  morningReminderHour: 8,
}

type SettingsStore = {
  settings: ReminderSettings
  loading: boolean
  saving: boolean
  fetchSettings: () => Promise<void>
  saveSettings: (s: ReminderSettings) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULTS,
  loading: false,
  saving: false,

  fetchSettings: async () => {
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }

    const { data } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      set({
        settings: {
          remindBeforeMinutes: data.remind_before_minutes ?? DEFAULTS.remindBeforeMinutes,
          remindDayBefore: data.remind_day_before ?? DEFAULTS.remindDayBefore,
          remindMorningOf: data.remind_morning_of ?? DEFAULTS.remindMorningOf,
          morningReminderHour: data.morning_reminder_hour ?? DEFAULTS.morningReminderHour,
        },
      })
    }
    set({ loading: false })
  },

  saveSettings: async (s: ReminderSettings) => {
    set({ saving: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ saving: false }); return }

    await supabase.from('reminder_settings').upsert({
      user_id: user.id,
      remind_before_minutes: s.remindBeforeMinutes,
      remind_day_before: s.remindDayBefore,
      remind_morning_of: s.remindMorningOf,
      morning_reminder_hour: s.morningReminderHour,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    set({ settings: s, saving: false })
  },
}))
