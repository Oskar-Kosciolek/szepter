# Szepter 🎙️

Głosowy asystent do notatek i list. React Native + Expo + Supabase.

## Stack

- Expo SDK 54 (React Native)
- Supabase (baza + auth + sync)
- Groq Whisper API (STT) + wzorzec Strategy (łatwa podmiana)
- Groq LLaMA 3.1 (parser komend głosowych) + fallback regex
- expo-speech (TTS, głos pl-pl-x-bmg-network)
- Zustand (state management)

## Setup

1. `cd apps/mobile && npm install`
2. Skopiuj `.env.example` → `.env` i uzupełnij klucze:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_GROQ_API_KEY`
3. Uruchom migracje bazy: `supabase db push`
4. `npx expo start --dev-client`

## Architektura
```
apps/mobile/
├── app/              ← ekrany (Expo Router)
├── store/            ← stan globalny (Zustand)
├── services/
│   ├── transcription/  ← STT (Strategy: Groq / Whisper offline)
│   ├── commandParser/  ← parser komend (Strategy: LLM / Regex)
│   └── tts/            ← TTS (Strategy: expo-speech / ElevenLabs)
└── lib/              ← konfiguracja (Supabase)
```

## Komendy głosowe

| Komenda | Przykład |
|---|---|
| Zapisz notatkę | "Zapisz pomysł na nową funkcję" |
| Utwórz listę | "Stwórz listę zakupów" |
| Dodaj do listy | "Dodaj mleko i chleb do listy zakupów" |
| Odczytaj notatki | "Odczytaj moje notatki" |
| Usuń notatkę | "Usuń ostatnią notatkę" |

## Roadmap

### ✅ Zrealizowane
- [x] Fundament + nawigacja (Expo Router)
- [x] Auth (OTP bez hasła)
- [x] CRUD notatek + sync Supabase
- [x] CRUD list + elementy list
- [x] Transkrypcja głosowa (Groq Whisper API)
- [x] Parser komend głosowych (LLM + fallback regex)
- [x] TTS odczytywanie notatek (expo-speech)
- [x] Wzorzec Strategy dla STT, TTS i parsera komend

### 🔧 Milestone 0 — Refactor (tylko JS)
- [x] Struktura features/ hooks/ components/
- [x] Wydzielenie komponentów z ekranów
- [x] Custom hooks (useRecorder, useCommand)
- [x] Lepsza obsługa błędów i stanów ładowania

### 📅 Milestone 1 — Zadania + kalendarz (build #4)
- [x] Deadliny dla notatek i elementów list
- [ ] Przypomnienia push (expo-notifications)
- [ ] Sync Google Calendar
- [ ] Komendy głosowe dla zadań

### 📋 Milestone 2 — Listy pełna funkcjonalność (tylko JS)
- [x] Odczytywanie list głosem
- [x] Oznaczanie elementów jako zrobione głosem
- [x] Usuwanie elementów głosem
- [x] Przeciąganie elementów (kolejność)

### 🎙️ Milestone 3 — Wake word + nasłuch w tle (build #5)
- [ ] Foreground service Android
- [ ] Wake word detection (Picovoice Porcupine)
- [ ] Aktywacja bez dotykania ekranu

### 🔄 Milestone 4 — Sync offline + web app (build #6)
- [ ] SQLite lokalnie + kolejka sync
- [ ] Web app Next.js (ta sama Supabase)
- [ ] Tagi i wyszukiwanie głosowe
- [ ] Eksport notatek (markdown/PDF)

### ✨ Milestone 5 — Polish + UX (tylko JS)
- [x] Onboarding (instrukcja komend)
- [x] Ustawienia (głos, język, czułość)
- [x] Tryb cichy (TTS off gdy słuchawki)
- [x] Historia nagrań