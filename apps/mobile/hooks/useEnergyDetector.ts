import { useAudioRecorder, RecordingOptions, AudioQuality } from 'expo-audio'
import { useCallback, useRef } from 'react'
import { useSettingsStore } from '../store/settingsStore'

const POLL_INTERVAL_MS = 500
const SUSTAINED_MS = 300  // czas utrzymania energii powyżej progu
const WINDOW_SECONDS = 2  // długość okna nagrania przekazywanego do WakeWordService

export function useEnergyDetector(onEnergyDetected: (uri: string) => void) {
  const recorder = useAudioRecorder(getRecordingOptions())
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const aboveThresholdSince = useRef<number | null>(null)
  const isRunning = useRef(false)
  const isCapturing = useRef(false)
  // Ref łamie cykl: startPoll → captureAndEmit → startCycle → startPoll
  const captureAndEmitRef = useRef<() => Promise<void>>(async () => {})

  const clearPoll = useCallback(() => {
    if (pollTimer.current !== null) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  const startPoll = useCallback(() => {
    clearPoll()
    pollTimer.current = setInterval(async () => {
      if (isCapturing.current || !isRunning.current) return
      try {
        const status = recorder.getStatus()
        if (!status.isRecording) return

        const threshold = useSettingsStore.getState().voice.wakeWordThreshold
        const metering = status.metering ?? -160

        if (metering > threshold) {
          if (aboveThresholdSince.current === null) {
            aboveThresholdSince.current = Date.now()
          } else if (Date.now() - aboveThresholdSince.current >= SUSTAINED_MS) {
            aboveThresholdSince.current = null
            await captureAndEmitRef.current()
          }
        } else {
          aboveThresholdSince.current = null
        }
      } catch { /* recording mogło się zakończyć */ }
    }, POLL_INTERVAL_MS)
  }, [clearPoll, recorder])

  const startCycle = useCallback(async () => {
    if (!isRunning.current) return

    try {
      isCapturing.current = false
      await recorder.prepareToRecordAsync(getRecordingOptions())
      recorder.record()
      aboveThresholdSince.current = null
      startPoll()
    } catch (e) {
      console.warn('[EnergyDetector] błąd startu nagrania:', e)
    }
  }, [startPoll, recorder])

  const captureAndEmit = useCallback(async () => {
    if (isCapturing.current) return

    isCapturing.current = true
    clearPoll()

    try {
      await new Promise(resolve => setTimeout(resolve, WINDOW_SECONDS * 1000))
      await recorder.stop()
      const uri = recorder.uri
      if (uri) onEnergyDetected(uri)
    } catch (e) {
      console.warn('[EnergyDetector] błąd zatrzymania:', e)
    }
    setTimeout(() => startCycle(), 200)
  }, [clearPoll, recorder, onEnergyDetected, startCycle])

  // Aktualizuj ref przy każdym renderze — bez useEffect, bo to tylko przypisanie refa
  captureAndEmitRef.current = captureAndEmit

  const start = useCallback(async () => {
    if (isRunning.current) return
    isRunning.current = true
    await startCycle()
  }, [startCycle])

  const stop = useCallback(async () => {
    isRunning.current = false
    clearPoll()
    try {
      await recorder.stop()
    } catch { /* ignoruj — mogło być już zatrzymane */ }
  }, [clearPoll, recorder])

  return { start, stop }
}

function getRecordingOptions(): RecordingOptions {
  return {
    isMeteringEnabled: true,
    extension: '.wav',
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    android: {
      outputFormat: 'default',
      audioEncoder: 'default',
    },
    ios: {
      audioQuality: AudioQuality.HIGH,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {},
  }
}
