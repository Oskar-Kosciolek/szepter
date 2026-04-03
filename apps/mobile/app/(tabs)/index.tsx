import { Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MicButton } from '../../components/MicButton'
import { useVoiceFlow } from '../../hooks/useVoiceFlow'
import { useWakeWord } from '../../hooks/useWakeWord'

export default function HomeScreen() {
  const { handlePress, startAutoRecording, listening, status, transcribing } = useVoiceFlow()
  const { wakeWordState } = useWakeWord(startAutoRecording)

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Szepter</Text>
      <Text style={s.subtitle} numberOfLines={2}>{status}</Text>
      <MicButton
        listening={listening}
        transcribing={transcribing}
        onPress={handlePress}
        wakeWordState={wakeWordState}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 32, fontWeight: '300', color: '#fff', letterSpacing: 8, marginBottom: 8 },
  subtitle:  { fontSize: 14, color: '#666', marginBottom: 60, letterSpacing: 2, textAlign: 'center', paddingHorizontal: 40 },
})
