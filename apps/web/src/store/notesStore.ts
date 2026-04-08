import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Note } from '@shared/types'

type NotesStore = {
  notes: Note[]
  loading: boolean
  fetchNotes: () => Promise<void>
  createNote: (content: string, deadline?: string) => Promise<void>
  updateNote: (id: string, content: string) => Promise<void>
  deleteNote: (id: string) => Promise<void>
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  loading: false,

  fetchNotes: async () => {
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }

    const { data, error } = await supabase
      .from('notes')
      .select('id, content, transcript, created_at, deadline, notified, is_recurring, recurrence_rule, google_event_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      set({ notes: data as Note[] })
    }
    set({ loading: false })
  },

  createNote: async (content: string, deadline?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        content,
        deadline: deadline ?? null,
      })
      .select('id, content, transcript, created_at, deadline, notified, is_recurring, recurrence_rule, google_event_id')
      .single()

    if (!error && data) {
      set({ notes: [data as Note, ...get().notes] })
    }
  },

  updateNote: async (id: string, content: string) => {
    const { data, error } = await supabase
      .from('notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, content, transcript, created_at, deadline, notified, is_recurring, recurrence_rule, google_event_id')
      .single()

    if (!error && data) {
      set({ notes: get().notes.map(n => n.id === id ? data as Note : n) })
    }
  },

  deleteNote: async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (!error) {
      set({ notes: get().notes.filter(n => n.id !== id) })
    }
  },
}))
