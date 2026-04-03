import * as SQLite from 'expo-sqlite'

// ─── Types ─────────────────────────────────────────────────────────────────

export type LocalNote = {
  id: string
  user_id: string
  content: string
  transcript: string | null
  created_at: string
  updated_at: string
  deadline: string | null
  notified: number // 0 | 1
  is_recurring: number // 0 | 1
  recurrence_rule: string | null
  google_event_id: string | null
  _synced: number // 0 | 1
  _deleted: number // 0 | 1
}

export type LocalList = {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  _synced: number
  _deleted: number
}

export type LocalListItem = {
  id: string
  list_id: string
  content: string
  done: number // 0 | 1
  position: number
  created_at: string
  updated_at: string
  deadline: string | null
  is_recurring: number // 0 | 1
  recurrence_rule: string | null
  google_event_id: string | null
  _synced: number
  _deleted: number
}

// ─── DB instance ───────────────────────────────────────────────────────────

const db = SQLite.openDatabaseSync('szepter.db')

// ─── Migrations ────────────────────────────────────────────────────────────

const SCHEMA_VERSION = 1

export function initLocalDb(): void {
  db.execSync(`PRAGMA journal_mode = WAL;`)

  db.execSync(`
    CREATE TABLE IF NOT EXISTS _schema_version (
      version INTEGER PRIMARY KEY
    );
  `)

  const row = db.getFirstSync<{ version: number }>(
    'SELECT version FROM _schema_version LIMIT 1'
  )
  const current = row?.version ?? 0

  if (current < 1) {
    db.withTransactionSync(() => {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          transcript TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deadline TEXT,
          notified INTEGER NOT NULL DEFAULT 0,
          is_recurring INTEGER NOT NULL DEFAULT 0,
          recurrence_rule TEXT,
          google_event_id TEXT,
          _synced INTEGER NOT NULL DEFAULT 0,
          _deleted INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS lists (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          _synced INTEGER NOT NULL DEFAULT 0,
          _deleted INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS list_items (
          id TEXT PRIMARY KEY,
          list_id TEXT NOT NULL,
          content TEXT NOT NULL,
          done INTEGER NOT NULL DEFAULT 0,
          position INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deadline TEXT,
          is_recurring INTEGER NOT NULL DEFAULT 0,
          recurrence_rule TEXT,
          google_event_id TEXT,
          _synced INTEGER NOT NULL DEFAULT 0,
          _deleted INTEGER NOT NULL DEFAULT 0
        );
      `)
      db.runSync(
        'INSERT OR REPLACE INTO _schema_version (version) VALUES (?)',
        [SCHEMA_VERSION]
      )
    })
  }
}

// ─── Notes ─────────────────────────────────────────────────────────────────

export async function getNotes(userId: string): Promise<LocalNote[]> {
  return await db.getAllAsync<LocalNote>(
    'SELECT * FROM notes WHERE user_id = ? AND _deleted = 0 ORDER BY created_at DESC',
    [userId]
  )
}

export async function getNoteById(id: string): Promise<LocalNote | null> {
  return await db.getFirstAsync<LocalNote>(
    'SELECT * FROM notes WHERE id = ?',
    [id]
  ) ?? null
}

export async function saveNote(note: LocalNote): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO notes
      (id, user_id, content, transcript, created_at, updated_at, deadline,
       notified, is_recurring, recurrence_rule, google_event_id, _synced, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      note.id, note.user_id, note.content, note.transcript ?? null,
      note.created_at, note.updated_at, note.deadline ?? null,
      note.notified, note.is_recurring, note.recurrence_rule ?? null,
      note.google_event_id ?? null, note._synced, note._deleted,
    ]
  )
}

export async function markNoteDeleted(id: string): Promise<void> {
  const now = new Date().toISOString()
  await db.runAsync(
    'UPDATE notes SET _deleted = 1, _synced = 0, updated_at = ? WHERE id = ?',
    [now, id]
  )
}

export async function getUnsyncedNotes(): Promise<LocalNote[]> {
  return await db.getAllAsync<LocalNote>(
    'SELECT * FROM notes WHERE _synced = 0 AND _deleted = 0'
  )
}

export async function getDeletedNotes(): Promise<LocalNote[]> {
  return await db.getAllAsync<LocalNote>(
    'SELECT * FROM notes WHERE _deleted = 1 AND _synced = 0'
  )
}

export async function markNoteSynced(id: string): Promise<void> {
  await db.runAsync('UPDATE notes SET _synced = 1 WHERE id = ?', [id])
}

export async function deleteNoteLocal(id: string): Promise<void> {
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id])
}

// ─── Lists ─────────────────────────────────────────────────────────────────

export async function getLists(userId: string): Promise<LocalList[]> {
  return await db.getAllAsync<LocalList>(
    'SELECT * FROM lists WHERE user_id = ? AND _deleted = 0 ORDER BY created_at DESC',
    [userId]
  )
}

export async function getListById(id: string): Promise<LocalList | null> {
  return await db.getFirstAsync<LocalList>(
    'SELECT * FROM lists WHERE id = ?',
    [id]
  ) ?? null
}

export async function saveList(list: LocalList): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO lists
      (id, user_id, title, created_at, updated_at, _synced, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      list.id, list.user_id, list.title,
      list.created_at, list.updated_at,
      list._synced, list._deleted,
    ]
  )
}

export async function markListDeleted(id: string): Promise<void> {
  const now = new Date().toISOString()
  await db.runAsync(
    'UPDATE lists SET _deleted = 1, _synced = 0, updated_at = ? WHERE id = ?',
    [now, id]
  )
  // Also soft-delete all items
  await db.runAsync(
    'UPDATE list_items SET _deleted = 1, _synced = 0, updated_at = ? WHERE list_id = ?',
    [now, id]
  )
}

export async function getUnsyncedLists(): Promise<LocalList[]> {
  return await db.getAllAsync<LocalList>(
    'SELECT * FROM lists WHERE _synced = 0 AND _deleted = 0'
  )
}

export async function getDeletedLists(): Promise<LocalList[]> {
  return await db.getAllAsync<LocalList>(
    'SELECT * FROM lists WHERE _deleted = 1 AND _synced = 0'
  )
}

export async function markListSynced(id: string): Promise<void> {
  await db.runAsync('UPDATE lists SET _synced = 1 WHERE id = ?', [id])
}

export async function deleteListLocal(id: string): Promise<void> {
  await db.runAsync('DELETE FROM list_items WHERE list_id = ?', [id])
  await db.runAsync('DELETE FROM lists WHERE id = ?', [id])
}

// ─── List Items ─────────────────────────────────────────────────────────────

export async function getListItems(listId: string): Promise<LocalListItem[]> {
  return await db.getAllAsync<LocalListItem>(
    'SELECT * FROM list_items WHERE list_id = ? AND _deleted = 0 ORDER BY position ASC',
    [listId]
  )
}

export async function saveListItem(item: LocalListItem): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO list_items
      (id, list_id, content, done, position, created_at, updated_at,
       deadline, is_recurring, recurrence_rule, google_event_id, _synced, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id, item.list_id, item.content, item.done, item.position,
      item.created_at, item.updated_at, item.deadline ?? null,
      item.is_recurring, item.recurrence_rule ?? null,
      item.google_event_id ?? null, item._synced, item._deleted,
    ]
  )
}

export async function markListItemDeleted(id: string): Promise<void> {
  const now = new Date().toISOString()
  await db.runAsync(
    'UPDATE list_items SET _deleted = 1, _synced = 0, updated_at = ? WHERE id = ?',
    [now, id]
  )
}

export async function getUnsyncedListItems(): Promise<LocalListItem[]> {
  return await db.getAllAsync<LocalListItem>(
    'SELECT * FROM list_items WHERE _synced = 0 AND _deleted = 0'
  )
}

export async function getDeletedListItems(): Promise<LocalListItem[]> {
  return await db.getAllAsync<LocalListItem>(
    'SELECT * FROM list_items WHERE _deleted = 1 AND _synced = 0'
  )
}

export async function markListItemSynced(id: string): Promise<void> {
  await db.runAsync('UPDATE list_items SET _synced = 1 WHERE id = ?', [id])
}

export async function deleteListItemLocal(id: string): Promise<void> {
  await db.runAsync('DELETE FROM list_items WHERE id = ?', [id])
}

export async function getAllListItemsForUser(userId: string): Promise<LocalListItem[]> {
  return await db.getAllAsync<LocalListItem>(
    `SELECT li.* FROM list_items li
     INNER JOIN lists l ON l.id = li.list_id
     WHERE l.user_id = ? AND li._deleted = 0`,
    [userId]
  )
}

// ─── Bulk ops for seed ──────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  await db.runAsync('DELETE FROM list_items')
  await db.runAsync('DELETE FROM lists')
  await db.runAsync('DELETE FROM notes')
}
