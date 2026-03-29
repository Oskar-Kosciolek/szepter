import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Trash2, Calendar } from 'lucide-react-native'
import { ListItem } from '../store/listsStore'

type Props = {
  item: ListItem
  onToggle: () => void
  onDelete: () => void
}

function deadlineColor(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff < 0) return '#ef4444'
  if (diff < 24 * 60 * 60 * 1000) return '#eab308'
  return '#555'
}

export function ListItemRow({ item, onToggle, onDelete }: Props) {
  return (
    <View style={s.item}>
      <Pressable style={[s.checkbox, item.done && s.checkboxDone]} onPress={onToggle}>
        {item.done && <Text style={s.checkmark}>✓</Text>}
      </Pressable>
      <View style={s.content}>
        <Text style={[s.itemText, item.done && s.itemTextDone]}>{item.content}</Text>
        {item.deadline && !item.done && (
          <View style={s.deadlineRow}>
            <Calendar size={10} color={deadlineColor(item.deadline)} />
            <Text style={[s.deadlineText, { color: deadlineColor(item.deadline) }]}>
              {new Date(item.deadline).toLocaleDateString('pl-PL', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </Text>
          </View>
        )}
      </View>
      <Pressable onPress={onDelete} hitSlop={12}>
        <Trash2 size={14} color="#333" />
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  item:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  checkmark:    { color: '#fff', fontSize: 13, fontWeight: '500' },
  content:      { flex: 1 },
  itemText:     { color: '#e5e5e5', fontSize: 15 },
  itemTextDone: { color: '#444', textDecorationLine: 'line-through' },
  deadlineRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  deadlineText: { fontSize: 11 },
})
