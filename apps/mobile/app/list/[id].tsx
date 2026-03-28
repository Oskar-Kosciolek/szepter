import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, Trash2, Plus } from 'lucide-react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useListsStore, ListItem } from '../../store/listsStore'

export default function ListDetailScreen() {
  const { id, title } = useLocalSearchParams<{ id: string, title: string }>()
  const { addItem, toggleItem, deleteItem, fetchItems } = useListsStore()
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadItems()
  }, [id])

  const loadItems = async () => {
    setLoading(true)
    const data = await fetchItems(id)
    setItems(data)
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!text.trim()) return
    setSaving(true)
    await addItem(id, text.trim())
    setText('')
    await loadItems()
    setSaving(false)
  }

  const handleToggle = async (item: ListItem) => {
    await toggleItem(item)
    setItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, done: !i.done } : i
    ))
  }

  const handleDelete = async (item: ListItem) => {
    Alert.alert('Usuń element', `Usunąć "${item.content}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive', onPress: async () => {
          await deleteItem(item.id, id)
          setItems(prev => prev.filter(i => i.id !== item.id))
        }
      },
    ])
  }

  const renderItem = ({ item }: { item: ListItem }) => (
    <View style={s.item}>
      <Pressable
        style={[s.checkbox, item.done && s.checkboxDone]}
        onPress={() => handleToggle(item)}
      >
        {item.done && <Text style={s.checkmark}>✓</Text>}
      </Pressable>
      <Text style={[s.itemText, item.done && s.itemTextDone]}>
        {item.content}
      </Text>
      <Pressable onPress={() => handleDelete(item)} hitSlop={12}>
        <Trash2 size={14} color="#333" />
      </Pressable>
    </View>
  )

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color="#fff" />
        </Pressable>
        <Text style={s.title} numberOfLines={1}>{decodeURIComponent(title)}</Text>
      </View>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Nowy element..."
          placeholderTextColor="#444"
          value={text}
          onChangeText={setText}
        />
        <Pressable
          style={[s.addBtn, (!text.trim() || saving) && s.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!text.trim() || saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Plus size={20} color="#fff" />
          }
        </Pressable>
      </View>

      {loading
        ? <ActivityIndicator color="#a78bfa" style={{ marginTop: 40 }} />
        : <FlatList
            data={items}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <Text style={s.empty}>Lista jest pusta. Dodaj pierwszy element!</Text>
            }
          />
      }
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0a0a0a' },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingBottom: 12 },
  title:          { fontSize: 24, fontWeight: '300', color: '#fff', letterSpacing: 3, flex: 1 },
  inputRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  input:          { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a' },
  addBtn:         { backgroundColor: '#7c3aed', borderRadius: 12, width: 46, justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled: { opacity: 0.4 },
  list:           { paddingHorizontal: 16, paddingBottom: 20 },
  item:           { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  checkbox:       { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  checkboxDone:   { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  checkmark:      { color: '#fff', fontSize: 13, fontWeight: '500' },
  itemText:       { flex: 1, color: '#e5e5e5', fontSize: 15 },
  itemTextDone:   { color: '#444', textDecorationLine: 'line-through' },
  empty:          { color: '#444', textAlign: 'center', marginTop: 60, fontSize: 15 },
})