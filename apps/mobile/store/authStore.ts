import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'

type AuthStore = {
    session: Session | null
    loading: boolean
    fetchSession: () => Promise<void>
    signInWithEmail: (email: string) => Promise<{ error: string | null }>
    verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
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
        return { error: error?.message ?? null }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ session: null })
    },
}))