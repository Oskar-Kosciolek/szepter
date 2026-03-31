import { useState, useRef } from 'react'
import {
  View, Text, FlatList, Pressable, StyleSheet,
  Dimensions, ScrollView, useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Mic, FileText, List, Zap } from 'lucide-react-native'

const COMMANDS = [
  { command: 'Zapisz notatkę',   example: '"Zapisz pomysł na nową funkcję"' },
  { command: 'Utwórz listę',     example: '"Stwórz listę zakupów"' },
  { command: 'Dodaj do listy',   example: '"Dodaj mleko i chleb do listy zakupów"' },
  { command: 'Dodaj zadanie',    example: '"Dodaj zadanie zadzwoń do lekarza na jutro o 10"' },
  { command: 'Odczytaj notatki', example: '"Odczytaj moje notatki"' },
  { command: 'Usuń notatkę',     example: '"Usuń ostatnią notatkę"' },
]

type Slide = {
  id: string
  Icon?: typeof Mic | null
  title: string
  subtitle?: string | null
  description?: string | null
}

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    Icon: null,
    title: 'Szepter',
    subtitle: 'Twój głosowy asystent',
    description: 'Kontroluj notatki, listy i zadania za pomocą głosu — bez dotykania ekranu.',
  },
  {
    id: 'mic',
    Icon: Mic,
    title: 'Naciśnij mikrofon i mów',
    description: 'Przytrzymaj przycisk mikrofonu i wypowiedz komendę.\nSzepter przetworzy ją automatycznie.',
  },
  {
    id: 'notes',
    Icon: FileText,
    title: 'Zapisuj notatki i pomysły',
    description: '"Zapisz pomysł na nową funkcję"\n"Zanotuj że mam spotkanie o 15:00"\n"Dodaj zadanie zadzwoń do lekarza na jutro"',
  },
  {
    id: 'lists',
    Icon: List,
    title: 'Twórz listy i zadania',
    description: '"Stwórz listę zakupów"\n"Dodaj mleko i chleb do listy zakupów"\n"Utwórz listę zadań na ten tydzień"',
  },
  {
    id: 'commands',
    Icon: Zap,
    title: 'Naturalny język',
    subtitle: 'Dostępne komendy głosowe',
    description: null,
  },
]

export default function OnboardingScreen() {
  const { width } = useWindowDimensions()
  const [currentIndex, setCurrentIndex] = useState(0)
  const listRef = useRef<FlatList<Slide>>(null)
  const isLast = currentIndex === SLIDES.length - 1

  const goNext = () => {
    if (isLast) {
      finish()
    } else {
      const next = currentIndex + 1
      listRef.current?.scrollToIndex({ index: next, animated: true })
      setCurrentIndex(next)
    }
  }

  const finish = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true')
    router.replace('/(tabs)')
  }

  const renderSlide = ({ item }: { item: Slide }) => {
    const Icon = item.Icon

    if (item.id === 'welcome') {
      return (
        <View style={[s.slide, { width }]}>
          <View style={s.logoWrap}>
            <Text style={s.logoSymbol}>◉</Text>
          </View>
          <Text style={s.slideTitle}>{item.title}</Text>
          <Text style={s.slideSubtitle}>{item.subtitle}</Text>
          <Text style={s.slideDesc}>{item.description}</Text>
        </View>
      )
    }

    if (item.id === 'commands') {
      return (
        <View style={[s.slide, { width }]}>
          {Icon && <Icon size={44} color="#7c3aed" />}
          <Text style={[s.slideTitle, { marginTop: 20 }]}>{item.title}</Text>
          <Text style={s.tableLabel}>{item.subtitle}</Text>
          <ScrollView style={s.tableWrap} showsVerticalScrollIndicator={false}>
            {COMMANDS.map((cmd, i) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                <Text style={s.tableCmd}>{cmd.command}</Text>
                <Text style={s.tableEx}>{cmd.example}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )
    }

    return (
      <View style={[s.slide, { width }]}>
        {Icon && <Icon size={44} color="#7c3aed" />}
        <Text style={[s.slideTitle, { marginTop: 20 }]}>{item.title}</Text>
        <Text style={s.slideDesc}>{item.description}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={renderSlide}
        style={{ flex: 1 }}
      />

      {/* Dots */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[s.dot, i === currentIndex && s.dotActive]} />
        ))}
      </View>

      {/* Buttons */}
      <View style={s.btnRow}>
        {!isLast && (
          <Pressable style={s.skipBtn} onPress={finish}>
            <Text style={s.skipText}>Pomiń</Text>
          </Pressable>
        )}
        <Pressable style={[s.nextBtn, isLast && s.nextBtnFull]} onPress={goNext}>
          <Text style={s.nextText}>{isLast ? 'Zaczynamy!' : 'Dalej'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0a0a0a' },
  slide:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoWrap:     { width: 88, height: 88, borderRadius: 44, backgroundColor: '#1a0a2e', borderWidth: 1, borderColor: '#4c1d95', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  logoSymbol:   { fontSize: 40, color: '#a78bfa' },
  slideTitle:   { fontSize: 26, fontWeight: '300', color: '#fff', letterSpacing: 4, textAlign: 'center', marginBottom: 12 },
  slideSubtitle:{ fontSize: 15, color: '#a78bfa', textAlign: 'center', marginBottom: 16 },
  slideDesc:    { fontSize: 15, color: '#777', textAlign: 'center', lineHeight: 24 },
  tableLabel:   { fontSize: 11, color: '#555', letterSpacing: 2, marginTop: 8, marginBottom: 12, alignSelf: 'flex-start' },
  tableWrap:    { width: '100%', maxHeight: 300 },
  tableRow:     { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8, gap: 8, alignItems: 'center' },
  tableRowAlt:  { backgroundColor: '#111' },
  tableCmd:     { color: '#a78bfa', fontSize: 13, fontWeight: '500', flex: 1.2 },
  tableEx:      { color: '#555', fontSize: 11, flex: 1.8, textAlign: 'right' },
  dots:         { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingVertical: 20 },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2a2a2a' },
  dotActive:    { width: 20, backgroundColor: '#7c3aed' },
  btnRow:       { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  skipBtn:      { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#1a1a1a' },
  skipText:     { color: '#555', fontSize: 15 },
  nextBtn:      { flex: 2, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#7c3aed' },
  nextBtnFull:  { flex: 1 },
  nextText:     { color: '#fff', fontSize: 15, fontWeight: '600' },
})
