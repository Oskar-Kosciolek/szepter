import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useListsStore } from '../store/listsStore'
import type { List, ListItem } from '@shared/types'

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.5rem', fontWeight: 700 },
  nav: { display: 'flex', gap: '.75rem', alignItems: 'center' },
  navLink: { color: '#555', textDecoration: 'none', fontSize: '.875rem' },
  signOut: { fontSize: '.875rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  empty: { color: '#888', textAlign: 'center', marginTop: '3rem' },
  lists: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '1rem' },
  listTitle: { margin: '0 0 .75rem', fontSize: '1rem', fontWeight: 600 },
  items: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.35rem' },
  item: { display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.9rem' },
  done: { textDecoration: 'line-through', color: '#aaa' },
  checkbox: { width: '14px', height: '14px', flexShrink: 0, accentColor: '#1a1a1a' },
  meta: { margin: '.5rem 0 0', fontSize: '.75rem', color: '#bbb' },
}

type ListWithItems = List & { list_items: ListItem[] }

function ListCard({ list }: { list: ListWithItems }) {
  const date = new Date(list.created_at).toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const items = list.list_items ?? []
  const doneCount = items.filter(i => i.done).length

  return (
    <div style={s.card}>
      <p style={s.listTitle}>{list.title}</p>
      {items.length > 0 && (
        <ul style={s.items}>
          {items.map(item => (
            <li key={item.id} style={s.item}>
              <input type="checkbox" checked={item.done} readOnly style={s.checkbox} />
              <span style={item.done ? s.done : undefined}>{item.content}</span>
            </li>
          ))}
        </ul>
      )}
      <p style={s.meta}>
        {date}
        {items.length > 0 && ` · ${doneCount}/${items.length} ukończone`}
      </p>
    </div>
  )
}

export function ListsPage() {
  const { lists, loading, fetchLists } = useListsStore()

  useEffect(() => { fetchLists() }, [fetchLists])

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.title}>Listy</h1>
        <nav style={s.nav}>
          <Link to="/" style={s.navLink}>Notatki</Link>
          <button style={s.signOut} onClick={() => supabase.auth.signOut()}>Wyloguj</button>
        </nav>
      </header>

      {loading && <p style={s.empty}>Ładowanie…</p>}
      {!loading && lists.length === 0 && <p style={s.empty}>Brak list.</p>}
      {!loading && lists.length > 0 && (
        <div style={s.lists}>
          {lists.map(list => <ListCard key={list.id} list={list} />)}
        </div>
      )}
    </div>
  )
}
