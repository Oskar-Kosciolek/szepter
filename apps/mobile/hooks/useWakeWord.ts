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
import { setAudioModeAsync } from 'expo-audio'
import { useSettingsStore } from '../store/settingsStore'
import { useSilentMode } from './useSilentMode'
import { useEnergyDetector } from './useEnergyDetector'
import { transcriptionService } from '../services/transcription'
import { createForegroundServiceManager, ForegroundServiceManager } from '../services/backgroundAudio/ForegroundServiceManager'

export type WakeWordState = 'idle' | 'listening_wake' | 'activated'

const WAKE_WORD = 'szepter'

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[m][n]
}

function containsWakeWord(transcript: string): boolean {
  const words = transcript.toLowerCase().split(/\s+/)
  return words.some(word => levenshtein(word, WAKE_WORD) <= 2)
}

export function useWakeWord(onActivated: () => void) {
  const wakeWordEnabled = useSettingsStore(state => state.voice.wakeWordEnabled)
  const { isSilent } = useSilentMode()
  const [state, setState] = useState<WakeWordState>('idle')

  const fgServiceRef = useRef<ForegroundServiceManager | null>(null)
  const isTranscribing = useRef(false)
  const onActivatedRef = useRef(onActivated)
  onActivatedRef.current = onActivated

  const handleEnergyDetected = useCallback(async (uri: string) => {
    if (isTranscribing.current) return
    isTranscribing.current = true
    try {
      const result = await transcriptionService.transcribe(uri)
      if (result.error) {
        console.warn('[useWakeWord] błąd transkrypcji:', result.error)
        return
      }
      console.log('[useWakeWord] transkrypt:', result.text)
      if (containsWakeWord(result.text)) {
        setState('activated')
        onActivatedRef.current()
        setTimeout(() => setState('listening_wake'), 3000)
      }
    } catch (e) {
      console.warn('[useWakeWord] błąd transkrypcji:', e)
    } finally {
      isTranscribing.current = false
    }
  }, [])

  const { start: energyStart, stop: energyStop } = useEnergyDetector(handleEnergyDetected)

  const stopListening = useCallback(async () => {
    await energyStop()

    await fgServiceRef.current?.stop()
    fgServiceRef.current = null

    if (Platform.OS === 'ios') {
      try {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: false })
      } catch { /* ignoruj */ }
    }

    setState('idle')
  }, [energyStop])

  const startListening = useCallback(async () => {
    if (state !== 'idle') return
    try {
      if (Platform.OS === 'ios') {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        })
      }

      fgServiceRef.current = createForegroundServiceManager()
      await fgServiceRef.current.start()

      setState('listening_wake')
      await energyStart()
    } catch (e) {
      console.warn('[useWakeWord] błąd startu:', e)
      setState('idle')
    }
  }, [state, energyStart])

  useEffect(() => {
    if (wakeWordEnabled && !isSilent) {
      startListening()
    } else {
      stopListening()
    }

    return () => {
      energyStop()
      fgServiceRef.current?.stop()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeWordEnabled, isSilent])

  return { wakeWordState: state, startListening, stopListening }
}
