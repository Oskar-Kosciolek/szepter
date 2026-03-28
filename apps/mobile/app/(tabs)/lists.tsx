import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Trash2, Plus, ChevronRight } from 'lucide-react-native'
import { useListsStore, List } from '../../store/listsStore'
import { router } from 'expo-router'

export default function ListsScreen() {
  const { lists, loading, fetchLists, createList, deleteList } = useListsStore()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchLists() }, [])

  const handleCreate = async () => {
    if (!text.trim()) return
    setSaving(true)
    await createList(text.trim())
    setText('')
    setSaving(false)
  }

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Usuń listę', `Usunąć "${title}" wraz z zawartością?`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => deleteList(id) },
    ])
  }

  const renderList = ({ item }: { item: List }) => (
    <Pressable
      style={s.card}
      onPress={() => router.push(`/list/${item.id}?title=${encodeURIComponent(item.title)}`)}
    >
      <View style={s.cardContent}>
        <Text style={s.cardTitle}>{item.title}</Text>
        <Text style={s.cardDate}>
          {new Date(item.created_at).toLocaleDateString('pl-PL', {
            day: 'numeric', month: 'short'
          })}
        </Text>
      </View>
      <View style={s.cardActions}>
        <Pressable onPress={() => handleDelete(item.id, item.title)} hitSlop={12}>
          <Trash2 size={16} color="#444" />
        </Pressable>
        <ChevronRight size={16} color="#444" style={{ marginLeft: 12 }} />
      </View>
    </Pressable>
  )

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Listy</Text>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Nowa lista..."
          placeholderTextColor="#444"
          value={text}
          onChangeText={setText}
        />
        <Pressable
          style={[s.addBtn, (!text.trim() || saving) && s.addBtnDisabled]}
          onPress={handleCreate}
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
            data={lists}
            keyExtractor={item => item.id}
            renderItem={renderList}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <Text style={s.empty}>Brak list. Stwórz pierwszą!</Text>
            }
          />
      }
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0a0a0a' },
  title:          { fontSize: 28, fontWeight: '300', color: '#fff', letterSpacing: 4, margin: 20, marginBottom: 12 },
  inputRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  input:          { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a' },
  addBtn:         { backgroundColor: '#7c3aed', borderRadius: 12, width: 46, justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled: { opacity: 0.4 },
  list:           { paddingHorizontal: 16, paddingBottom: 20 },
  card:           { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a', flexDirection: 'row', alignItems: 'center' },
  cardContent:    { flex: 1 },
  cardTitle:      { color: '#e5e5e5', fontSize: 15, fontWeight: '500', marginBottom: 4 },
  cardDate:       { color: '#444', fontSize: 12 },
  cardActions:    { flexDirection: 'row', alignItems: 'center' },
  empty:          { color: '#444', textAlign: 'center', marginTop: 60, fontSize: 15 },
})