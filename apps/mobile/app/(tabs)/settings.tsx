import { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Switch, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore, ReminderSettings } from '../../store/settingsStore'

const BEFORE_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 godz', value: 60 },
  { label: '2 godz', value: 120 },
  { label: '1 dzień', value: 1440 },
]

const MORNING_HOURS = [6, 7, 8, 9, 10, 11, 12]

export default function SettingsScreen() {
  const { session, signOut } = useAuthStore()
  const { settings, loading, saving, fetchSettings, saveSettings } = useSettingsStore()
  const [local, setLocal] = useState<ReminderSettings>(settings)

  useEffect(() => { fetchSettings() }, [])
  useEffect(() => { setLocal(settings) }, [settings])

  const toggleBefore = (value: number) => {
    setLocal(prev => ({
      ...prev,
      remindBeforeMinutes: prev.remindBeforeMinutes.includes(value)
        ? prev.remindBeforeMinutes.filter(v => v !== value)
        : [...prev.remindBeforeMinutes, value],
    }))
  }

  const handleSave = async () => {
    await saveSettings(local)
    Alert.alert('Zapisano', 'Ustawienia przypomnień zostały zapisane.')
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Ustawienia</Text>

        {/* Konto */}
        <View style={s.card}>
          <Text style={s.label}>Zalogowany jako</Text>
          <Text style={s.email}>{session?.user.email}</Text>
        </View>

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

            <Pressable style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.saveBtnText}>Zapisz ustawienia</Text>
              }
            </Pressable>
          </>
        )}

        {/* Wyloguj */}
        <Pressable style={s.signOutBtn} onPress={signOut}>
          <Text style={s.signOutText}>Wyloguj</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  title:            { fontSize: 28, fontWeight: '300', color: '#fff', letterSpacing: 4, marginBottom: 24 },
  sectionTitle:     { color: '#555', fontSize: 12, letterSpacing: 2, marginBottom: 10, marginTop: 8 },
  subLabel:         { color: '#555', fontSize: 12, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  card:             { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  label:            { color: '#555', fontSize: 12, letterSpacing: 1 },
  email:            { color: '#fff', fontSize: 15 },
  row:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowBorder:        { borderTopWidth: 1, borderTopColor: '#2a2a2a', marginTop: 10, paddingTop: 14 },
  rowLabel:         { color: '#ccc', fontSize: 15 },
  hourPicker:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, justifyContent: 'flex-end' },
  hourBtn:          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#2a2a2a' },
  hourBtnActive:    { backgroundColor: '#4c1d95' },
  hourBtnText:      { color: '#555', fontSize: 12 },
  hourBtnTextActive:{ color: '#fff' },
  checkboxGroup:    { gap: 12 },
  checkboxRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox:         { width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
  checkboxActive:   { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  checkmark:        { color: '#fff', fontSize: 12, fontWeight: '600' },
  checkboxLabel:    { color: '#ccc', fontSize: 15 },
  saveBtn:          { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  saveBtnDisabled:  { opacity: 0.5 },
  saveBtnText:      { color: '#fff', fontWeight: '600', fontSize: 15 },
  signOutBtn:       { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#3f1a1a', marginBottom: 20 },
  signOutText:      { color: '#f87171', fontWeight: '500' },
})
