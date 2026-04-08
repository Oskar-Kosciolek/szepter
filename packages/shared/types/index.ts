// ─── Domain types ──────────────────────────────────────────────────────────
// Shared between mobile (Expo) and web (Next.js).
// These are the clean public-facing types — no platform-specific fields.

export type Note = {
  id: string
  content: string
  transcript: string | null
  created_at: string
  deadline?: string | null
  notified?: boolean
  is_recurring?: boolean
  recurrence_rule?: string | null
  google_event_id?: string | null
}

export type ListItem = {
  id: string
  list_id: string
  content: string
  done: boolean
  position: number
  created_at: string
  deadline?: string | null
  is_recurring?: boolean
  recurrence_rule?: string | null
  google_event_id?: string | null
}

export type List = {
  id: string
  title: string
  created_at: string
  items?: ListItem[]
}

// ─── Sync infrastructure types ─────────────────────────────────────────────

export type SyncResult = {
  pushed: number
  pulled: number
  conflicts: number
  errors: string[]
}

export type SyncState = {
  isSyncing: boolean
  lastSync: Date | null
  syncError: string | null
}

// ─── SyncService interface (Strategy pattern) ──────────────────────────────
// Mobile implements: SupabaseSyncService (expo-sqlite + AsyncStorage)
// Web implements: (future) WebSyncService or shares Supabase Realtime

export interface SyncService {
  syncAll(): Promise<SyncResult>
  syncNotes(): Promise<SyncResult>
  syncLists(): Promise<SyncResult>
  syncListItems(): Promise<SyncResult>
}
