import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { useNotesStore } from '../store/notesStore'

export type { Note } from '../store/notesStore'

export function useNotes() {
  const { notes, loading, fetchNotes, addNote, deleteNote } = useNotesStore()
  const [text, setText] = useState('')
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchNotes() }, [])

  const handleAdd = useCallback(async () => {
    if (!text.trim()) return
    setSaving(true)
    await addNote(text.trim(), deadline?.toISOString())
    setText('')
    setDeadline(null)
    setSaving(false)
  }, [text, deadline, addNote])

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Usuń notatkę', 'Na pewno?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => deleteNote(id) },
    ])
  }, [deleteNote])

  return { notes, loading, text, setText, deadline, setDeadline, saving, handleAdd, handleDelete }
}
