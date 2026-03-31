import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Trash2, RotateCcw } from 'lucide-react-native'
import { useRecordingsStore, Recording } from '../../store/recordingsStore'
import { useCommand } from '../../hooks/useCommand'
import { EmptyState } from '../../components/EmptyState'

const COMMAND_LABELS: Record<string, string> = {
  save_note:        'notatka',
  save_task:        'zadanie',
  read_notes:       'odczyt',
  create_list:      'nowa lista',
  add_to_list:      'dodaj do listy',
  add_task_to_list: 'zadanie na liście',
  delete_last_note: 'usuń notatkę',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Dziś ${time}`
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) + ` ${time}`
}

function formatDuration(secs: number | null) {
  if (!secs) return null
  if (secs < 60) return `${secs.toFixed(1)}s`
  return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`
}

type RowProps = {
  item: Recording
  onDelete: (id: string) => void
  onReplay: (transcript: string) => void
  replayingId: string | null
}

function RecordingRow({ item, onDelete, onReplay, replayingId }: RowProps) {
  const isReplaying = replayingId === item.id
  const label = item.command_type ? COMMAND_LABELS[item.command_type] : null
  const dur = formatDuration(item.duration_seconds)

  return (
    <View style={s.row}>
      <View style={s.rowMain}>
        <View style={s.rowMeta}>
          {label && <View style={s.badge}><Text style={s.badgeText}>{label}</Text></View>}
          <Text style={s.dateText}>{formatDate(item.created_at)}</Text>
          {dur && <Text style={s.durText}>{dur}</Text>}
        </View>
        <Text style={s.transcript} numberOfLines={3}>{item.transcript}</Text>
      </View>
      <View style={s.rowActions}>
        <Pressable
          style={[s.actionBtn, s.replayBtn, isReplaying && s.actionBtnDisabled]}
          onPress={() => onReplay(item.transcript)}
          disabled={isReplaying || replayingId !== null}
        >
          {isReplaying
            ? <ActivityIndicator size="small" color="#a78bfa" />
            : <RotateCcw size={16} color="#a78bfa" />
          }
        </Pressable>
        <Pressable
          style={[s.actionBtn, s.deleteBtn]}
          onPress={() => onDelete(item.id)}
        >
          <Trash2 size={16} color="#f87171" />
        </Pressable>
      </View>
    </View>
  )
}

export default function HistoryScreen() {
  const { recordings, loading, fetchRecordings, deleteRecording } = useRecordingsStore()
  const { executeCommand } = useCommand()
  const [refreshing, setRefreshing] = useState(false)
  const [replayingId, setReplayingId] = useState<string | null>(null)

  useEffect(() => { fetchRecordings() }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchRecordings()
    setRefreshing(false)
  }, [fetchRecordings])

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Usuń nagranie', 'Na pewno usunąć to nagranie?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => deleteRecording(id) },
    ])
  }, [deleteRecording])

  const handleReplay = useCallback(async (transcript: string, id: string) => {
    setReplayingId(id)
    try {
      await executeCommand(transcript)
    } finally {
      setReplayingId(null)
    }
  }, [executeCommand])

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Historia</Text>
      {loading && recordings.length === 0
        ? <ActivityIndicator color="#a78bfa" style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={recordings}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <RecordingRow
                item={item}
                onDelete={handleDelete}
                onReplay={(t) => handleReplay(t, item.id)}
                replayingId={replayingId}
              />
            )}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <EmptyState message="Brak nagrań. Użyj mikrofonu aby zacząć." />
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#a78bfa"
              />
            }
          />
        )
      }
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0a0a0a' },
  title:            { fontSize: 28, fontWeight: '300', color: '#fff', letterSpacing: 4, margin: 20, marginBottom: 12 },
  list:             { paddingHorizontal: 16, paddingBottom: 20 },
  row:              { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a', flexDirection: 'row', gap: 10 },
  rowMain:          { flex: 1, gap: 6 },
  rowMeta:          { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge:            { backgroundColor: '#1a0a2e', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#4c1d95' },
  badgeText:        { color: '#a78bfa', fontSize: 10, fontWeight: '600' },
  dateText:         { color: '#555', fontSize: 12 },
  durText:          { color: '#444', fontSize: 11 },
  transcript:       { color: '#ccc', fontSize: 14, lineHeight: 20 },
  rowActions:       { justifyContent: 'center', gap: 8 },
  actionBtn:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionBtnDisabled:{ opacity: 0.4 },
  replayBtn:        { backgroundColor: '#1a0a2e', borderWidth: 1, borderColor: '#4c1d95' },
  deleteBtn:        { backgroundColor: '#1a0a0a', borderWidth: 1, borderColor: '#3f1a1a' },
})
