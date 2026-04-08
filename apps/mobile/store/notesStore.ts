import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import {
  getNotes, saveNote, markNoteDeleted,
  type LocalNote,
} from '../lib/localDb'
import { syncService } from '../services/sync/SyncService'
import type { Note, SyncState } from '@shared/types'

export type { Note }

type NotesStore = {
  notes: Note[]
  loading: boolean
  syncState: SyncState
  fetchNotes: () => Promise<void>
  addNote: (content: string, deadline?: string) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  syncNotes: () => Promise<void>
}

function toNote(local: LocalNote): Note {
  return {
    id: local.id,
    content: local.content,
    transcript: local.transcript,
    created_at: local.created_at,
    deadline: local.deadline,
    notified: local.notified === 1,
    is_recurring: local.is_recurring === 1,
    recurrence_rule: local.recurrence_rule,
    google_event_id: local.google_event_id,
  }
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  loading: false,
  syncState: { isSyncing: false, lastSync: null, syncError: null },

  fetchNotes: async () => {
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }

    const local = await getNotes(user.id)
    set({ notes: local.map(toNote), loading: false })
  },

  addNote: async (content: string, deadline?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date().toISOString()
    const newNote: LocalNote = {
      id: crypto.randomUUID(),
      user_id: user.id,
      content,
      transcript: null,
      created_at: now,
      updated_at: now,
      deadline: deadline ?? null,
      notified: 0,
      is_recurring: 0,
      recurrence_rule: null,
      google_event_id: null,
      _synced: 0,
      _deleted: 0,
    }

    await saveNote(newNote)
    set({ notes: [toNote(newNote), ...get().notes] })
  },

  deleteNote: async (id: string) => {
    await markNoteDeleted(id)
    set({ notes: get().notes.filter(n => n.id !== id) })
  },

  syncNotes: async () => {
    set({ syncState: { ...get().syncState, isSyncing: true, syncError: null } })
    const result = await syncService.syncNotes()
    const hasError = result.errors.length > 0
    set({
      syncState: {
        isSyncing: false,
        lastSync: new Date(),
        syncError: hasError ? result.errors[0] : null,
      },
    })
    // Refresh local state after sync
    await get().fetchNotes()
  },
}))
