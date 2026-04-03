import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import * as Network from 'expo-network'
import { syncService } from '../services/sync/SyncService'

export type NetworkSyncState = {
  isSyncing: boolean
  isOnline: boolean
  lastSync: Date | null
  forceSync: () => Promise<void>
}

export function useNetworkSync(): NetworkSyncState {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const wasOffline = useRef(false)
  const syncInFlight = useRef(false)

  const forceSync = useCallback(async () => {
    if (syncInFlight.current) return
    syncInFlight.current = true
    setIsSyncing(true)
    try {
      await syncService.syncAll()
      setLastSync(new Date())
    } finally {
      setIsSyncing(false)
      syncInFlight.current = false
    }
  }, [])

  const checkAndSync = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync()
      const online = !!(state.isConnected && state.isInternetReachable)
      setIsOnline(online)

      if (online && wasOffline.current) {
        wasOffline.current = false
        await forceSync()
      } else if (!online) {
        wasOffline.current = true
      }
    } catch {
      // expo-network not available — treat as online
    }
  }, [forceSync])

  useEffect(() => {
    // Sync on app foreground
    const appStateSub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') checkAndSync()
      }
    )

    // Subscribe to network changes if expo-network supports it
    let netSub: { remove: () => void } | undefined
    try {
      // addNetworkStateListener is available in expo-network >=6
      netSub = (Network as any).addNetworkStateListener?.(
        async (state: Network.NetworkState) => {
          const online = !!(state.isConnected && state.isInternetReachable)
          setIsOnline(online)
          if (online && wasOffline.current) {
            wasOffline.current = false
            await forceSync()
          } else if (!online) {
            wasOffline.current = true
          }
        }
      )
    } catch {
      // listener not supported — AppState fallback is sufficient
    }

    // Initial check
    checkAndSync()

    return () => {
      appStateSub.remove()
      netSub?.remove()
    }
  }, [checkAndSync, forceSync])

  return { isSyncing, isOnline, lastSync, forceSync }
}
