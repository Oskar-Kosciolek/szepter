/**
 * @module EnergyDetector
 * @description Tani detektor aktywności głosowej oparty o metering dBFS.
 * Używa expo-av Audio.Recording z meteringEnabled.
 * Gdy energia przekroczy próg przez 300ms → wywołuje onEnergyDetected.
 * Cel: filtrowanie ciszy przed kosztowną transkrypcją whisper.rn.
 */

import { Audio } from 'expo-av'
import { useSettingsStore } from '../../store/settingsStore'

const POLL_INTERVAL_MS = 500
const SUSTAINED_MS = 300  // czas utrzymania energii powyżej progu
const WINDOW_SECONDS = 2  // długość okna nagrania przekazywanego do Whispera

export class EnergyDetector {
  private recording: Audio.Recording | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private aboveThresholdSince: number | null = null
  private running = false

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
      await Audio.setAudioModeAsync({
        allowsRecordingInaBackground: true,
        playsInSilentMode: true,
      })
      this.recording = new Audio.Recording()
      // await this.recording.prepareToRecordAsync({
      //   ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      //   isMeteringEnabled: true,
      // })
      await this.recording.prepareToRecordAsync(this.getRecordingOptions())
      await this.recording.startAsync()
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
        const status = await this.recording.getStatusAsync()
        if (!status.isRecording) return

        const threshold = useSettingsStore.getState().voice.wakeWordThreshold
        const metering = status.metering ?? -160
        // console.log('metering', metering/)

        if (metering > threshold) {
          if (this.aboveThresholdSince === null) {
            console.log(new Date().toISOString(), 'metering start capture', metering);
            this.aboveThresholdSince = Date.now()
          } else if (Date.now() - this.aboveThresholdSince >= SUSTAINED_MS) {
            console.log(new Date().toISOString(), 'metering end capture and emit', metering);
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
    this.recording = null
    if (!rec) return

    try {
      // Nagraj pełne okno zanim zatrzymasz
      await new Promise(resolve => setTimeout(resolve, WINDOW_SECONDS * 1000))
      await rec.stopAndUnloadAsync()
      const uri = rec.getURI()
      if (uri) this.onEnergyDetected?.(uri)
    } catch (e) {
      console.warn('[EnergyDetector] błąd zatrzymania:', e)
    }

    // Restartuj cykl po krótkim opóźnieniu
    setTimeout(() => this.startCycle(), 200)
  }

  private async stopRecording(): Promise<void> {
    this.clearPoll()
    try {
      await this.recording?.stopAndUnloadAsync()
    } catch { /* ignoruj — mogło być już zatrzymane */ }
    this.recording = null
  }

  private getRecordingOptions(): Audio.RecordingOptions {
  return {
    isMeteringEnabled: true,
    android: {
      extension: '.wav',
      outputFormat: Audio.AndroidOutputFormat.DEFAULT,
      audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 256000,
    },
    ios: {
      extension: '.wav',
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 256000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {},
  }
}
}
