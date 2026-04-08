import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useNotesStore } from '../store/notesStore'
import { VoiceButton } from '../components/VoiceButton'
import type { Note } from '@shared/types'

// ─── Create form ────────────────────────────────────────────────────────────

function CreateNoteForm({ onCreate }: { onCreate: (content: string, deadline?: string) => Promise<void> }) {
  const [content, setContent] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    await onCreate(content.trim(), deadline || undefined)
    setContent('')
    setDeadline('')
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card create-form">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Nowa notatka…"
        rows={3}
        className="textarea"
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(e as unknown as React.FormEvent) }}
      />
      <div className="form-row">
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="input-date"
          title="Termin (opcjonalnie)"
        />
        <button type="submit" disabled={saving || !content.trim()} className="btn-primary">
          {saving ? 'Zapisywanie…' : 'Zapisz'}
        </button>
      </div>
    </form>
  )
}

// ─── Note card ──────────────────────────────────────────────────────────────

function NoteCard({
  note,
  onUpdate,
  onDelete,
}: {
  note: Note
  onUpdate: (id: string, content: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.content)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!draft.trim() || draft === note.content) { setEditing(false); return }
    setSaving(true)
    await onUpdate(note.id, draft.trim())
    setSaving(false)
    setEditing(false)
  }

  function handleDelete() {
    if (window.confirm('Usunąć tę notatkę?')) onDelete(note.id)
  }

  const date = new Date(note.created_at).toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <li className="card note-card">
      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={4}
            className="textarea"
            autoFocus
          />
          <div className="form-row">
            <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Zapisywanie…' : 'Zapisz'}
            </button>
            <button onClick={() => { setDraft(note.content); setEditing(false) }} className="btn-ghost btn-sm">
              Anuluj
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="note-content">{note.content}</p>
          <div className="card-footer">
            <span className="meta">
              {date}
              {note.deadline && (
                <span className="deadline">
                  {' '}· termin {new Date(note.deadline).toLocaleDateString('pl-PL')}
                </span>
              )}
            </span>
            <div className="card-actions">
              <button onClick={() => setEditing(true)} className="btn-ghost btn-sm">Edytuj</button>
              <button onClick={handleDelete} className="btn-danger btn-sm">Usuń</button>
            </div>
          </div>
        </>
      )}
    </li>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function NotesPage() {
  const { notes, loading, fetchNotes, createNote, updateNote, deleteNote } = useNotesStore()

  useEffect(() => { fetchNotes() }, [fetchNotes])

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Notatki</h1>
        <nav className="page-nav">
          <Link to="/lists" className="nav-link">Listy</Link>
          <button className="btn-ghost btn-sm" onClick={() => supabase.auth.signOut()}>Wyloguj</button>
        </nav>
      </header>

      <CreateNoteForm onCreate={createNote} />
      <VoiceButton />

      {loading && <p className="empty">Ładowanie…</p>}
      {!loading && notes.length === 0 && <p className="empty">Brak notatek.</p>}
      {!loading && notes.length > 0 && (
        <ul className="notes-list">
          {notes.map(note => (
            <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} />
          ))}
        </ul>
      )}
    </div>
  )
}
