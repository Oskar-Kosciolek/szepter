import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type Note = {
  id: string
  content: string
  transcript: string | null
  created_at: string
  deadline?: string | null
  notified?: boolean
  is_recurring?: boolean
  recurrence_rule?: string | null
  google_event_id?: string | null
}

type NotesStore = {
  notes: Note[]
  loading: boolean
  fetchNotes: () => Promise<void>
  addNote: (content: string, deadline?: string) => Promise<void>
  deleteNote: (id: string) => Promise<void>
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  loading: false,

  fetchNotes: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) set({ notes: data })
    set({ loading: false })
  },

  addNote: async (content: string, deadline?: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('notes')
      .insert({ content, user_id: user?.id, deadline: deadline ?? null, notified: false })
      .select()
      .single()

    if (!error && data) {
      set({ notes: [data, ...get().notes] })
    }
  },

  deleteNote: async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    set({ notes: get().notes.filter(n => n.id !== id) })
  },
}))