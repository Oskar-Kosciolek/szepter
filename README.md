# Szepter 🎙️

Głosowy asystent do notatek i list. React Native + Expo + Supabase.

## Stack
- Expo SDK 55 (React Native)
- Supabase (baza + auth + sync)
- whisper.rn (STT offline)
- expo-speech (TTS)
- Zustand (state)

## Setup
1. `cd apps/mobile && npm install`
2. Skopiuj `.env.example` → `.env` i uzupełnij klucze Supabase
3. `npx expo start`

## Fazy
- [x] Fundament + repo
- [ ] CRUD notatek i list
- [ ] Integracja głosowa (whisper.rn)
- [ ] Sync Supabase