/**
 * @module useWakeWord
 * @description Zarządza cyklem życia detektora wake word.
 * Zachowanie jak VPN:
 * - startListening(): Android → ForegroundService persistent notification,
 *   iOS → Audio session background mode.
 * - stopListening(): cleanup obu platform.
 * - wakeWordEnabled false lub silent mode → automatyczny stop.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import { Audio } from 'expo-av'
import { useSettingsStore } from '../store/settingsStore'
import { useSilentMode } from './useSilentMode'
import { createWakeWordDetector, WakeWordDetector } from '../services/wakeWord'
import { createForegroundServiceManager, ForegroundServiceManager } from '../services/backgroundAudio/ForegroundServiceManager'

export type WakeWordState = 'idle' | 'listening_wake' | 'activated'

export function useWakeWord(onActivated: () => void) {
  const wakeWordEnabled = useSettingsStore(state => state.voice.wakeWordEnabled)
  const { isSilent } = useSilentMode()
  const [state, setState] = useState<WakeWordState>('idle')

  const detectorRef = useRef<WakeWordDetector | null>(null)
  const fgServiceRef = useRef<ForegroundServiceManager | null>(null)

  const stopListening = useCallback(async () => {
    await detectorRef.current?.stop()
    detectorRef.current = null

    await fgServiceRef.current?.stop()
    fgServiceRef.current = null

    // iOS: reset audio session
    if (Platform.OS === 'ios') {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingInaBackground: false,
          playsInSilentMode: false,
        })
      } catch { /* ignoruj */ }
    }

    setState('idle')
  }, [])

  const startListening = useCallback(async () => {
    if (state !== 'idle') return

    try {
      // iOS: ustaw audio session przed startem nagrania
      if (Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          allowsRecordingInaBackground: true,
          playsInSilentMode: true,
          staysActiveInBackground: true,
        })
      }

      // Android: persistent foreground notification
      fgServiceRef.current = createForegroundServiceManager()
      await fgServiceRef.current.start()

      // Detektor wake word
      detectorRef.current = createWakeWordDetector()
      detectorRef.current.onWakeWord = () => {
        setState('activated')
        onActivated()
        setTimeout(() => setState('listening_wake'), 3000)
      }

      setState('listening_wake')
      await detectorRef.current.start()
    } catch (e) {
      console.warn('[useWakeWord] błąd startu:', e)
      setState('idle')
    }
  }, [state, onActivated])

  // Auto-start / stop gdy zmienia się wakeWordEnabled lub silent mode
  useEffect(() => {
    if (wakeWordEnabled && !isSilent) {
      startListening()
    } else {
      stopListening()
    }

    return () => {
      detectorRef.current?.stop()
      fgServiceRef.current?.stop()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeWordEnabled, isSilent])

  return { wakeWordState: state, startListening, stopListening }
}
