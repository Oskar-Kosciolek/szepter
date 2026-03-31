import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, Plus } from 'lucide-react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useListDetail } from '../../hooks/useListDetail'
import { ListItemRow } from '../../components/ListItemRow'
import { EmptyState } from '../../components/EmptyState'
import { DeadlinePicker } from '../../components/DeadlinePicker'
import { DraggableList } from '../../components/DraggableList'
import { ListItem } from '../../store/listsStore'

export default function ListDetailScreen() {
  const { id, title } = useLocalSearchParams<{ id: string, title: string }>()
  const {
    items, loading, text, setText, deadline, setDeadline,
    saving, handleAdd, handleToggle, handleDelete, handleReorder,
  } = useListDetail(id)

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color="#fff" />
        </Pressable>
        <Text style={s.title} numberOfLines={1}>{decodeURIComponent(title)}</Text>
      </View>
      <View style={s.inputWrap}>
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
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Plus size={20} color="#fff" />}
          </Pressable>
        </View>
        <DeadlinePicker value={deadline} onChange={setDeadline} />
      </View>

      {loading
        ? <ActivityIndicator color="#a78bfa" style={{ marginTop: 40 }} />
        : (
          <DraggableList<ListItem>
            data={items}
            keyExtractor={item => item.id}
            renderItem={(item) => (
              <ListItemRow
                item={item}
                onToggle={() => handleToggle(item)}
                onDelete={() => handleDelete(item)}
              />
            )}
            onReorder={handleReorder}
            contentContainerStyle={s.list}
            ListEmptyComponent={<EmptyState message="Lista jest pusta. Dodaj pierwszy element!" />}
          />
        )
      }
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0a0a0a' },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingBottom: 12 },
  title:          { fontSize: 24, fontWeight: '300', color: '#fff', letterSpacing: 3, flex: 1 },
  inputWrap:      { paddingHorizontal: 16, marginBottom: 16 },
  inputRow:       { flexDirection: 'row', gap: 8 },
  input:          { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a' },
  addBtn:         { backgroundColor: '#7c3aed', borderRadius: 12, width: 46, justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled: { opacity: 0.4 },
  list:           { paddingHorizontal: 16, paddingBottom: 20 },
})
