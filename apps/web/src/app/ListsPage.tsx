import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useListsStore, type ListWithItems } from '../store/listsStore'
import { VoiceButton } from '../components/VoiceButton'
import type { ListItem } from '@shared/types'

// ─── Create list form ───────────────────────────────────────────────────────

function CreateListForm({ onCreate }: { onCreate: (title: string) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await onCreate(title.trim())
    setTitle('')
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card create-form create-form--inline">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Nowa lista…"
        className="input"
      />
      <button type="submit" disabled={saving || !title.trim()} className="btn-primary">
        {saving ? '…' : 'Utwórz'}
      </button>
    </form>
  )
}

// ─── Add item form ──────────────────────────────────────────────────────────

function AddItemForm({ listId, onAdd }: { listId: string; onAdd: (listId: string, content: string) => Promise<void> }) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    await onAdd(listId, content.trim())
    setContent('')
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="add-item-form">
      <input
        type="text"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Dodaj element…"
        className="input input--sm"
      />
      <button type="submit" disabled={saving || !content.trim()} className="btn-primary btn-sm">
        {saving ? '…' : '+'}
      </button>
    </form>
  )
}

// ─── List item row ──────────────────────────────────────────────────────────

function ListItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ListItem
  onToggle: (item: ListItem) => Promise<void>
  onDelete: (id: string, listId: string) => Promise<void>
}) {
  return (
    <li className="list-item-row">
      <button
        className={`item-checkbox ${item.done ? 'item-checkbox--done' : ''}`}
        onClick={() => onToggle(item)}
        aria-label={item.done ? 'Oznacz jako nieukończone' : 'Oznacz jako ukończone'}
      >
        {item.done ? '✓' : ''}
      </button>
      <span className={`item-content ${item.done ? 'item-content--done' : ''}`}>
        {item.content}
      </span>
      <button
        className="btn-icon"
        onClick={() => {
          if (window.confirm(`Usunąć „${item.content}"?`)) onDelete(item.id, item.list_id)
        }}
        aria-label="Usuń element"
      >
        ×
      </button>
    </li>
  )
}

// ─── List card ──────────────────────────────────────────────────────────────

function ListCard({
  list,
  onDelete,
  onAddItem,
  onToggleItem,
  onDeleteItem,
}: {
  list: ListWithItems
  onDelete: (id: string) => Promise<void>
  onAddItem: (listId: string, content: string) => Promise<void>
  onToggleItem: (item: ListItem) => Promise<void>
  onDeleteItem: (id: string, listId: string) => Promise<void>
}) {
  const items = list.list_items ?? []
  const doneCount = items.filter(i => i.done).length
  const date = new Date(list.created_at).toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="card list-card">
      <div className="list-card-header">
        <h2 className="list-title">{list.title}</h2>
        <button
          className="btn-danger btn-sm"
          onClick={() => {
            if (window.confirm(`Usunąć listę „${list.title}" wraz z elementami?`)) onDelete(list.id)
          }}
        >
          Usuń
        </button>
      </div>

      {items.length > 0 && (
        <ul className="list-items">
          {items.map(item => (
            <ListItemRow
              key={item.id}
              item={item}
              onToggle={onToggleItem}
              onDelete={onDeleteItem}
            />
          ))}
        </ul>
      )}

      <AddItemForm listId={list.id} onAdd={onAddItem} />

      <p className="meta list-meta">
        {date}
        {items.length > 0 && ` · ${doneCount}/${items.length} ukończone`}
      </p>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function ListsPage() {
  const { lists, loading, fetchLists, createList, deleteList, addItem, toggleItem, deleteItem } = useListsStore()

  useEffect(() => { fetchLists() }, [fetchLists])

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Listy</h1>
        <nav className="page-nav">
          <Link to="/" className="nav-link">Notatki</Link>
          <button className="btn-ghost btn-sm" onClick={() => supabase.auth.signOut()}>Wyloguj</button>
        </nav>
      </header>

      <CreateListForm onCreate={createList} />
      <VoiceButton />

      {loading && <p className="empty">Ładowanie…</p>}
      {!loading && lists.length === 0 && <p className="empty">Brak list.</p>}
      {!loading && lists.length > 0 && (
        <div className="lists-grid">
          {lists.map(list => (
            <ListCard
              key={list.id}
              list={list}
              onDelete={deleteList}
              onAddItem={addItem}
              onToggleItem={toggleItem}
              onDeleteItem={deleteItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
