import { useState, useCallback } from 'react'
import { useRecorder } from './useRecorder'
import { transcribeAudio } from '../services/transcription'
import { LLMCommandParser, type ParsedCommand } from '../services/commandParser'
import { useNotesStore } from '../store/notesStore'
import { useListsStore } from '../store/listsStore'

export type VoiceResult =
  | { status: 'ok'; message: string }
  | { status: 'error'; message: string }
  | { status: 'info'; message: string }

async function executeCommand(
  command: ParsedCommand,
  actions: {
    createNote: (content: string, deadline?: string) => Promise<void>
    createList: (title: string) => Promise<void>
    addItem: (listId: string, content: string) => Promise<void>
    lists: Array<{ id: string; title: string }>
  }
): Promise<VoiceResult> {
  const { createNote, createList, addItem, lists } = actions
  const p = command.payload

  switch (command.type) {
    case 'save_note':
    case 'save_task': {
      const content = p?.content ?? ''
      if (!content) return { status: 'error', message: 'Brak treści notatki' }
      await createNote(content, p?.deadline)
      return { status: 'ok', message: `Zapisano: „${content.slice(0, 60)}${content.length > 60 ? '…' : ''}"` }
    }

    case 'create_list': {
      const title = p?.listName ?? 'nowa lista'
      await createList(title)
      return { status: 'ok', message: `Utworzono listę „${title}"` }
    }

    case 'add_to_list':
    case 'add_task_to_list': {
      const content = p?.content ?? ''
      const listName = p?.listName ?? ''
      if (!content) return { status: 'error', message: 'Brak treści elementu' }

      const list = lists.find(l =>
        l.title.toLowerCase().includes(listName.toLowerCase()) ||
        listName.toLowerCase().includes(l.title.toLowerCase())
      )
      if (!list) return { status: 'error', message: `Nie znaleziono listy „${listName}"` }

      await addItem(list.id, content)
      return { status: 'ok', message: `Dodano „${content}" do listy „${list.title}"` }
    }

    case 'read_notes':
      return { status: 'info', message: 'Przejdź do zakładki Notatki, aby zobaczyć swoje notatki.' }

    case 'read_lists':
      return { status: 'info', message: 'Przejdź do zakładki Listy, aby zobaczyć swoje listy.' }

    case 'read_list':
      return { status: 'info', message: `Przejdź do zakładki Listy i wyszukaj „${p?.listName ?? ''}".` }

    case 'delete_last_note':
      return { status: 'info', message: 'Usuwanie notatek głosem jest niedostępne w przeglądarce.' }

    case 'unknown':
    default:
      return { status: 'error', message: 'Nie rozpoznano komendy. Spróbuj ponownie.' }
  }
}

export function useVoiceCommand() {
  const { recording, error: recorderError, start, stop } = useRecorder()
  const [processing, setProcessing] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [result, setResult] = useState<VoiceResult | null>(null)

  const createNote = useNotesStore(s => s.createNote)
  const createList = useListsStore(s => s.createList)
  const addItem = useListsStore(s => s.addItem)
  const lists = useListsStore(s => s.lists)

  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string

  const startRecording = useCallback(async () => {
    setTranscript(null)
    setResult(null)
    await start()
  }, [start])

  const stopRecording = useCallback(async () => {
    const blob = await stop()
    if (!blob) return

    setProcessing(true)
    try {
      const text = await transcribeAudio(blob, apiKey)
      setTranscript(text)

      if (!text) {
        setResult({ status: 'error', message: 'Nie wykryto mowy. Spróbuj ponownie.' })
        return
      }

      const parser = new LLMCommandParser(apiKey)
      const command = await parser.parse(text)
      const res = await executeCommand(command, { createNote, createList, addItem, lists })
      setResult(res)
    } catch (e) {
      setResult({ status: 'error', message: e instanceof Error ? e.message : 'Nieznany błąd' })
    } finally {
      setProcessing(false)
    }
  }, [stop, apiKey, createNote, createList, addItem, lists])

  return {
    recording,
    processing,
    transcript,
    result,
    recorderError,
    startRecording,
    stopRecording,
  }
}
