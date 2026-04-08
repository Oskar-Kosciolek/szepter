import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useNotesStore } from '../store/notesStore'
import { useListsStore } from '../store/listsStore'

/**
 * Subscribes to Supabase Realtime changes on notes, lists, and list_items.
 * Changes made on mobile are reflected in the browser without a page refresh.
 * Mount once at router level (inside ProtectedRoute).
 */
export function useRealtime() {
  const fetchNotes = useNotesStore(s => s.fetchNotes)
  const fetchLists = useListsStore(s => s.fetchLists)

  const refresh = useCallback(() => {
    fetchNotes()
    fetchLists()
  }, [fetchNotes, fetchLists])

  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, fetchNotes)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, fetchLists)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'list_items' }, fetchLists)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchNotes, fetchLists, refresh])
}
