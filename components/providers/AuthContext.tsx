'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    profile: any | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('cliente')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                // PGRST116 = JSON object requested, multiple (or no) rows returned
                // Ignorar erro se o perfil ainda não existir (race condition do cadastro)
                if (error.code === 'PGRST116') {
                    console.log('Perfil de cliente não encontrado (pode ser um novo cadastro).');
                } else {
                    console.error('Erro ao buscar perfil do cliente:', error);
                }
                setProfile(null);
            } else {
                setProfile(data);
            }
        } catch (error) {
            console.error('Erro inesperado ao buscar perfil:', error);
            setProfile(null);
        }
    }, []);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                
                if (currentUser) {
                    await fetchProfile(currentUser.id);
                }
            } catch (error) {
                console.error("Auth init error:", error);
            } finally {
                setIsLoading(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log("Auth Event:", event);
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                
                if (event === 'SIGNED_IN' && currentUser) {
                    setIsLoading(true); // Re-trigger loading while we fetch new profile
                    await fetchProfile(currentUser.id);
                    setIsLoading(false);
                    router.refresh();
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null);
                    router.push('/');
                    router.refresh();
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        };

        initializeAuth();
    }, [fetchProfile, router]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}
