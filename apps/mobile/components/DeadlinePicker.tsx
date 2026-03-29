import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Calendar, X } from 'lucide-react-native'

type Props = {
  value: Date | null
  onChange: (date: Date | null) => void
}

export function DeadlinePicker({ value, onChange }: Props) {
  const [show, setShow] = useState(false)
  const [mode, setMode] = useState<'date' | 'time'>('date')
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date())

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (!selected) return
    if (Platform.OS === 'android') {
      if (mode === 'date') {
        setTempDate(selected)
        setMode('time')
      } else {
        setShow(false)
        setMode('date')
        onChange(selected)
      }
    } else {
      setTempDate(selected)
    }
  }

  const handleOpen = () => {
    setTempDate(value ?? new Date())
    setMode('date')
    setShow(true)
  }

  const handleIOSConfirm = () => {
    setShow(false)
    onChange(tempDate)
  }

  const formatDate = (d: Date) =>
    d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <View style={s.container}>
      {value ? (
        <View style={s.badge}>
          <Calendar size={12} color="#a78bfa" />
          <Text style={s.badgeText}>{formatDate(value)}</Text>
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <X size={12} color="#666" />
          </Pressable>
        </View>
      ) : (
        <Pressable style={s.addBtn} onPress={handleOpen}>
          <Calendar size={13} color="#666" />
          <Text style={s.addBtnText}>Dodaj termin</Text>
        </Pressable>
      )}

      {show && (
        <>
          <DateTimePicker
            value={tempDate}
            mode={mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={handleChange}
            locale="pl-PL"
          />
          {Platform.OS === 'ios' && (
            <View style={s.iosActions}>
              <Pressable onPress={() => setShow(false)}><Text style={s.iosCancel}>Anuluj</Text></Pressable>
              <Pressable onPress={handleIOSConfirm}><Text style={s.iosConfirm}>Gotowe</Text></Pressable>
            </View>
          )}
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:   { marginTop: 6 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  addBtnText:  { color: '#666', fontSize: 13 },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1a1a2e', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText:   { color: '#a78bfa', fontSize: 12 },
  iosActions:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  iosCancel:   { color: '#666', fontSize: 15 },
  iosConfirm:  { color: '#7c3aed', fontSize: 15, fontWeight: '600' },
})
