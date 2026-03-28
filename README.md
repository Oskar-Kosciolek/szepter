# Szepter 🎙️

Głosowy asystent do notatek i list. React Native + Expo + Supabase.

## Stack
- Expo SDK 54 (React Native)
- Supabase (baza + auth + sync)
- whisper.rn (STT offline) / Groq Transcription
- expo-speech (TTS)
- Zustand (state)

## Setup
1. `cd apps/mobile && npm install`
2. Skopiuj `.env.example` → `.env` i uzupełnij klucze Supabase
3. `npx expo start`

## Fazy
- [x] Fundament (Expo + nawigacja + UI)
- [x] Auth (OTP)
- [x] CRUD notatek + Supabase
- [x] Transkrypcja głosowa (Groq)
- [ ] Listy (tabele są w bazie, brak UI)
- [ ] TTS (odczytywanie notatek głosem)
- [ ] Sync offline
- [ ] Historia nagrań