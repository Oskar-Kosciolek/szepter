import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function NotesScreen() {
  return (
    <SafeAreaView style={s.container}>
      <Text style={s.text}>Notatki</Text>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  text:      { color: '#666', fontSize: 16 },
})