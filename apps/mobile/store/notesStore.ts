import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type Note = {
  id: string
  content: string
  transcript: string | null
  created_at: string
}

type NotesStore = {
  notes: Note[]
  loading: boolean
  fetchNotes: () => Promise<void>
  addNote: (content: string) => Promise<void>
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

  addNote: async (content: string) => {
    const { data, error } = await supabase
      .from('notes')
      .insert({ content })
      .select()
      .single()

      console.log('data:', data)
  console.log('error:', error)

    if (!error && data) {
      set({ notes: [data, ...get().notes] })
    }
  },

  deleteNote: async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    set({ notes: get().notes.filter(n => n.id !== id) })
  },
}))