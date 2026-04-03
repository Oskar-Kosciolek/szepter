import { useCallback } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { WifiOff, RefreshCw } from 'lucide-react-native'
import { useNetworkSync } from '../hooks/useNetworkSync'
import { useNotesStore } from '../store/notesStore'
import { useListsStore } from '../store/listsStore'

export default function SyncIndicator() {
  const { isSyncing, isOnline, lastSync, forceSync } = useNetworkSync()
  const notesSyncError = useNotesStore(s => s.syncState.syncError)
  const listsSyncError = useListsStore(s => s.syncState.syncError)
  const hasError = !!(notesSyncError || listsSyncError)

  const handleRetry = useCallback(() => { forceSync() }, [forceSync])

  if (!isOnline) {
    return (
      <View style={styles.badge}>
        <WifiOff size={11} color="#f87171" />
        <Text style={[styles.label, { color: '#f87171' }]}>offline</Text>
      </View>
    )
  }

  if (isSyncing) {
    return (
      <View style={styles.badge}>
        <ActivityIndicator size={11} color="#a78bfa" />
        <Text style={[styles.label, { color: '#a78bfa' }]}>syncing...</Text>
      </View>
    )
  }

  if (hasError) {
    return (
      <Pressable style={styles.badge} onPress={handleRetry}>
        <RefreshCw size={11} color="#fbbf24" />
        <Text style={[styles.label, { color: '#fbbf24' }]}>retry sync</Text>
      </Pressable>
    )
  }

  return null
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
})
