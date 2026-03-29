import { useRef, useEffect } from 'react'
import { Pressable, Animated, View, StyleSheet, Dimensions } from 'react-native'
import { Mic, MicOff, Loader } from 'lucide-react-native'

const { width } = Dimensions.get('window')
const BTN_SIZE = width * 0.38

type Props = {
  listening: boolean
  transcribing: boolean
  onPress: () => void
}

export function MicButton({ listening, transcribing, onPress }: Props) {
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

  return (
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
        onPress={onPress}
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
  )
}

const s = StyleSheet.create({
  btnWrap:       { width: BTN_SIZE * 1.8, height: BTN_SIZE * 1.8, alignItems: 'center', justifyContent: 'center' },
  ring:          { position: 'absolute', width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE, backgroundColor: '#a78bfa' },
  btn:           { width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  btnActive:     { backgroundColor: '#4c1d95', borderColor: '#7c3aed' },
  btnProcessing: { backgroundColor: '#1a1a2e', borderColor: '#3730a3' },
})
