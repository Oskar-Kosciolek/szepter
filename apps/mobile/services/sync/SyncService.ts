import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../../lib/supabase'
import {
  getUnsyncedNotes, getDeletedNotes, markNoteSynced, deleteNoteLocal, saveNote,
  getNoteById,
  getUnsyncedLists, getDeletedLists, markListSynced, deleteListLocal, saveList,
  getListById,
  getUnsyncedListItems, getDeletedListItems, markListItemSynced, deleteListItemLocal,
  saveListItem,
  type LocalNote, type LocalList, type LocalListItem,
} from '../../lib/localDb'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SyncResult {
  pushed: number
  pulled: number
  conflicts: number
  errors: string[]
}

export interface SyncService {
  syncAll(): Promise<SyncResult>
  syncNotes(): Promise<SyncResult>
  syncLists(): Promise<SyncResult>
  syncListItems(): Promise<SyncResult>
}

// ─── AsyncStorage keys ──────────────────────────────────────────────────────

const KEYS = {
  notes: 'sync_timestamp_notes',
  lists: 'sync_timestamp_lists',
  list_items: 'sync_timestamp_list_items',
}

async function getLastSync(table: keyof typeof KEYS): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS[table])
}

async function setLastSync(table: keyof typeof KEYS): Promise<void> {
  await AsyncStorage.setItem(KEYS[table], new Date().toISOString())
}

// ─── SupabaseSyncService ────────────────────────────────────────────────────

export class SupabaseSyncService implements SyncService {

  // ── Notes ──────────────────────────────────────────────────────────────

  async syncNotes(): Promise<SyncResult> {
    const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return result

    // 1. PUSH unsynced
    try {
      const unsynced = await getUnsyncedNotes()
      for (const note of unsynced) {
        const { error } = await supabase.from('notes').upsert({
          id: note.id,
          user_id: note.user_id,
          content: note.content,
          transcript: note.transcript,
          created_at: note.created_at,
          updated_at: note.updated_at,
          deadline: note.deadline,
          notified: note.notified === 1,
          is_recurring: note.is_recurring === 1,
          recurrence_rule: note.recurrence_rule,
          google_event_id: note.google_event_id,
        }, { onConflict: 'id' })

        if (error) {
          result.errors.push(`push note ${note.id}: ${error.message}`)
        } else {
          await markNoteSynced(note.id)
          result.pushed++
        }
      }
    } catch (e) {
      result.errors.push(`push notes: ${String(e)}`)
    }

    // 2. PUSH deletes
    try {
      const deleted = await getDeletedNotes()
      for (const note of deleted) {
        const { error } = await supabase.from('notes').delete().eq('id', note.id)
        if (error) {
          result.errors.push(`delete note ${note.id}: ${error.message}`)
        } else {
          await deleteNoteLocal(note.id)
        }
      }
    } catch (e) {
      result.errors.push(`delete notes: ${String(e)}`)
    }

    // 3. PULL from Supabase
    try {
      const lastSync = await getLastSync('notes')
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)

      if (lastSync) {
        query = query.gt('updated_at', lastSync)
      }

      const { data: remoteNotes, error } = await query
      if (error) {
        result.errors.push(`pull notes: ${error.message}`)
      } else if (remoteNotes) {
        for (const remote of remoteNotes) {
          const local = await getNoteById(remote.id)

          // Conflict: both modified — last write wins by updated_at
          if (local && local._synced === 0 && local._deleted === 0) {
            const remoteTs = new Date(remote.updated_at).getTime()
            const localTs = new Date(local.updated_at).getTime()
            if (remoteTs >= localTs) {
              result.conflicts++
            } else {
              // Local is newer — skip this remote record
              continue
            }
          }

          await saveNote({
            id: remote.id,
            user_id: remote.user_id,
            content: remote.content,
            transcript: remote.transcript ?? null,
            created_at: remote.created_at,
            updated_at: remote.updated_at,
            deadline: remote.deadline ?? null,
            notified: remote.notified ? 1 : 0,
            is_recurring: remote.is_recurring ? 1 : 0,
            recurrence_rule: remote.recurrence_rule ?? null,
            google_event_id: remote.google_event_id ?? null,
            _synced: 1,
            _deleted: 0,
          })
          result.pulled++
        }
      }
    } catch (e) {
      result.errors.push(`pull notes: ${String(e)}`)
    }

    await setLastSync('notes')
    return result
  }

  // ── Lists ──────────────────────────────────────────────────────────────

  async syncLists(): Promise<SyncResult> {
    const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return result

    // 1. PUSH unsynced
    try {
      const unsynced = await getUnsyncedLists()
      for (const list of unsynced) {
        // lists table in Supabase has no updated_at
        const { error } = await supabase.from('lists').upsert({
          id: list.id,
          user_id: list.user_id,
          title: list.title,
          created_at: list.created_at,
        }, { onConflict: 'id' })

        if (error) {
          result.errors.push(`push list ${list.id}: ${error.message}`)
        } else {
          await markListSynced(list.id)
          result.pushed++
        }
      }
    } catch (e) {
      result.errors.push(`push lists: ${String(e)}`)
    }

    // 2. PUSH deletes
    try {
      const deleted = await getDeletedLists()
      for (const list of deleted) {
        const { error } = await supabase.from('lists').delete().eq('id', list.id)
        if (error) {
          result.errors.push(`delete list ${list.id}: ${error.message}`)
        } else {
          await deleteListLocal(list.id)
        }
      }
    } catch (e) {
      result.errors.push(`delete lists: ${String(e)}`)
    }

    // 3. PULL — always pull all (no updated_at in lists table)
    try {
      const { data: remoteLists, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        result.errors.push(`pull lists: ${error.message}`)
      } else if (remoteLists) {
        for (const remote of remoteLists) {
          const local = await getListById(remote.id)
          // Skip if we have an unsynced local change (local wins)
          if (local && local._synced === 0 && local._deleted === 0) {
            result.conflicts++
            continue
          }
          if (local?._deleted === 1) continue

          await saveList({
            id: remote.id,
            user_id: remote.user_id,
            title: remote.title,
            created_at: remote.created_at,
            updated_at: remote.created_at, // no updated_at in Supabase
            _synced: 1,
            _deleted: 0,
          })
          if (!local) result.pulled++
        }
      }
    } catch (e) {
      result.errors.push(`pull lists: ${String(e)}`)
    }

    await setLastSync('lists')
    return result
  }

  // ── List Items ─────────────────────────────────────────────────────────

  async syncListItems(): Promise<SyncResult> {
    const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return result

    // 1. PUSH unsynced
    try {
      const unsynced = await getUnsyncedListItems()
      for (const item of unsynced) {
        // list_items table in Supabase has no updated_at
        const { error } = await supabase.from('list_items').upsert({
          id: item.id,
          list_id: item.list_id,
          content: item.content,
          done: item.done === 1,
          position: item.position,
          created_at: item.created_at,
          deadline: item.deadline,
          is_recurring: item.is_recurring === 1,
          recurrence_rule: item.recurrence_rule,
          google_event_id: item.google_event_id,
        }, { onConflict: 'id' })

        if (error) {
          result.errors.push(`push item ${item.id}: ${error.message}`)
        } else {
          await markListItemSynced(item.id)
          result.pushed++
        }
      }
    } catch (e) {
      result.errors.push(`push list_items: ${String(e)}`)
    }

    // 2. PUSH deletes
    try {
      const deleted = await getDeletedListItems()
      for (const item of deleted) {
        const { error } = await supabase.from('list_items').delete().eq('id', item.id)
        if (error) {
          result.errors.push(`delete item ${item.id}: ${error.message}`)
        } else {
          await deleteListItemLocal(item.id)
        }
      }
    } catch (e) {
      result.errors.push(`delete list_items: ${String(e)}`)
    }

    // 3. PULL — always pull all (no updated_at in list_items table)
    try {
      const { data: remoteItems, error } = await supabase
        .from('list_items')
        .select('*')

      if (error) {
        result.errors.push(`pull list_items: ${error.message}`)
      } else if (remoteItems) {
        for (const remote of remoteItems) {
          await saveListItem({
            id: remote.id,
            list_id: remote.list_id,
            content: remote.content,
            done: remote.done ? 1 : 0,
            position: remote.position,
            created_at: remote.created_at,
            updated_at: remote.created_at, // no updated_at in Supabase
            deadline: remote.deadline ?? null,
            is_recurring: remote.is_recurring ? 1 : 0,
            recurrence_rule: remote.recurrence_rule ?? null,
            google_event_id: remote.google_event_id ?? null,
            _synced: 1,
            _deleted: 0,
          })
          result.pulled++
        }
      }
    } catch (e) {
      result.errors.push(`pull list_items: ${String(e)}`)
    }

    await setLastSync('list_items')
    return result
  }

  // ── syncAll ────────────────────────────────────────────────────────────

  async syncAll(): Promise<SyncResult> {
    const [rNotes, rLists, rItems] = await Promise.all([
      this.syncNotes(),
      this.syncLists(),
      this.syncListItems(),
    ])

    return {
      pushed: rNotes.pushed + rLists.pushed + rItems.pushed,
      pulled: rNotes.pulled + rLists.pulled + rItems.pulled,
      conflicts: rNotes.conflicts + rLists.conflicts + rItems.conflicts,
      errors: [...rNotes.errors, ...rLists.errors, ...rItems.errors],
    }
  }
}

export const syncService = new SupabaseSyncService()
