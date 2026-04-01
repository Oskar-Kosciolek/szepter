import { useRef, useEffect } from 'react'
import { Pressable, Animated, View, StyleSheet, Dimensions } from 'react-native'
import { Mic, MicOff, Loader } from 'lucide-react-native'
import type { WakeWordState } from '../hooks/useWakeWord'

const { width } = Dimensions.get('window')
const BTN_SIZE = width * 0.38

export type MicMode = 'idle' | 'recording' | 'processing' | WakeWordState

type Props = {
  listening: boolean
  transcribing: boolean
  onPress: () => void
  /** Stan wake word — opcjonalny; gdy undefined zachowuje się jak dotychczas. */
  wakeWordState?: WakeWordState
}

export function MicButton({ listening, transcribing, onPress, wakeWordState }: Props) {
  const pulse1 = useRef(new Animated.Value(1)).current
  const pulse2 = useRef(new Animated.Value(1)).current
  const pulse3 = useRef(new Animated.Value(1)).current

  const isListeningWake = wakeWordState === 'listening_wake'
  const isActivated = wakeWordState === 'activated'
  // Dowolna animacja pulsowania: recording lub listening_wake
  const shouldPulse = listening || isListeningWake || isActivated

  useEffect(() => {
    if (!shouldPulse) {
      pulse1.setValue(1)
      pulse2.setValue(1)
      pulse3.setValue(1)
      return
    }
    const speed = isListeningWake ? 1400 : 900   // wolniejsze dla idle wake
    const animate = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.6, duration: speed, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: speed, useNativeDriver: true }),
        ])
      ).start()

    animate(pulse1, 0)
    animate(pulse2, 300)
    animate(pulse3, 600)
  }, [shouldPulse, isListeningWake])

  const ringColor = isListeningWake ? '#4c1d95' : '#a78bfa'
  const ringOpacity = isListeningWake ? 0.08 : 0.15

  return (
    <View style={s.btnWrap}>
      {[pulse1, pulse2, pulse3].map((anim, i) => (
        <Animated.View
          key={i}
          style={[s.ring, {
            backgroundColor: ringColor,
            transform: [{ scale: anim }],
            opacity: shouldPulse ? ringOpacity - i * 0.02 : 0,
          }]}
        />
      ))}
      <Pressable
        onPress={onPress}
        style={[
          s.btn,
          listening && s.btnActive,
          transcribing && s.btnProcessing,
          isListeningWake && s.btnWake,
          isActivated && s.btnActivated,
        ]}
        disabled={transcribing}
      >
        {transcribing
          ? <Loader size={BTN_SIZE * 0.38} color="#fff" />
          : listening
            ? <MicOff size={BTN_SIZE * 0.38} color="#fff" />
            : <Mic size={BTN_SIZE * 0.38} color={isListeningWake ? '#6d28d9' : '#fff'} />
        }
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  btnWrap:      { width: BTN_SIZE * 1.8, height: BTN_SIZE * 1.8, alignItems: 'center', justifyContent: 'center' },
  ring:         { position: 'absolute', width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE },
  btn:          { width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  btnActive:    { backgroundColor: '#4c1d95', borderColor: '#7c3aed' },
  btnProcessing:{ backgroundColor: '#1a1a2e', borderColor: '#3730a3' },
  btnWake:      { backgroundColor: '#0f0a1e', borderColor: '#2e1065', borderWidth: 2 },   // stonowany fiolet — idle wake
  btnActivated: { backgroundColor: '#4c1d95', borderColor: '#7c3aed', borderWidth: 2 },  // pełny kolor — wykryto wake word
})
