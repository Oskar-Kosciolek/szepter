# Sync — Dług techniczny i decyzje architektoniczne

## Obecna strategia: last-write-wins po `updated_at`

Implementacja w `apps/mobile/services/sync/SyncService.ts`.

### Jak działa (dla Notes):
1. **PUSH unsynced** — lokalne rekordy z `_synced=0` są upsertowane do Supabase.
2. **PUSH deletes** — lokalne rekordy z `_deleted=1` są usuwane z Supabase, potem hard-delete lokalnie.
3. **PULL** — pobieramy z Supabase rekordy z `updated_at > lastSync` (timestamp zapisany w AsyncStorage).
4. **Konflikt** — jeśli lokalny rekord jest `_synced=0` i `_deleted=0` (niezsynch. zmiana), porównujemy `updated_at`:
   - remote >= local → remote wygrywa, nadpisujemy lokalnie
   - local > remote → local wygrywa, skip remote (rekord zostanie wypchnięty przy następnym push)

### Lists i ListItems:
Tabele `lists` i `list_items` w Supabase **nie mają kolumny `updated_at`**. Pull zawsze pobiera wszystkie rekordy.
Konflikt resolution: lokalna niezsynch. zmiana wygrywa (remote skip).

---

## Znane ograniczenia

### 1. Zmiana zegara urządzenia
Last-write-wins opiera się na porównaniu `updated_at` między lokalnym SQLite a Supabase.
Jeśli zegar urządzenia jest cofnięty, lokalna zmiana może fałszywie "przegrać" z starą wersją z serwera.
**Brak mitygacji w obecnej implementacji.**

### 2. Konflikt offline na 2 urządzeniach
Scenariusz:
- Urządzenie A i B są offline.
- Oba edytują tę samą notatkę.
- Urządzenie A synchronizuje się pierwsze — jego wersja trafia na serwer.
- Urządzenie B synchronizuje się — jeśli `updated_at` B > A, B nadpisuje A. Zmiana z A jest **bezpowrotnie utracona**.

W tym modelu nie ma merge'a — jedna z wersji zawsze wygrywa w całości.

### 3. Lists/ListItems bez `updated_at` w Supabase
Pull zawsze pobiera **wszystkie** rekordy list i ich elementów, niezależnie od daty ostatniego sync.
Przy dużej liczbie list jest to nieefektywne. Należy dodać `updated_at` do obu tabel w Supabase.

### 4. AsyncStorage w SyncService (mobile-only)
`SupabaseSyncService` używa `AsyncStorage` do przechowywania timestampów ostatniego sync.
To uzależnia implementację od React Native. Web nie może użyć tej samej klasy.

### 5. Singleton `syncService`
`export const syncService = new SupabaseSyncService()` łamie wzorzec Strategy —
konsumenci biorą konkretną implementację zamiast wstrzyknięcia interfejsu.
Utrudnia testowanie i podmianę na inną implementację (np. mock w testach).

### 6. `supabase` klient importowany bezpośrednio w `SupabaseSyncService`
Klient powinien być wstrzykiwany przez konstruktor, nie importowany globalnie.
Utrudnia testowanie i blokuje podejście z różnymi klientami (np. admin client).

---

## Propozycja przyszłego rozwiązania

### Opcja A: Vector clocks (CRDTs)
Każda zmiana niesie ze sobą licznik wersji per-device (`{ deviceId: version }`).
Merge jest deterministyczny i nie traci danych.
- **Pro:** Brak utraty danych przy równoległych zmianach offline.
- **Con:** Znacznie większa złożoność implementacji; wymaga zmiany schematu DB.

### Opcja B: Supabase Realtime jako źródło prawdy
Zamiast pull-based sync, urządzenia subskrybują zmiany przez Supabase Realtime (WebSockets).
Offline queue lokalnie, wysyłka po odzyskaniu połączenia.
- **Pro:** Proste, spójna logika, Supabase obsługuje rozgłaszanie.
- **Con:** Wymaga stałego połączenia do działania real-time; pull i tak potrzebny przy cold start.

### Opcja C: Supabase + `updated_at` wszędzie + `updated_at` w Supabase dla lists/list_items
Krótkoterminowy fix — dodanie `updated_at` do tabel `lists` i `list_items` w Supabase.
Pozwala na delta-pull zamiast full-pull, bez zmiany strategii.

### Rekomendacja dla M5+
1. **Krótko:** Dodaj `updated_at` do `lists` i `list_items` w Supabase (migracja SQL).
2. **Średnio:** Wstrzyknij `supabase` i `storage` przez konstruktor `SupabaseSyncService`.
3. **Długo:** Rozważ Supabase Realtime do live updates + lokalny SQLite jako cache.
