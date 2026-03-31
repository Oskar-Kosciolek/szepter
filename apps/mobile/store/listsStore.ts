import { create } from 'zustand'
import { supabase } from '../lib/supabase'

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

type ListsStore = {
  lists: List[]
  loading: boolean
  fetchLists: () => Promise<void>
  createList: (title: string) => Promise<List | null>
  deleteList: (id: string) => Promise<void>
  addItem: (listId: string, content: string, deadline?: string) => Promise<void>
  toggleItem: (item: ListItem) => Promise<void>
  deleteItem: (id: string, listId: string) => Promise<void>
  fetchItems: (listId: string) => Promise<ListItem[]>
  reorderItems: (listId: string, items: ListItem[]) => Promise<void>
}

export const useListsStore = create<ListsStore>((set, get) => ({
  lists: [],
  loading: false,

  fetchLists: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) set({ lists: data })
    set({ loading: false })
  },

  createList: async (title: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('lists')
      .insert({ title, user_id: user?.id })
      .select()
      .single()
    if (!error && data) {
      set({ lists: [data, ...get().lists] })
      return data
    }
    return null
  },

  deleteList: async (id: string) => {
    await supabase.from('lists').delete().eq('id', id)
    set({ lists: get().lists.filter(l => l.id !== id) })
  },

  fetchItems: async (listId: string) => {
    const { data, error } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', listId)
      .order('position', { ascending: true })
    if (!error && data) return data
    return []
  },

  addItem: async (listId: string, content: string, deadline?: string) => {
    const items = await get().fetchItems(listId)
    const position = items.length

    await supabase.from('list_items').insert({
      list_id: listId,
      content,
      position,
      deadline: deadline ?? null,
    })
  },

  toggleItem: async (item: ListItem) => {
    await supabase
      .from('list_items')
      .update({ done: !item.done })
      .eq('id', item.id)
  },

  deleteItem: async (id: string, listId: string) => {
    await supabase.from('list_items').delete().eq('id', id)
  },

  reorderItems: async (listId: string, items: ListItem[]) => {
    await Promise.all(
      items.map((item, index) =>
        supabase.from('list_items').update({ position: index }).eq('id', item.id)
      )
    )
  },
}))