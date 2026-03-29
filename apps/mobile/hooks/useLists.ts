import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { useListsStore } from '../store/listsStore'

export type { List } from '../store/listsStore'

export function useLists() {
  const { lists, loading, fetchLists, createList, deleteList } = useListsStore()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchLists() }, [])

  const handleCreate = useCallback(async () => {
    if (!text.trim()) return
    setSaving(true)
    await createList(text.trim())
    setText('')
    setSaving(false)
  }, [text, createList])

  const handleDelete = useCallback((id: string) => {
    const list = lists.find(l => l.id === id)
    Alert.alert('Usuń listę', `Usunąć "${list?.title}" wraz z zawartością?`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => deleteList(id) },
    ])
  }, [lists, deleteList])

  return { lists, loading, text, setText, saving, handleCreate, handleDelete }
}
