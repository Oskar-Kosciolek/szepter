import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { List, ListItem } from '@shared/types'

type ListWithItems = List & { list_items: ListItem[] }

type ListsStore = {
  lists: ListWithItems[]
  loading: boolean
  fetchLists: () => Promise<void>
}

export const useListsStore = create<ListsStore>((set) => ({
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
}))
