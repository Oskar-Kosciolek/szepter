/**
 * @module EnergyDetector
 * @description Tani detektor aktywności głosowej oparty o metering dBFS.
 * Używa expo-audio AudioRecorder z meteringEnabled.
 * Gdy energia przekroczy próg przez 300ms → wywołuje onEnergyDetected.
 * Cel: filtrowanie ciszy przed kosztowną transkrypcją whisper.rn.
 */

import { AudioQuality, RecordingOptions } from 'expo-audio'
import type { AudioRecorder } from 'expo-audio'
import AudioModule from 'expo-audio/build/AudioModule'
import { useSettingsStore } from '../../store/settingsStore'

const POLL_INTERVAL_MS = 500
const SUSTAINED_MS = 300  // czas utrzymania energii powyżej progu
const WINDOW_SECONDS = 2  // długość okna nagrania przekazywanego do Whispera

export class EnergyDetector {
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private aboveThresholdSince: number | null = null
  private running = false
  private recording = false
  private recorder: AudioRecorder = new AudioModule.AudioRecorder({})

  /** Wywołany gdy energia utrzymuje się powyżej progu przez SUSTAINED_MS. */
  onEnergyDetected: ((uri: string) => void) | null = null

  async start(): Promise<void> {
    if (this.running) return
    this.running = true
    await this.startCycle()
  }

  async stop(): Promise<void> {
    this.running = false
    this.clearPoll()
    await this.stopRecording()
  }

  private async startCycle(): Promise<void> {
    if (!this.running) return
    try {
      this.recording = true;
      await this.recorder.prepareToRecordAsync(this.getRecordingOptions())
      await this.recorder.record()
      this.aboveThresholdSince = null
      this.startPoll()
    } catch (e) {
      console.warn('[EnergyDetector] błąd startu nagrania:', e)
    }
  }

  private startPoll(): void {
    this.clearPoll()
    this.pollTimer = setInterval(async () => {
      if (!this.recording || !this.running) return
      try {
        const status = await this.recorder.getStatus()
        console.log(status)
        if (!status.isRecording) return

        const threshold = useSettingsStore.getState().voice.wakeWordThreshold
        const metering = status.metering ?? -160

        console.log(metering)
        if (metering > threshold) {
          console.log('above threshold')
          if (this.aboveThresholdSince === null) {
            this.aboveThresholdSince = Date.now()
          } else if (Date.now() - this.aboveThresholdSince >= SUSTAINED_MS) {
            // Energia utrzymana — nagraj okno i przekaż
            this.aboveThresholdSince = null
            await this.captureAndEmit()
          }
        } else {
          this.aboveThresholdSince = null
        }
      } catch { /* recording mogło się zakończyć */ }
    }, POLL_INTERVAL_MS)
  }

  private clearPoll(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  private async captureAndEmit(): Promise<void> {
    this.clearPoll()
    const rec = this.recording
    this.recording = false
    if (!rec) return

    try {
      // Nagraj pełne okno zanim zatrzymasz
      await new Promise(resolve => setTimeout(resolve, WINDOW_SECONDS * 1000))
      await this.recorder.stop()
      const uri = this.recorder.uri
      if (uri) this.onEnergyDetected?.(uri)
    } catch (e) {
      console.warn('[EnergyDetector] błąd zatrzymania:', e)
    }

    // Restartuj cykl po krótkim opóźnieniu
    setTimeout(() => this.startCycle(), 200)
  }

  private async stopRecording(): Promise<void> {
    this.clearPoll()
    if (!this.recording) return
    this.recording = false
    try {
      await this.recorder.stop()
    } catch { /* ignoruj — mogło być już zatrzymane */ }
  }

  private getRecordingOptions(): RecordingOptions {
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
}
