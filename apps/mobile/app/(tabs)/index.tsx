import { useState, useEffect, useRef } from 'react'
import { View, Text, Pressable, Animated, StyleSheet, Dimensions, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Mic, MicOff, Loader } from 'lucide-react-native'
import { useWhisperStore } from '../../store/whisperStore'
import { useNotesStore } from '../../store/notesStore'
import { commandParser } from '../../services/commandParser'
import { useListsStore } from '../../store/listsStore'
import { router } from 'expo-router'
import { useAudioRecorder, RecordingPresets, setAudioModeAsync } from 'expo-audio'
const { width } = Dimensions.get('window')
const BTN_SIZE = width * 0.38

export default function HomeScreen() {
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState('Naciśnij aby mówić')
  const { transcribing, transcribe } = useWhisperStore()
const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const { addNote } = useNotesStore()

  const pulse1 = useRef(new Animated.Value(1)).current
  const pulse2 = useRef(new Animated.Value(1)).current
  const pulse3 = useRef(new Animated.Value(1)).current


  useEffect(() => {
    if (!listening) {
      pulse1.setValue(1)
      pulse2.setValue(1)
      pulse3.setValue(1)
      return
    }
    const animate = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start()

    animate(pulse1, 0)
    animate(pulse2, 300)
    animate(pulse3, 600)
  }, [listening])

  const handlePress = async () => {
  if (!listening) {
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
    await recorder.prepareToRecordAsync()
    recorder.record()
    setListening(true)
    setStatus('Słucham...')
  } else {
    await recorder.stop()
    setListening(false)
    setStatus('Przetwarzam...')

    const uri = recorder.uri
    if (!uri) {
      setStatus('Błąd nagrywania')
      setTimeout(() => setStatus('Naciśnij aby mówić'), 2000)
      return
    }

    const transcript = await transcribe(uri)

    if (transcript?.trim()) {
      setStatus(`"${transcript}"`)
      await parseCommand(transcript)
    } else {
      setStatus('Nie rozpoznano. Spróbuj ponownie.')
    }

    setTimeout(() => setStatus('Naciśnij aby mówić'), 3000)
  }
}


const parseCommand = async (text: string) => {
  const command = await commandParser.parse(text)
  console.log('komenda:', JSON.stringify(command))

  switch (command.type) {
    case 'save_note':
      await addNote(command.payload?.content ?? text)
      setStatus('Zapisano notatkę ✓')
      break

    case 'read_notes':
      // na razie placeholder — TTS dołożymy później
      setStatus('Odczytywanie notatek...')
      Alert.alert('Notatki', 'TTS będzie tutaj wkrótce 🎙️')
      break

    case 'create_list': {
      const { createList } = useListsStore.getState()
      const listName = command.payload?.listName ?? 'nowa lista'
      const newList = await createList(listName)
      if (newList) {
        setStatus(`Utworzono listę "${listName}" ✓`)
        router.push(`/list/${newList.id}?title=${encodeURIComponent(listName)}`)
      }
      break
    }

    case 'add_to_list': {
      const { lists, createList, addItem, fetchLists } = useListsStore.getState()
      const listName = command.payload?.listName ?? 'domyślna'
      const content = command.payload?.content ?? ''

      await fetchLists()
      let list = useListsStore.getState().lists.find(
        l => l.title.toLowerCase().includes(listName.toLowerCase())
      )

      if (!list) {
        list = await createList(listName) ?? undefined
      }

      if (list && content) {
        await addItem(list.id, content)
        setStatus(`Dodano "${content}" do listy "${list.title}" ✓`)
      }
      break
    }

    case 'delete_last_note':
      const { notes, deleteNote } = useNotesStore.getState()
      if (notes.length > 0) {
        await deleteNote(notes[0].id)
        setStatus('Usunięto ostatnią notatkę ✓')
      } else {
        setStatus('Brak notatek do usunięcia')
      }
      break

    case 'unknown':
    default:
      Alert.alert(
        'Nie rozpoznano komendy',
        `Usłyszałem: "${text}"\n\nSpróbuj np:\n• "Zapisz pomysł na..."\n• "Dodaj mleko do listy zakupów"\n• "Odczytaj notatki"`
      )
  }
}

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Szepter</Text>
      <Text style={s.subtitle} numberOfLines={2}>{status}</Text>

      <View style={s.btnWrap}>
        {[pulse1, pulse2, pulse3].map((anim, i) => (
          <Animated.View
            key={i}
            style={[s.ring, {
              transform: [{ scale: anim }],
              opacity: listening ? 0.15 - i * 0.04 : 0
            }]}
          />
        ))}
        <Pressable
          onPress={handlePress}
          style={[s.btn, listening && s.btnActive, transcribing && s.btnProcessing]}
          disabled={transcribing}
        >
          {transcribing
            ? <Loader size={BTN_SIZE * 0.38} color="#fff" />
            : listening
              ? <MicOff size={BTN_SIZE * 0.38} color="#fff" />
              : <Mic size={BTN_SIZE * 0.38} color="#fff" />
          }
        </Pressable>
      </View>

    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: 32, fontWeight: '300', color: '#fff', letterSpacing: 8, marginBottom: 8 },
  subtitle:      { fontSize: 14, color: '#666', marginBottom: 60, letterSpacing: 2, textAlign: 'center', paddingHorizontal: 40 },
  btnWrap:       { width: BTN_SIZE * 1.8, height: BTN_SIZE * 1.8, alignItems: 'center', justifyContent: 'center' },
  ring:          { position: 'absolute', width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE, backgroundColor: '#a78bfa' },
  btn:           { width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  btnActive:     { backgroundColor: '#4c1d95', borderColor: '#7c3aed' },
  btnProcessing: { backgroundColor: '#1a1a2e', borderColor: '#3730a3' },
  loading:       { position: 'absolute', bottom: 120, fontSize: 13, color: '#555', letterSpacing: 1 },
})
