/**
 * @module NotificationService
 * @description Interfejs serwisu powiadomień push. Wzorzec Strategy —
 * domyślna implementacja: ExpoNotificationService.
 */

export interface NotificationService {
  /** Żąda uprawnień do powiadomień. Zwraca true gdy przyznane. */
  requestPermissions(): Promise<boolean>
  /** Pokazuje powiadomienie natychmiast (dla przypomnień o deadline). */
  scheduleImmediate(title: string, body: string, data?: Record<string, unknown>): Promise<string>
  /** Anuluje konkretne powiadomienie po ID. */
  cancel(notificationId: string): Promise<void>
  /** Anuluje wszystkie zaplanowane powiadomienia. */
  cancelAll(): Promise<void>
}
