import { useState, useEffect, useRef } from 'react'
import { View, Text, Pressable, Animated, StyleSheet, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Mic, MicOff } from 'lucide-react-native'

const { width } = Dimensions.get('window')
const BTN_SIZE = width * 0.38

export default function HomeScreen() {
  const [listening, setListening] = useState(false)
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
          Animated.timing(anim, { toValue: 1,   duration: 900, useNativeDriver: true }),
        ])
      ).start()

    animate(pulse1, 0)
    animate(pulse2, 300)
    animate(pulse3, 600)
  }, [listening])

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Szepter</Text>
      <Text style={s.subtitle}>
        {listening ? 'Słucham...' : 'Naciśnij aby mówić'}
      </Text>

      <View style={s.btnWrap}>
        {[pulse1, pulse2, pulse3].map((anim, i) => (
          <Animated.View
            key={i}
            style={[s.ring, { transform: [{ scale: anim }], opacity: listening ? 0.15 - i * 0.04 : 0 }]}
          />
        ))}

        <Pressable
          onPress={() => setListening(v => !v)}
          style={[s.btn, listening && s.btnActive]}
        >
          {listening
            ? <MicOff size={BTN_SIZE * 0.38} color="#fff" />
            : <Mic     size={BTN_SIZE * 0.38} color="#fff" />
          }
        </Pressable>
      </View>

      <Text style={s.hint}>
        {listening ? 'Powiedz np. "Zapisz pomysł..."' : ''}
      </Text>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 32, fontWeight: '300', color: '#fff', letterSpacing: 8, marginBottom: 8 },
  subtitle:   { fontSize: 14, color: '#666', marginBottom: 60, letterSpacing: 2 },
  btnWrap:    { width: BTN_SIZE * 1.8, height: BTN_SIZE * 1.8, alignItems: 'center', justifyContent: 'center' },
  ring:       { position: 'absolute', width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE, backgroundColor: '#a78bfa' },
  btn:        { width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  btnActive:  { backgroundColor: '#4c1d95', borderColor: '#7c3aed' },
  hint:       { position: 'absolute', bottom: 120, fontSize: 13, color: '#555', letterSpacing: 1 },
})