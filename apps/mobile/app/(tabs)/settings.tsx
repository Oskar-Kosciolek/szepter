import { View, Text, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '../../store/authStore'

export default function SettingsScreen() {
  const { session, signOut } = useAuthStore()

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Ustawienia</Text>
      <View style={s.card}>
        <Text style={s.label}>Zalogowany jako</Text>
        <Text style={s.email}>{session?.user.email}</Text>
      </View>
      <Pressable style={s.btn} onPress={signOut}>
        <Text style={s.btnText}>Wyloguj</Text>
      </Pressable>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  title:     { fontSize: 28, fontWeight: '300', color: '#fff', letterSpacing: 4, marginBottom: 24 },
  card:      { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a', gap: 4 },
  label:     { color: '#555', fontSize: 12, letterSpacing: 1 },
  email:     { color: '#fff', fontSize: 15 },
  btn:       { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#3f1a1a' },
  btnText:   { color: '#f87171', fontWeight: '500' },
})