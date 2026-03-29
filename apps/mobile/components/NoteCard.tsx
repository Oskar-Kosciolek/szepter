import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Trash2 } from 'lucide-react-native'
import { Note } from '../store/notesStore'

type Props = {
  note: Note
  onDelete: (id: string) => void
}

export function NoteCard({ note, onDelete }: Props) {
  return (
    <View style={s.card}>
      <Text style={s.cardText}>{note.content}</Text>
      <View style={s.cardFooter}>
        <Text style={s.cardDate}>
          {new Date(note.created_at).toLocaleDateString('pl-PL', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
        <Pressable onPress={() => onDelete(note.id)} hitSlop={12}>
          <Trash2 size={16} color="#444" />
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card:       { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a' },
  cardText:   { color: '#e5e5e5', fontSize: 15, lineHeight: 22, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate:   { color: '#444', fontSize: 12 },
})
