import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Note } from '@shared/types'

type NotesStore = {
  notes: Note[]
  loading: boolean
  fetchNotes: () => Promise<void>
}

export const useNotesStore = create<NotesStore>((set) => ({
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
}))
