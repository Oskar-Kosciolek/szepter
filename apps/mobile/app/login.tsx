import { useState } from 'react'
import {
  View, Text, TextInput, Pressable,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '../store/authStore'

export default function LoginScreen() {
  const { signInWithEmail, verifyOtp } = useAuthStore()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const { error } = await signInWithEmail(email.trim())
    setLoading(false)
    if (error) setError(error)
    else setSent(true)
  }

  const handleVerify = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    const { error } = await verifyOtp(email.trim(), code.trim())
    setLoading(false)
    if (error) setError('Nieprawidłowy kod. Spróbuj ponownie.')
  }

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.inner}
      >
        <Text style={s.title}>Szepter</Text>
        <Text style={s.subtitle}>Twój głosowy notatnik</Text>

        {!sent ? (
          <View style={s.form}>
            <Text style={s.label}>Adres email</Text>
            <TextInput
              style={s.input}
              placeholder="ty@email.com"
              placeholderTextColor="#444"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {error && <Text style={s.error}>{error}</Text>}
            <Pressable
              style={[s.btn, (!email.trim() || loading) && s.btnDisabled]}
              onPress={handleSend}
              disabled={!email.trim() || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Wyślij kod</Text>
              }
            </Pressable>
          </View>
        ) : (
          <View style={s.form}>
            <Text style={s.label}>Kod z emaila</Text>
            <Text style={s.hint}>Wysłaliśmy 6-cyfrowy kod na {email}</Text>
            <TextInput
              style={[s.input, s.codeInput]}
              placeholder="00000000"
              placeholderTextColor="#444"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
            />
            {error && <Text style={s.error}>{error}</Text>}
            <Pressable
              style={[s.btn, (!code.trim() || loading) && s.btnDisabled]}
              onPress={handleVerify}
              disabled={code.length < 8 || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Zaloguj</Text>
              }
            </Pressable>
            <Pressable onPress={() => { setSent(false); setCode(''); setError(null) }}>
              <Text style={s.resend}>Wróć i zmień email</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0a0a0a' },
  inner:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:      { fontSize: 36, fontWeight: '300', color: '#fff', letterSpacing: 8, marginBottom: 8 },
  subtitle:   { fontSize: 14, color: '#555', letterSpacing: 2, marginBottom: 60 },
  form:       { width: '100%', gap: 12 },
  label:      { color: '#888', fontSize: 13, letterSpacing: 1 },
  hint:       { color: '#555', fontSize: 13 },
  input:      { backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a' },
  codeInput:  { fontSize: 28, letterSpacing: 12, textAlign: 'center', fontWeight: '300' },
  error:      { color: '#f87171', fontSize: 13 },
  btn:        { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled:{ opacity: 0.4 },
  btnText:    { color: '#fff', fontWeight: '500', fontSize: 15 },
  resend:     { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 8 },
})