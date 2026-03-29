import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Trash2, ChevronRight } from 'lucide-react-native'
import { List } from '../store/listsStore'

type Props = {
  list: List
  onDelete: (id: string) => void
  onPress: () => void
}

export function ListCard({ list, onDelete, onPress }: Props) {
  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.cardContent}>
        <Text style={s.cardTitle}>{list.title}</Text>
        <Text style={s.cardDate}>
          {new Date(list.created_at).toLocaleDateString('pl-PL', {
            day: 'numeric', month: 'short'
          })}
        </Text>
      </View>
      <View style={s.cardActions}>
        <Pressable onPress={() => onDelete(list.id)} hitSlop={12}>
          <Trash2 size={16} color="#444" />
        </Pressable>
        <ChevronRight size={16} color="#444" style={{ marginLeft: 12 }} />
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card:        { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a', flexDirection: 'row', alignItems: 'center' },
  cardContent: { flex: 1 },
  cardTitle:   { color: '#e5e5e5', fontSize: 15, fontWeight: '500', marginBottom: 4 },
  cardDate:    { color: '#444', fontSize: 12 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
})
