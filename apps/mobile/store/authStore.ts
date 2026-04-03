import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { clearAllData } from '../lib/localDb'
import { syncService } from '../services/sync/SyncService'

type AuthStore = {
    session: Session | null
    loading: boolean
    fetchSession: () => Promise<void>
    signInWithEmail: (email: string) => Promise<{ error: string | null }>
    verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
    seedIfNeeded: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    session: null,
    loading: true,

    fetchSession: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        set({ session, loading: false })

        supabase.auth.onAuthStateChange((_event, session) => {
            set({ session })
        })
    },

    signInWithEmail: async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                emailRedirectTo: undefined // wyłączamy magic link
            }
        })
        return { error: error?.message ?? null }
    },

    verifyOtp: async (email: string, token: string) => {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        })
        if (!error) {
            // Seed async — nie blokuje nawigacji
            get().seedIfNeeded().catch(console.warn)
        }
        return { error: error?.message ?? null }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ session: null })
    },

    /**
     * Przy pierwszym logowaniu na danym urządzeniu: czyści lokalną bazę
     * i pobiera pełen snapshot danych z Supabase.
     */
    seedIfNeeded: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const key = `db_seeded_${user.id}`
        const alreadySeeded = await AsyncStorage.getItem(key)
        if (alreadySeeded) return

        await clearAllData()
        await syncService.syncAll()
        await AsyncStorage.setItem(key, 'true')
    },
}))
