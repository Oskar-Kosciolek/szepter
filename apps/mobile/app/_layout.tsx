import { useEffect, useRef } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '../store/authStore'
import { View, ActivityIndicator } from 'react-native'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { notificationService } from '../services/notifications'
import { registerReminderTask } from '../tasks/reminderTask'
import { initLocalDb } from '../lib/localDb'
import { syncService } from '../services/sync/SyncService'
import SyncIndicator from '../components/SyncIndicator'

// Initialise SQLite once at module load (sync, before any render)
initLocalDb()

export default function RootLayout() {
  const { session, loading, fetchSession } = useAuthStore()
  const didSeedRef = useRef(false)

  useEffect(() => { fetchSession() }, [])

  useEffect(() => {
    notificationService.requestPermissions().catch(console.warn)
    registerReminderTask().catch(console.warn)
  }, [])

  useEffect(() => {
    // Obsługa deep linku gdy aplikacja jest już otwarta
    const sub = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url)
      if (parsed.queryParams?.access_token) {
        supabase.auth.setSession({
          access_token: parsed.queryParams.access_token as string,
          refresh_token: parsed.queryParams.refresh_token as string,
        })
      }
    })

    // Obsługa deep linku gdy aplikacja była zamknięta
    Linking.getInitialURL().then(url => {
      if (!url) return
      const parsed = Linking.parse(url)
      if (parsed.queryParams?.access_token) {
        supabase.auth.setSession({
          access_token: parsed.queryParams.access_token as string,
          refresh_token: parsed.queryParams.refresh_token as string,
        })
      }
    })

    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (loading) return

    if (session) {
      // Full sync on login (seed na nowym urządzeniu obsługuje authStore)
      if (!didSeedRef.current) {
        didSeedRef.current = true
        syncService.syncAll().catch(console.warn)
      }

      AsyncStorage.getItem('onboarding_completed').then(done => {
        if (done) router.replace('/(tabs)')
        else router.replace('/onboarding')
      })
    } else {
      didSeedRef.current = false
      router.replace('/login')
    }
  }, [session, loading])

  if (loading) return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#a78bfa" />
      </View>
    </GestureHandlerRootView>
  )

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
        {session && (
          <View style={{ position: 'absolute', top: 52, right: 14 }}>
            <SyncIndicator />
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  )
}
