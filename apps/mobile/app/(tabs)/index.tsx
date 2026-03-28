import { useState, useEffect, useRef } from 'react'
import { View, Text, Pressable, Animated, StyleSheet, Dimensions, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Mic, MicOff, Loader } from 'lucide-react-native'
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio'
import { useWhisperStore } from '../../store/whisperStore'
import { useNotesStore } from '../../store/notesStore'

const { width } = Dimensions.get('window')
const BTN_SIZE = width * 0.38

export default function HomeScreen() {
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState('Naciśnij aby mówić')
  const { ready, initModel, transcribe, transcribing } = useWhisperStore()
  const { addNote } = useNotesStore()
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)

  const pulse1 = useRef(new Animated.Value(1)).current
  const pulse2 = useRef(new Animated.Value(1)).current
  const pulse3 = useRef(new Animated.Value(1)).current

  useEffect(() => { initModel() }, [])

  useEffect(() => {
    // Poproś o uprawnienia do mikrofonu
    AudioModule.requestRecordingPermissionsAsync()
  }, [])

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
    if (!ready) {
      Alert.alert('Model niedostępny', 'Model głosowy jeszcze się ładuje, spróbuj za chwilę.')
      return
    }

    if (!listening) {
      // Start nagrywania
      await recorder.record()
      setListening(true)
      setStatus('Słucham...')
    } else {
      // Stop nagrywania
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
    const lower = text.toLowerCase()

    if (lower.includes('zapisz') || lower.includes('notatka') || lower.includes('pomysł')) {
      await addNote(text)
      setStatus('Zapisano notatkę ✓')
    } else {
      Alert.alert(
        'Nie rozpoznano komendy',
        `Usłyszałem: "${text}"\n\nSpróbuj powiedzieć np. "Zapisz pomysł..."`
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

      {!ready && (
        <Text style={s.loading}>Ładowanie modelu głosowego...</Text>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({