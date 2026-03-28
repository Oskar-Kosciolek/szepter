import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Trash2 } from 'lucide-react-native'
import { useNotesStore, Note } from '../../store/notesStore'

export default function NotesScreen() {
  const { notes, loading, fetchNotes, addNote, deleteNote } = useNotesStore()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchNotes() }, [])

  const handleAdd = async () => {
    if (!text.trim()) return
    setSaving(true)
    await addNote(text.trim())
    setText('')
    setSaving(false)
  }

  const handleDelete = (id: string) => {
    Alert.alert('Usuń notatkę', 'Na pewno?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => deleteNote(id) },
    ])
  }

  const renderNote = ({ item }: { item: Note }) => (
    <View style={s.card}>
      <Text style={s.cardText}>{item.content}</Text>
      <View style={s.cardFooter}>
        <Text style={s.cardDate}>
          {new Date(item.created_at).toLocaleDateString('pl-PL', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
        <Pressable onPress={() => handleDelete(item.id)} hitSlop={12}>
          <Trash2 size={16} color="#444" />
        </Pressable>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Notatki</Text>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Nowa notatka..."
          placeholderTextColor="#444"
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable
          style={[s.addBtn, (!text.trim() || saving) && s.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!text.trim() || saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.addBtnText}>Zapisz</Text>
          }
        </Pressable>
      </View>

      {loading
        ? <ActivityIndicator color="#a78bfa" style={{ marginTop: 40 }} />
        : <FlatList
            data={notes}
            keyExtractor={item => item.id}
            renderItem={renderNote}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <Text style={s.empty}>Brak notatek. Dodaj pierwszą!</Text>
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
  input:          { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a', maxHeight: 100 },
  addBtn:         { backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText:     { color: '#fff', fontWeight: '500', fontSize: 14 },
  list:           { paddingHorizontal: 16, paddingBottom: 20 },
  card:           { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a' },
  cardText:       { color: '#e5e5e5', fontSize: 15, lineHeight: 22, marginBottom: 10 },
  cardFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate:       { color: '#444', fontSize: 12 },
  empty:          { color: '#444', textAlign: 'center', marginTop: 60, fontSize: 15 },
})