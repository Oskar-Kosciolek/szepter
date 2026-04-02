/**
 * @module ExpoNotificationService
 * @description Implementacja NotificationService przy użyciu expo-notifications.
 * Obsługuje Android (kanał "reminders") i iOS.
 */

import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { NotificationService } from './NotificationService'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export class ExpoNotificationService implements NotificationService {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Przypomnienia',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7c3aed',
      })
      await Notifications.setNotificationChannelAsync('wake-word', {
        name: 'Nasłuch w tle',
        importance: Notifications.AndroidImportance.MIN,
        showBadge: false,
      })
    }

    const { status: existing } = await Notifications.getPermissionsAsync()
    if (existing === 'granted') return true

    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  }

  async scheduleImmediate(
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      },
      trigger: null, // natychmiast
    })
  }

  async cancel(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  }

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }
}
