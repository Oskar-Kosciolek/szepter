import { useState } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { commandParser } from '../services/commandParser'
import { useNotesStore } from '../store/notesStore'
import { useListsStore } from '../store/listsStore'
import { ttsService } from '../services/tts'

export function useCommand() {
  const [isExecuting, setIsExecuting] = useState(false)
  const { addNote } = useNotesStore()

  const executeCommand = async (text: string): Promise<string> => {
    setIsExecuting(true)
    try {
      const command = await commandParser.parse(text)
      switch (command.type) {
        case 'save_note':
          await addNote(command.payload?.content ?? text)
          await ttsService.speak('Notatka zapisana.')
          return 'Zapisano notatkę ✓'
        case 'read_notes': {
          await useNotesStore.getState().fetchNotes()
          const notes = useNotesStore.getState().notes
          if (notes.length === 0) { await ttsService.speak('Nie masz żadnych notatek.'); return 'Brak notatek do odczytania' }
          for (let i = 0; i < Math.min(notes.length, 3); i++) await ttsService.speak(`Notatka ${i + 1}: ${notes[i].content}`)
          return 'Odczytano ✓'
        }
        case 'create_list': {
          const listName = command.payload?.listName ?? 'nowa lista'
          const newList = await useListsStore.getState().createList(listName)
          if (newList) router.push(`/list/${newList.id}?title=${encodeURIComponent(listName)}`)
          return `Utworzono listę "${listName}" ✓`
        }
        case 'add_to_list': {
          const { createList, addItem, fetchLists } = useListsStore.getState()
          const listName = command.payload?.listName ?? 'domyślna'
          const content = command.payload?.content ?? ''
          await fetchLists()
          let list = useListsStore.getState().lists.find(l => l.title.toLowerCase().includes(listName.toLowerCase()))
          if (!list) list = await createList(listName) ?? undefined
          if (list && content) {
            const items = content.split(',').map(s => s.trim()).filter(s => s.length > 0)
            for (const item of items) await addItem(list.id, item)
            return items.length === 1
              ? `Dodano "${items[0]}" do listy "${list.title}" ✓`
              : `Dodano ${items.length} elementy do listy "${list.title}" ✓`
          }
          return 'Dodano do listy ✓'
        }
        case 'delete_last_note': {
          const { notes, deleteNote } = useNotesStore.getState()
          if (notes.length > 0) { await deleteNote(notes[0].id); return 'Usunięto ostatnią notatkę ✓' }
          return 'Brak notatek do usunięcia'
        }
        default:
          Alert.alert('Nie rozpoznano komendy', `Usłyszałem: "${text}"\n\nSpróbuj np:\n• "Zapisz pomysł na..."\n• "Dodaj mleko do listy zakupów"\n• "Odczytaj notatki"`)
          return 'Nie rozpoznano komendy'
      }
    } finally { setIsExecuting(false) }
  }

  return { executeCommand, isExecuting }
}
