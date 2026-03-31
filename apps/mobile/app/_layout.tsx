import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '../store/authStore'
import { View, ActivityIndicator } from 'react-native'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function RootLayout() {
  const { session, loading, fetchSession } = useAuthStore()

  useEffect(() => { fetchSession() }, [])

  useEffect(() => {
    // Obsługa deep linku gdy aplikacja jest już otwarta
    const sub = Linking.addEventListener('url', ({ url }) => {
      supabase.auth.setSession
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
      AsyncStorage.getItem('onboarding_completed').then(done => {
        if (done) router.replace('/(tabs)')
        else router.replace('/onboarding')
      })
    } else {
      router.replace('/login')
    }
  }, [session, loading])

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#a78bfa" />
    </View>
  )

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}