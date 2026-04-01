import { ExpoNotificationService } from './ExpoNotificationService'
import type { NotificationService } from './NotificationService'

export const notificationService: NotificationService = new ExpoNotificationService()
export type { NotificationService } from './NotificationService'
