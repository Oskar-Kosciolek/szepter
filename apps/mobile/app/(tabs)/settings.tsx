import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, Pressable, StyleSheet, Switch,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Speech from 'expo-speech'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore, ReminderSettings, VoiceSettings } from '../../store/settingsStore'
import { calendarService } from '../../services/calendar'
import { ttsService } from '../../services/tts'

const BEFORE_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 godz', value: 60 },
  { label: '2 godz', value: 120 },
  { label: '1 dzień', value: 1440 },
]

const MORNING_HOURS = [6, 7, 8, 9, 10, 11, 12]
const RATE_STEPS = [0.5, 0.7, 0.9, 1.1, 1.3, 1.5]
const PITCH_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5]
const MAX_NOTES_OPTIONS = [
  { label: '1', value: 1 },
  { label: '3', value: 3 },
  { label: '5', value: 5 },
  { label: 'Wszystkie', value: 99 },
]

export default function SettingsScreen() {
  const { session, signOut } = useAuthStore()
  const {
    settings, loading, saving,
    fetchSettings, saveSettings,
    voice, fetchVoiceSettings, saveVoiceSettings,
  } = useSettingsStore()

  const [local, setLocal] = useState<ReminderSettings>(settings)
  const [localVoice, setLocalVoice] = useState<VoiceSettings>(voice)
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([])
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null)
  const [calendarConnecting, setCalendarConnecting] = useState(false)
  const [testingVoice, setTestingVoice] = useState(false)

  useEffect(() => { fetchSettings() }, [])
  useEffect(() => { fetchVoiceSettings() }, [])
  useEffect(() => { setLocal(settings) }, [settings])
  useEffect(() => { setLocalVoice(voice) }, [voice])
  useEffect(() => { calendarService.getAccountEmail().then(setCalendarEmail) }, [])
  useEffect(() => {
    Speech.getAvailableVoicesAsync().then(voices => {
      const polish = voices.filter(v =>
        v.language?.toLowerCase().startsWith('pl') ||
        v.identifier?.toLowerCase().includes('pl')
      )
      setAvailableVoices(polish.length > 0 ? polish : voices.slice(0, 8))
    })
  }, [])

  const toggleBefore = (value: number) => {
    setLocal(prev => ({
      ...prev,
      remindBeforeMinutes: prev.remindBeforeMinutes.includes(value)
        ? prev.remindBeforeMinutes.filter(v => v !== value)
        : [...prev.remindBeforeMinutes, value],
    }))
  }

  const handleSaveReminders = async () => {
    await saveSettings(local)
    Alert.alert('Zapisano', 'Ustawienia przypomnień zostały zapisane.')
  }

  const handleSaveVoice = async () => {
    await saveVoiceSettings(localVoice)
    Alert.alert('Zapisano', 'Ustawienia głosu zostały zapisane.')
  }

  const handleTestVoice = async () => {
    setTestingVoice(true)
    try {
      await ttsService.speak('Cześć, jestem Szepter', {
        rate: localVoice.ttsRate,
        pitch: localVoice.ttsPitch,
      })
    } finally {
      setTestingVoice(false)
    }
  }

  const handleCalendarConnect = useCallback(async () => {
    setCalendarConnecting(true)
    try {
      const ok = await calendarService.authorize()
      if (ok) {
        const email = await calendarService.getAccountEmail()
        setCalendarEmail(email)
      } else {
        Alert.alert('Anulowano', 'Nie połączono z Google Calendar.')
      }
    } catch {
      Alert.alert('Błąd', 'Nie udało się połączyć z Google Calendar.')
    } finally {
      setCalendarConnecting(false)
    }
  }, [])

  const handleCalendarDisconnect = useCallback(() => {
    Alert.alert('Rozłącz Google Calendar', 'Nowe zadania nie będą synchronizowane.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Rozłącz', style: 'destructive', onPress: async () => {
          await (calendarService as any).disconnect?.()
          setCalendarEmail(null)
        }
      },
    ])
  }, [])

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Ustawienia</Text>

        {/* Konto */}
        <View style={s.card}>
          <Text style={s.label}>Zalogowany jako</Text>
          <Text style={s.email}>{session?.user.email}</Text>
        </View>

        {/* Głos */}
        <Text style={s.sectionTitle}>Głos</Text>
        <View style={s.card}>
          {/* Głos TTS */}
          {availableVoices.length > 0 && (
            <>
              <Text style={s.rowLabel}>Głos TTS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {availableVoices.map(v => (
                    <Pressable
                      key={v.identifier}
                      style={[s.chipBtn, localVoice.ttsVoice === v.identifier && s.chipBtnActive]}
                      onPress={() => setLocalVoice(prev => ({ ...prev, ttsVoice: v.identifier }))}
                    >
                      <Text style={[s.chipText, localVoice.ttsVoice === v.identifier && s.chipTextActive]} numberOfLines={1}>
                        {v.name ?? v.identifier.split('-').slice(-1)[0]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Tempo */}
          <View style={[s.row, s.rowBorder]}>
            <Text style={s.rowLabel}>Tempo mówienia</Text>
            <View style={s.stepRow}>
              {RATE_STEPS.map(r => (
                <Pressable
                  key={r}
                  style={[s.stepBtn, localVoice.ttsRate === r && s.stepBtnActive]}
                  onPress={() => setLocalVoice(prev => ({ ...prev, ttsRate: r }))}
                >
                  <Text style={[s.stepText, localVoice.ttsRate === r && s.stepTextActive]}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Wysokość */}
          <View style={[s.row, s.rowBorder]}>
            <Text style={s.rowLabel}>Wysokość głosu</Text>
            <View style={s.stepRow}>
              {PITCH_STEPS.map(p => (
                <Pressable
                  key={p}
                  style={[s.stepBtn, localVoice.ttsPitch === p && s.stepBtnActive]}
                  onPress={() => setLocalVoice(prev => ({ ...prev, ttsPitch: p }))}
                >
                  <Text style={[s.stepText, localVoice.ttsPitch === p && s.stepTextActive]}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Test */}
          <Pressable style={[s.testBtn, testingVoice && s.saveBtnDisabled]} onPress={handleTestVoice} disabled={testingVoice}>
            {testingVoice
              ? <ActivityIndicator size="small" color="#a78bfa" />
              : <Text style={s.testBtnText}>▶ Przetestuj głos</Text>
            }
          </Pressable>
        </View>

        <Pressable style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSaveVoice} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.saveBtnText}>Zapisz ustawienia głosu</Text>
          }
        </Pressable>

        {/* Zachowanie */}
        <Text style={s.sectionTitle}>Zachowanie</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Potwierdzenia głosowe</Text>
            <Switch
              value={localVoice.voiceConfirmations}
              onValueChange={v => setLocalVoice(prev => ({ ...prev, voiceConfirmations: v }))}
              trackColor={{ false: '#2a2a2a', true: '#7c3aed' }}
              thumbColor="#fff"
            />
          </View>
          <View style={[s.row, s.rowBorder]}>
            <Text style={s.rowLabel}>Odczytaj po zapisie</Text>
            <Switch
              value={localVoice.autoReadAfterSave}
              onValueChange={v => setLocalVoice(prev => ({ ...prev, autoReadAfterSave: v }))}
              trackColor={{ false: '#2a2a2a', true: '#7c3aed' }}
              thumbColor="#fff"
            />
          </View>
          <View style={[s.row, s.rowBorder]}>
            <Text style={s.rowLabel}>Tryb cichy (wyłącz TTS)</Text>
            <Switch
              value={localVoice.ttsSilentMode}
              onValueChange={v => setLocalVoice(prev => ({ ...prev, ttsSilentMode: v }))}
              trackColor={{ false: '#2a2a2a', true: '#7c3aed' }}
              thumbColor="#fff"
            />
          </View>
          <View style={[s.row, s.rowBorder]}>
            <Text style={s.rowLabel}>Maks. notatek do odczytania</Text>
            <View style={s.stepRow}>
              {MAX_NOTES_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  style={[s.stepBtn, localVoice.maxNotesToRead === opt.value && s.stepBtnActive]}
                  onPress={() => setLocalVoice(prev => ({ ...prev, maxNotesToRead: opt.value }))}
                >
                  <Text style={[s.stepText, localVoice.maxNotesToRead === opt.value && s.stepTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Pressable style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSaveVoice} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.saveBtnText}>Zapisz zachowanie</Text>
          }
        </Pressable>

        {/* Przypomnienia */}
        <Text style={s.sectionTitle}>Przypomnienia</Text>

        {loading ? <ActivityIndicator color="#a78bfa" style={{ marginVertical: 20 }} /> : (
          <>
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.rowLabel}>Dzień przed</Text>
                <Switch
                  value={local.remindDayBefore}
                  onValueChange={v => setLocal(prev => ({ ...prev, remindDayBefore: v }))}
                  trackColor={{ false: '#2a2a2a', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              </View>
              <View style={[s.row, s.rowBorder]}>
                <Text style={s.rowLabel}>Rano w dniu terminu</Text>
                <Switch
                  value={local.remindMorningOf}
                  onValueChange={v => setLocal(prev => ({ ...prev, remindMorningOf: v }))}
                  trackColor={{ false: '#2a2a2a', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              </View>
              {local.remindMorningOf && (
                <View style={[s.row, s.rowBorder]}>
                  <Text style={s.rowLabel}>Godzina poranna</Text>
                  <View style={s.hourPicker}>
                    {MORNING_HOURS.map(h => (
                      <Pressable
                        key={h}
                        style={[s.hourBtn, local.morningReminderHour === h && s.hourBtnActive]}
                        onPress={() => setLocal(prev => ({ ...prev, morningReminderHour: h }))}
                      >
                        <Text style={[s.hourBtnText, local.morningReminderHour === h && s.hourBtnTextActive]}>
                          {h}:00
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <Text style={s.subLabel}>Przed terminem</Text>
            <View style={s.card}>
              <View style={s.checkboxGroup}>
                {BEFORE_OPTIONS.map(opt => {
                  const active = local.remindBeforeMinutes.includes(opt.value)
                  return (
                    <Pressable key={opt.value} style={s.checkboxRow} onPress={() => toggleBefore(opt.value)}>
                      <View style={[s.checkbox, active && s.checkboxActive]}>
                        {active && <Text style={s.checkmark}>✓</Text>}
                      </View>
                      <Text style={s.checkboxLabel}>{opt.label}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <Pressable style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSaveReminders} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.saveBtnText}>Zapisz przypomnienia</Text>
              }
            </Pressable>
          </>
        )}

        {/* Integracje */}
        <Text style={s.sectionTitle}>Integracje</Text>
        <View style={s.card}>
          {calendarEmail ? (
            <>
              <Text style={s.label}>Połączono z Google Calendar</Text>
              <Text style={s.email}>{calendarEmail}</Text>
              <Pressable style={s.disconnectBtn} onPress={handleCalendarDisconnect}>
                <Text style={s.disconnectText}>Rozłącz</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={[s.connectBtn, calendarConnecting && s.saveBtnDisabled]} onPress={handleCalendarConnect} disabled={calendarConnecting}>
              {calendarConnecting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.connectBtnText}>Połącz z Google Calendar</Text>
              }
            </Pressable>
          )}
        </View>

        {/* Wyloguj */}
        <Pressable style={s.signOutBtn} onPress={signOut}>
          <Text style={s.signOutText}>Wyloguj</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  title:             { fontSize: 28, fontWeight: '300', color: '#fff', letterSpacing: 4, marginBottom: 24 },
  sectionTitle:      { color: '#555', fontSize: 12, letterSpacing: 2, marginBottom: 10, marginTop: 8 },
  subLabel:          { color: '#555', fontSize: 12, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  card:              { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a', gap: 4 },
  label:             { color: '#555', fontSize: 12, letterSpacing: 1 },
  email:             { color: '#fff', fontSize: 15 },
  row:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowBorder:         { borderTopWidth: 1, borderTopColor: '#2a2a2a', marginTop: 10, paddingTop: 14 },
  rowLabel:          { color: '#ccc', fontSize: 15, flex: 1 },
  hourPicker:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, justifyContent: 'flex-end' },
  hourBtn:           { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#2a2a2a' },
  hourBtnActive:     { backgroundColor: '#4c1d95' },
  hourBtnText:       { color: '#555', fontSize: 12 },
  hourBtnTextActive: { color: '#fff' },
  checkboxGroup:     { gap: 12 },
  checkboxRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox:          { width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
  checkboxActive:    { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  checkmark:         { color: '#fff', fontSize: 12, fontWeight: '600' },
  checkboxLabel:     { color: '#ccc', fontSize: 15 },
  // Steps (rate/pitch/max notes)
  stepRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  stepBtn:           { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: '#2a2a2a' },
  stepBtnActive:     { backgroundColor: '#4c1d95' },
  stepText:          { color: '#555', fontSize: 12 },
  stepTextActive:    { color: '#fff' },
  // Chip (voice selector)
  chipBtn:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#2a2a2a', maxWidth: 120 },
  chipBtnActive:     { backgroundColor: '#4c1d95' },
  chipText:          { color: '#555', fontSize: 12 },
  chipTextActive:    { color: '#fff' },
  // Test button
  testBtn:           { marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: '#1a0a2e', borderWidth: 1, borderColor: '#4c1d95', alignItems: 'center' },
  testBtnText:       { color: '#a78bfa', fontSize: 14 },
  // Action buttons
  saveBtn:           { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  saveBtnDisabled:   { opacity: 0.5 },
  saveBtnText:       { color: '#fff', fontWeight: '600', fontSize: 15 },
  connectBtn:        { borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: '#4285f4' },
  connectBtnText:    { color: '#fff', fontWeight: '600', fontSize: 15 },
  disconnectBtn:     { marginTop: 10, borderRadius: 10, padding: 10, alignItems: 'center', backgroundColor: '#2a2a2a' },
  disconnectText:    { color: '#f87171', fontSize: 14 },
  signOutBtn:        { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#3f1a1a', marginBottom: 20 },
  signOutText:       { color: '#f87171', fontWeight: '500' },
})
