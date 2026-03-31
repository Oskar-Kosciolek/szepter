import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type ReminderSettings = {
  remindBeforeMinutes: number[]
  remindDayBefore: boolean
  remindMorningOf: boolean
  morningReminderHour: number
}

export type VoiceSettings = {
  ttsVoice: string
  ttsRate: number
  ttsPitch: number
  voiceConfirmations: boolean
  autoReadAfterSave: boolean
  maxNotesToRead: number
  ttsSilentMode: boolean
}

const REMINDER_DEFAULTS: ReminderSettings = {
  remindBeforeMinutes: [60],
  remindDayBefore: true,
  remindMorningOf: true,
  morningReminderHour: 8,
}

export const VOICE_DEFAULTS: VoiceSettings = {
  ttsVoice: 'pl-pl-x-bmg-network',
  ttsRate: 0.9,
  ttsPitch: 1.0,
  voiceConfirmations: true,
  autoReadAfterSave: false,
  maxNotesToRead: 3,
  ttsSilentMode: false,
}

type SettingsStore = {
  settings: ReminderSettings
  voice: VoiceSettings
  loading: boolean
  saving: boolean
  fetchSettings: () => Promise<void>
  saveSettings: (s: ReminderSettings) => Promise<void>
  fetchVoiceSettings: () => Promise<void>
  saveVoiceSettings: (v: VoiceSettings) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: REMINDER_DEFAULTS,
  voice: VOICE_DEFAULTS,
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
          remindBeforeMinutes: data.remind_before_minutes ?? REMINDER_DEFAULTS.remindBeforeMinutes,
          remindDayBefore: data.remind_day_before ?? REMINDER_DEFAULTS.remindDayBefore,
          remindMorningOf: data.remind_morning_of ?? REMINDER_DEFAULTS.remindMorningOf,
          morningReminderHour: data.morning_reminder_hour ?? REMINDER_DEFAULTS.morningReminderHour,
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

  fetchVoiceSettings: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      set({
        voice: {
          ttsVoice: data.tts_voice ?? VOICE_DEFAULTS.ttsVoice,
          ttsRate: data.tts_rate ?? VOICE_DEFAULTS.ttsRate,
          ttsPitch: data.tts_pitch ?? VOICE_DEFAULTS.ttsPitch,
          voiceConfirmations: data.voice_confirmations ?? VOICE_DEFAULTS.voiceConfirmations,
          autoReadAfterSave: data.auto_read_after_save ?? VOICE_DEFAULTS.autoReadAfterSave,
          maxNotesToRead: data.max_notes_to_read ?? VOICE_DEFAULTS.maxNotesToRead,
          ttsSilentMode: data.tts_silent_mode ?? VOICE_DEFAULTS.ttsSilentMode,
        },
      })
    }
  },

  saveVoiceSettings: async (v: VoiceSettings) => {
    set({ saving: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ saving: false }); return }

    await supabase.from('user_settings').upsert({
      user_id: user.id,
      tts_voice: v.ttsVoice,
      tts_rate: v.ttsRate,
      tts_pitch: v.ttsPitch,
      voice_confirmations: v.voiceConfirmations,
      auto_read_after_save: v.autoReadAfterSave,
      max_notes_to_read: v.maxNotesToRead,
      tts_silent_mode: v.ttsSilentMode,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    set({ voice: v, saving: false })
  },
}))
