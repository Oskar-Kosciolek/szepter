import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { List, ListItem } from '@shared/types'

export type ListWithItems = List & { list_items: ListItem[] }

type ListsStore = {
  lists: ListWithItems[]
  loading: boolean
  fetchLists: () => Promise<void>
  createList: (title: string) => Promise<void>
  deleteList: (id: string) => Promise<void>
  addItem: (listId: string, content: string) => Promise<void>
  toggleItem: (item: ListItem) => Promise<void>
  deleteItem: (id: string, listId: string) => Promise<void>
}

export const useListsStore = create<ListsStore>((set, get) => ({
  lists: [],
  loading: false,

  fetchLists: async () => {
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }

    const { data, error } = await supabase
      .from('lists')
      .select(`
        id, title, created_at,
        list_items (
          id, list_id, content, done, position, created_at,
          deadline, is_recurring, recurrence_rule, google_event_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .order('position', { referencedTable: 'list_items', ascending: true })

    if (!error && data) {
      set({ lists: data as ListWithItems[] })
    }
    set({ loading: false })
  },

  createList: async (title: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('lists')
      .insert({ user_id: user.id, title })
      .select('id, title, created_at')
      .single()

    if (!error && data) {
      set({ lists: [{ ...(data as List), list_items: [] }, ...get().lists] })
    }
  },

  deleteList: async (id: string) => {
    const { error } = await supabase.from('lists').delete().eq('id', id)
    if (!error) {
      set({ lists: get().lists.filter(l => l.id !== id) })
    }
  },

  addItem: async (listId: string, content: string) => {
    const list = get().lists.find(l => l.id === listId)
    const position = list?.list_items.length ?? 0

    const { data, error } = await supabase
      .from('list_items')
      .insert({ list_id: listId, content, position, done: false })
      .select('id, list_id, content, done, position, created_at, deadline, is_recurring, recurrence_rule, google_event_id')
      .single()

    if (!error && data) {
      set({
        lists: get().lists.map(l =>
          l.id === listId
            ? { ...l, list_items: [...l.list_items, data as ListItem] }
            : l
        ),
      })
    }
  },

  toggleItem: async (item: ListItem) => {
    const { error } = await supabase
      .from('list_items')
      .update({ done: !item.done })
      .eq('id', item.id)

    if (!error) {
      set({
        lists: get().lists.map(l =>
          l.id === item.list_id
            ? {
                ...l,
                list_items: l.list_items.map(i =>
                  i.id === item.id ? { ...i, done: !i.done } : i
                ),
              }
            : l
        ),
      })
    }
  },

  deleteItem: async (id: string, listId: string) => {
    const { error } = await supabase.from('list_items').delete().eq('id', id)
    if (!error) {
      set({
        lists: get().lists.map(l =>
          l.id === listId
            ? { ...l, list_items: l.list_items.filter(i => i.id !== id) }
            : l
        ),
      })
    }
  },
}))
