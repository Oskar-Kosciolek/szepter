import { View, Text, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNotes } from '../../hooks/useNotes'
import { NoteCard } from '../../components/NoteCard'
import { EmptyState } from '../../components/EmptyState'
import { DeadlinePicker } from '../../components/DeadlinePicker'

export default function NotesScreen() {
  const { notes, loading, text, setText, deadline, setDeadline, saving, handleAdd, handleDelete } = useNotes()

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Notatki</Text>
      <View style={s.inputWrap}>
        <View style={s.inputRow}>
          <TextInput style={s.input} placeholder="Nowa notatka..." placeholderTextColor="#444" value={text} onChangeText={setText} multiline />
          <Pressable style={[s.addBtn, (!text.trim() || saving) && s.addBtnDisabled]} onPress={handleAdd} disabled={!text.trim() || saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.addBtnText}>Zapisz</Text>}
          </Pressable>
        </View>
        <DeadlinePicker value={deadline} onChange={setDeadline} />
      </View>
      {loading
        ? <ActivityIndicator color="#a78bfa" style={{ marginTop: 40 }} />
        : <FlatList
            data={notes}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <NoteCard note={item} onDelete={handleDelete} />}
            contentContainerStyle={s.list}
            ListEmptyComponent={<EmptyState message="Brak notatek. Dodaj pierwszą!" />}
          />
      }
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0a0a0a' },
  title:          { fontSize: 28, fontWeight: '300', color: '#fff', letterSpacing: 4, margin: 20, marginBottom: 12 },
  inputWrap:      { paddingHorizontal: 16, marginBottom: 16 },
  inputRow:       { flexDirection: 'row', gap: 8 },
  input:          { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a', maxHeight: 100 },
  addBtn:         { backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText:     { color: '#fff', fontWeight: '500', fontSize: 14 },
  list:           { paddingHorizontal: 16, paddingBottom: 20 },
})
