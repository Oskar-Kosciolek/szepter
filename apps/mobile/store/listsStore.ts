import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import {
  getLists, saveList, markListDeleted,
  getListItems, saveListItem, markListItemDeleted,
  type LocalList, type LocalListItem,
} from '../lib/localDb'
import { syncService } from '../services/sync/SyncService'

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

type SyncState = {
  isSyncing: boolean
  lastSync: Date | null
  syncError: string | null
}

type ListsStore = {
  lists: List[]
  loading: boolean
  syncState: SyncState
  fetchLists: () => Promise<void>
  createList: (title: string) => Promise<List | null>
  deleteList: (id: string) => Promise<void>
  addItem: (listId: string, content: string, deadline?: string) => Promise<void>
  toggleItem: (item: ListItem) => Promise<void>
  deleteItem: (id: string, listId: string) => Promise<void>
  fetchItems: (listId: string) => Promise<ListItem[]>
  reorderItems: (listId: string, items: ListItem[]) => Promise<void>
  syncLists: () => Promise<void>
}

function toList(local: LocalList): List {
  return {
    id: local.id,
    title: local.title,
    created_at: local.created_at,
  }
}

function toListItem(local: LocalListItem): ListItem {
  return {
    id: local.id,
    list_id: local.list_id,
    content: local.content,
    done: local.done === 1,
    position: local.position,
    created_at: local.created_at,
    deadline: local.deadline,
    is_recurring: local.is_recurring === 1,
    recurrence_rule: local.recurrence_rule,
    google_event_id: local.google_event_id,
  }
}

export const useListsStore = create<ListsStore>((set, get) => ({
  lists: [],
  loading: false,
  syncState: { isSyncing: false, lastSync: null, syncError: null },

  fetchLists: async () => {
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }

    const local = await getLists(user.id)
    set({ lists: local.map(toList), loading: false })
  },

  createList: async (title: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const now = new Date().toISOString()
    const newList: LocalList = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title,
      created_at: now,
      updated_at: now,
      _synced: 0,
      _deleted: 0,
    }

    await saveList(newList)
    const list = toList(newList)
    set({ lists: [list, ...get().lists] })
    return list
  },

  deleteList: async (id: string) => {
    await markListDeleted(id)
    set({ lists: get().lists.filter(l => l.id !== id) })
  },

  fetchItems: async (listId: string) => {
    const local = await getListItems(listId)
    return local.map(toListItem)
  },

  addItem: async (listId: string, content: string, deadline?: string) => {
    const existing = await getListItems(listId)
    const position = existing.length

    const now = new Date().toISOString()
    const newItem: LocalListItem = {
      id: crypto.randomUUID(),
      list_id: listId,
      content,
      done: 0,
      position,
      created_at: now,
      updated_at: now,
      deadline: deadline ?? null,
      is_recurring: 0,
      recurrence_rule: null,
      google_event_id: null,
      _synced: 0,
      _deleted: 0,
    }

    await saveListItem(newItem)
  },

  toggleItem: async (item: ListItem) => {
    const now = new Date().toISOString()
    const local = await getListItems(item.list_id)
    const existing = local.find(i => i.id === item.id)
    if (!existing) return

    await saveListItem({
      ...existing,
      done: item.done ? 0 : 1,
      updated_at: now,
      _synced: 0,
    })
  },

  deleteItem: async (id: string, listId: string) => {
    await markListItemDeleted(id)
  },

  reorderItems: async (listId: string, items: ListItem[]) => {
    const now = new Date().toISOString()
    const local = await getListItems(listId)

    for (const item of items) {
      const existing = local.find(i => i.id === item.id)
      if (!existing) continue
      await saveListItem({
        ...existing,
        position: items.indexOf(item),
        updated_at: now,
        _synced: 0,
      })
    }
  },

  syncLists: async () => {
    set({ syncState: { ...get().syncState, isSyncing: true, syncError: null } })
    const [rLists, rItems] = await Promise.all([
      syncService.syncLists(),
      syncService.syncListItems(),
    ])
    const errors = [...rLists.errors, ...rItems.errors]
    set({
      syncState: {
        isSyncing: false,
        lastSync: new Date(),
        syncError: errors.length > 0 ? errors[0] : null,
      },
    })
    await get().fetchLists()
  },
}))
