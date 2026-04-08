import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useNotesStore } from '../store/notesStore'
import type { Note } from '@shared/types'

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.5rem', fontWeight: 700 },
  nav: { display: 'flex', gap: '.75rem', alignItems: 'center' },
  navLink: { color: '#555', textDecoration: 'none', fontSize: '.875rem' },
  signOut: { fontSize: '.875rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  empty: { color: '#888', textAlign: 'center', marginTop: '3rem' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.75rem' },
  card: { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '1rem' },
  content: { margin: '0 0 .5rem', fontSize: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  meta: { margin: 0, fontSize: '.75rem', color: '#999' },
  deadline: { marginLeft: '.5rem', color: '#c77', fontWeight: 500 },
}

function NoteCard({ note }: { note: Note }) {
  const date = new Date(note.created_at).toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <li style={s.card}>
      <p style={s.content}>{note.content}</p>
      <p style={s.meta}>
        {date}
        {note.deadline && (
          <span style={s.deadline}>
            · termin {new Date(note.deadline).toLocaleDateString('pl-PL')}
          </span>
        )}
      </p>
    </li>
  )
}

export function NotesPage() {
  const { notes, loading, fetchNotes } = useNotesStore()

  useEffect(() => { fetchNotes() }, [fetchNotes])

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.title}>Notatki</h1>
        <nav style={s.nav}>
          <Link to="/lists" style={s.navLink}>Listy</Link>
          <button style={s.signOut} onClick={() => supabase.auth.signOut()}>Wyloguj</button>
        </nav>
      </header>

      {loading && <p style={s.empty}>Ładowanie…</p>}
      {!loading && notes.length === 0 && <p style={s.empty}>Brak notatek.</p>}
      {!loading && notes.length > 0 && (
        <ul style={s.list}>
          {notes.map(note => <NoteCard key={note.id} note={note} />)}
        </ul>
      )}
    </div>
  )
}
