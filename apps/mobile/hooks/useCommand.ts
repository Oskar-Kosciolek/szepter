import { useState } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { commandParser } from '../services/commandParser'
import { useNotesStore } from '../store/notesStore'
import { useListsStore } from '../store/listsStore'
import { ttsService } from '../services/tts'
import { findBestMatch } from '../utils/fuzzyMatch'

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

        case 'save_task':
          await addNote(command.payload?.content ?? text, command.payload?.deadline ?? undefined)
          await ttsService.speak('Zadanie zapisane.')
          return `Zapisano zadanie ✓${command.payload?.deadline ? ' z terminem' : ''}`

        case 'read_notes': {
          await useNotesStore.getState().fetchNotes()
          const notes = useNotesStore.getState().notes
          if (notes.length === 0) {
            await ttsService.speak('Nie masz żadnych notatek.')
            return 'Brak notatek do odczytania'
          }
          for (let i = 0; i < Math.min(notes.length, 3); i++) {
            await ttsService.speak(`Notatka ${i + 1}: ${notes[i].content}`)
          }
          return 'Odczytano ✓'
        }

        case 'create_list': {
          const listName = command.payload?.listName ?? 'nowa lista'
          const newList = await useListsStore.getState().createList(listName)
          if (newList) router.push(`/list/${newList.id}?title=${encodeURIComponent(listName)}`)
          return `Utworzono listę "${listName}" ✓`
        }

        case 'add_to_list':
        case 'add_task_to_list': {
          const { createList, addItem, fetchLists } = useListsStore.getState()
          const listName = command.payload?.listName ?? 'domyślna'
          const content = command.payload?.content ?? ''
          const deadline = command.payload?.deadline
          await fetchLists()
          const lists = useListsStore.getState().lists
          let list = findBestMatch(listName, lists, l => l.title) ?? await createList(listName) ?? undefined
          if (list && content) {
            const items = content.split(',').map(s => s.trim()).filter(s => s.length > 0)
            for (const item of items) await addItem(list.id, item, deadline)
            return items.length === 1
              ? `Dodano "${items[0]}" do listy "${list.title}" ✓`
              : `Dodano ${items.length} elementy do listy "${list.title}" ✓`
          }
          return 'Dodano do listy ✓'
        }

        case 'delete_last_note': {
          const { notes, deleteNote } = useNotesStore.getState()
          if (notes.length > 0) {
            await deleteNote(notes[0].id)
            return 'Usunięto ostatnią notatkę ✓'
          }
          return 'Brak notatek do usunięcia'
        }

        case 'read_lists': {
          const { fetchLists } = useListsStore.getState()
          await fetchLists()
          const lists = useListsStore.getState().lists
          if (lists.length === 0) {
            await ttsService.speak('Nie masz żadnych list.')
            return 'Brak list'
          }
          const names = lists.map(l => l.title).join(', ')
          await ttsService.speak(`Masz ${lists.length} ${pluralLists(lists.length)}: ${names}.`)
          return `Odczytano ${lists.length} list ✓`
        }

        case 'read_list': {
          const listName = command.payload?.listName ?? ''
          const { fetchLists, fetchItems } = useListsStore.getState()
          await fetchLists()
          const lists = useListsStore.getState().lists
          const list = findBestMatch(listName, lists, l => l.title)
          if (!list) {
            await ttsService.speak(`Nie znalazłem listy ${listName}.`)
            return `Nie znaleziono listy "${listName}"`
          }
          const items = await fetchItems(list.id)
          if (items.length === 0) {
            await ttsService.speak(`Lista ${list.title} jest pusta.`)
            return `Lista "${list.title}" jest pusta`
          }
          const pending = items.filter(i => !i.done)
          const done = items.filter(i => i.done)
          let speech = `Lista ${list.title} zawiera ${items.length} ${pluralItems(items.length)}. `
          if (pending.length > 0) speech += `Do zrobienia: ${pending.map(i => i.content).join(', ')}. `
          if (done.length > 0) speech += `Zrobione: ${done.map(i => i.content).join(', ')}.`
          await ttsService.speak(speech)
          return `Odczytano listę "${list.title}" ✓`
        }

        case 'check_item': {
          const itemName = command.payload?.itemName ?? ''
          const listName = command.payload?.listName ?? ''
          const { fetchLists, fetchItems, toggleItem } = useListsStore.getState()
          await fetchLists()
          const lists = useListsStore.getState().lists
          const targetLists = listName
            ? [findBestMatch(listName, lists, l => l.title)].filter(Boolean)
            : lists
          for (const list of targetLists as typeof lists) {
            const items = await fetchItems(list.id)
            const item = findBestMatch(itemName, items.filter(i => !i.done), i => i.content)
            if (item) {
              await toggleItem(item)
              await ttsService.speak(`Zaznaczono ${item.content} jako zrobione.`)
              return `Zaznaczono "${item.content}" ✓`
            }
          }
          await ttsService.speak(`Nie znalazłem elementu ${itemName}.`)
          return `Nie znaleziono "${itemName}"`
        }

        case 'uncheck_item': {
          const itemName = command.payload?.itemName ?? ''
          const listName = command.payload?.listName ?? ''
          const { fetchLists, fetchItems, toggleItem } = useListsStore.getState()
          await fetchLists()
          const lists = useListsStore.getState().lists
          const targetLists = listName
            ? [findBestMatch(listName, lists, l => l.title)].filter(Boolean)
            : lists
          for (const list of targetLists as typeof lists) {
            const items = await fetchItems(list.id)
            const item = findBestMatch(itemName, items.filter(i => i.done), i => i.content)
            if (item) {
              await toggleItem(item)
              await ttsService.speak(`Odznaczono ${item.content}.`)
              return `Odznaczono "${item.content}" ✓`
            }
          }
          await ttsService.speak(`Nie znalazłem elementu ${itemName}.`)
          return `Nie znaleziono "${itemName}"`
        }

        case 'delete_list_item': {
          const itemName = command.payload?.itemName ?? ''
          const listName = command.payload?.listName ?? ''
          const { fetchLists, fetchItems, deleteItem } = useListsStore.getState()
          await fetchLists()
          const lists = useListsStore.getState().lists
          const list = findBestMatch(listName, lists, l => l.title)
          if (!list) {
            await ttsService.speak(`Nie znalazłem listy ${listName}.`)
            return `Nie znaleziono listy "${listName}"`
          }
          const items = await fetchItems(list.id)
          const item = findBestMatch(itemName, items, i => i.content)
          if (!item) {
            await ttsService.speak(`Nie znalazłem elementu ${itemName}.`)
            return `Nie znaleziono "${itemName}"`
          }
          await deleteItem(item.id, list.id)
          await ttsService.speak(`Usunięto ${item.content} z listy ${list.title}.`)
          return `Usunięto "${item.content}" z listy "${list.title}" ✓`
        }

        case 'summarize_list': {
          const listName = command.payload?.listName ?? ''
          const { fetchLists, fetchItems } = useListsStore.getState()
          await fetchLists()
          const lists = useListsStore.getState().lists
          const list = findBestMatch(listName, lists, l => l.title)
          if (!list) {
            await ttsService.speak(`Nie znalazłem listy ${listName}.`)
            return `Nie znaleziono listy "${listName}"`
          }
          const items = await fetchItems(list.id)
          const done = items.filter(i => i.done)
          const pending = items.filter(i => !i.done)
          let speech = `Lista ${list.title}: ${items.length} ${pluralItems(items.length)}, ${done.length} zrobione, zostało ${pending.length} do zrobienia`
          if (pending.length > 0 && pending.length <= 5) {
            speech += `: ${pending.map(i => i.content).join(', ')}`
          }
          speech += '.'
          await ttsService.speak(speech)
          return `Podsumowanie: ${pending.length} do zrobienia, ${done.length} zrobione ✓`
        }

        default:
          Alert.alert('Nie rozpoznano komendy', `Usłyszałem: "${text}"\n\nSpróbuj np:\n• "Zapisz pomysł na..."\n• "Odczytaj listę zakupów"\n• "Zaznacz mleko na liście zakupów"\n• "Podsumuj listę zakupów"`)
          return 'Nie rozpoznano komendy'
      }
    } finally {
      setIsExecuting(false)
    }
  }

  return { executeCommand, isExecuting }
}

function pluralLists(n: number): string {
  if (n === 1) return 'listę'
  if (n >= 2 && n <= 4) return 'listy'
  return 'list'
}

function pluralItems(n: number): string {
  if (n === 1) return 'element'
  if (n >= 2 && n <= 4) return 'elementy'
  return 'elementów'
}
