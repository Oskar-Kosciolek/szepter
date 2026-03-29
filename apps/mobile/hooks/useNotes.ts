import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { useNotesStore } from '../store/notesStore'

export type { Note } from '../store/notesStore'

export function useNotes() {
  const { notes, loading, fetchNotes, addNote, deleteNote } = useNotesStore()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchNotes() }, [])

  const handleAdd = useCallback(async () => {
    if (!text.trim()) return
    setSaving(true)
    await addNote(text.trim())
    setText('')
    setSaving(false)
  }, [text, addNote])

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Usuń notatkę', 'Na pewno?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => deleteNote(id) },
    ])
  }, [deleteNote])

  return { notes, loading, text, setText, saving, handleAdd, handleDelete }
}
