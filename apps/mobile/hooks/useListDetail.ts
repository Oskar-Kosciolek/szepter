import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { useListsStore, ListItem } from '../store/listsStore'

export type { ListItem } from '../store/listsStore'

export function useListDetail(listId: string) {
  const { addItem, toggleItem, deleteItem, fetchItems } = useListsStore()
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    const data = await fetchItems(listId)
    setItems(data)
    setLoading(false)
  }, [listId, fetchItems])

  useEffect(() => { loadItems() }, [loadItems])

  const handleAdd = useCallback(async () => {
    if (!text.trim()) return
    setSaving(true)
    await addItem(listId, text.trim(), deadline?.toISOString())
    setText('')
    setDeadline(null)
    await loadItems()
    setSaving(false)
  }, [text, deadline, listId, addItem, loadItems])

  const handleToggle = useCallback(async (item: ListItem) => {
    await toggleItem(item)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i))
  }, [toggleItem])

  const handleDelete = useCallback((item: ListItem) => {
    Alert.alert('Usuń element', `Usunąć "${item.content}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive', onPress: async () => {
          await deleteItem(item.id, listId)
          setItems(prev => prev.filter(i => i.id !== item.id))
        }
      },
    ])
  }, [listId, deleteItem])

  return { items, loading, text, setText, deadline, setDeadline, saving, handleAdd, handleToggle, handleDelete }
}
