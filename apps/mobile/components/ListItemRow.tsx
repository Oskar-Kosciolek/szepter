import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Trash2 } from 'lucide-react-native'
import { ListItem } from '../store/listsStore'

type Props = {
  item: ListItem
  onToggle: () => void
  onDelete: () => void
}

export function ListItemRow({ item, onToggle, onDelete }: Props) {
  return (
    <View style={s.item}>
      <Pressable
        style={[s.checkbox, item.done && s.checkboxDone]}
        onPress={onToggle}
      >
        {item.done && <Text style={s.checkmark}>✓</Text>}
      </Pressable>
      <Text style={[s.itemText, item.done && s.itemTextDone]}>
        {item.content}
      </Text>
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
  itemText:     { flex: 1, color: '#e5e5e5', fontSize: 15 },
  itemTextDone: { color: '#444', textDecorationLine: 'line-through' },
})
