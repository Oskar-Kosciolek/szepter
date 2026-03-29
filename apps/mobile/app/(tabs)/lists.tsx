import { View, Text, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus } from 'lucide-react-native'
import { useLists } from '../../hooks/useLists'
import { ListCard } from '../../components/ListCard'
import { EmptyState } from '../../components/EmptyState'
import { router } from 'expo-router'

export default function ListsScreen() {
  const { lists, loading, text, setText, saving, handleCreate, handleDelete } = useLists()

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Listy</Text>
      <View style={s.inputRow}>
        <TextInput style={s.input} placeholder="Nowa lista..." placeholderTextColor="#444" value={text} onChangeText={setText} />
        <Pressable style={[s.addBtn, (!text.trim() || saving) && s.addBtnDisabled]} onPress={handleCreate} disabled={!text.trim() || saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Plus size={20} color="#fff" />}
        </Pressable>
      </View>
      {loading
        ? <ActivityIndicator color="#a78bfa" style={{ marginTop: 40 }} />
        : <FlatList
            data={lists}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ListCard list={item} onDelete={handleDelete} onPress={() => router.push(`/list/${item.id}?title=${encodeURIComponent(item.title)}`)} />
            )}
            contentContainerStyle={s.list}
            ListEmptyComponent={<EmptyState message="Brak list. Stwórz pierwszą!" />}
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
})
