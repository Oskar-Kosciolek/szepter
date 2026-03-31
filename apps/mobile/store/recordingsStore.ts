import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type Recording = {
  id: string
  user_id: string
  transcript: string
  command_type: string | null
  command_payload: Record<string, unknown> | null
  duration_seconds: number | null
  created_at: string
}

type NewRecording = Pick<Recording, 'transcript' | 'command_type' | 'command_payload' | 'duration_seconds'>

type RecordingsStore = {
  recordings: Recording[]
  loading: boolean
  fetchRecordings: () => Promise<void>
  addRecording: (data: NewRecording) => Promise<void>
  deleteRecording: (id: string) => Promise<void>
}

export const useRecordingsStore = create<RecordingsStore>((set, get) => ({
  recordings: [],
  loading: false,

  fetchRecordings: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) set({ recordings: data })
    set({ loading: false })
  },

  addRecording: async (data: NewRecording) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: inserted, error } = await supabase
      .from('recordings')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()

    if (!error && inserted) {
      set({ recordings: [inserted, ...get().recordings] })
    }
  },

  deleteRecording: async (id: string) => {
    await supabase.from('recordings').delete().eq('id', id)
    set({ recordings: get().recordings.filter(r => r.id !== id) })
  },
}))
