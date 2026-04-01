/**
 * @module ForegroundServiceManager
 * @description Zarządza persistent notification na Android wymaganą przez
 * Foreground Service (FOREGROUND_SERVICE_MICROPHONE).
 * Na iOS audio session jest konfigurowany przez useWakeWord (expo-av).
 * UWAGA: Pełny Foreground Service wymaga natywnego kodu — dostępny po Build #5 EAS.
 * Ten moduł przygotowuje integrację po stronie JS.
 */

import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

const FOREGROUND_NOTIFICATION_ID = 'szepter-wake-word-foreground'

export interface ForegroundServiceManager {
  start(): Promise<void>
  stop(): Promise<void>
}

class AndroidForegroundServiceManager implements ForegroundServiceManager {
  async start(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      identifier: FOREGROUND_NOTIFICATION_ID,
      content: {
        title: 'Szepter nasłuchuje...',
        body: 'Powiedz "Szepter" aby wydać komendę głosową.',
        sticky: true,         // nie można odrzucić przez swipe
        data: { type: 'wake-word-foreground' },
        // @ts-ignore — pole Android-specific
        channelId: 'wake-word',
        ongoing: true,
      },
      trigger: null,
    })
  }

  async stop(): Promise<void> {
    await Notifications.dismissNotificationAsync(FOREGROUND_NOTIFICATION_ID)
      .catch(() => Notifications.cancelScheduledNotificationAsync(FOREGROUND_NOTIFICATION_ID))
  }
}

class IOSBackgroundAudioManager implements ForegroundServiceManager {
  // iOS: audio session skonfigurowany w useWakeWord przez expo-av
  async start(): Promise<void> { /* no-op — obsługa w useWakeWord */ }
  async stop(): Promise<void>  { /* no-op */ }
}

class NoOpForegroundServiceManager implements ForegroundServiceManager {
  async start(): Promise<void> { /* web / inne */ }
  async stop(): Promise<void>  { /* web / inne */ }
}

export function createForegroundServiceManager(): ForegroundServiceManager {
  if (Platform.OS === 'android') return new AndroidForegroundServiceManager()
  if (Platform.OS === 'ios')     return new IOSBackgroundAudioManager()
  return new NoOpForegroundServiceManager()
}
