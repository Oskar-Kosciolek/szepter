import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Trash2, Calendar } from 'lucide-react-native'
import { Note } from '../store/notesStore'

type Props = {
  note: Note
  onDelete: (id: string) => void
}

function deadlineColor(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff < 0) return '#ef4444'          // przeterminowane — czerwony
  if (diff < 24 * 60 * 60 * 1000) return '#eab308' // < 24h — żółty
  return '#555'                            // normalny — szary
}

export function NoteCard({ note, onDelete }: Props) {
  return (
    <View style={s.card}>
      <Text style={s.cardText}>{note.content}</Text>
      {note.deadline && (
        <View style={s.deadlineRow}>
          <Calendar size={11} color={deadlineColor(note.deadline)} />
          <Text style={[s.deadlineText, { color: deadlineColor(note.deadline) }]}>
            {new Date(note.deadline).toLocaleDateString('pl-PL', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>
      )}
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
  card:         { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a' },
  cardText:     { color: '#e5e5e5', fontSize: 15, lineHeight: 22, marginBottom: 8 },
  deadlineRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  deadlineText: { fontSize: 12 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate:     { color: '#444', fontSize: 12 },
})
