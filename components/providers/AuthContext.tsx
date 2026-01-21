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
    const lastUserId = React.useRef<string | null>(null);
    const lastProfile = React.useRef<any | null>(null);
    const router = useRouter();

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('cliente')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                // PGRST116 = solicitado objeto JSON, veio múltipla (ou nenhuma) linha
                // Ignora erro se o perfil ainda não existir (race condition do cadastro)
                if (error.code === 'PGRST116') {
                    console.log('Perfil de cliente não encontrado (pode ser um novo cadastro).');
                } else {
                    console.error('Erro ao buscar perfil do cliente:', error);
                }
                setProfile(null);
                lastProfile.current = null;
            } else {
                setProfile(data);
                lastProfile.current = data;
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
        let mounted = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth Event:", event);
            if (!mounted) return;

            const currentUser = session?.user ?? null;

            if (event === 'SIGNED_OUT') {
                lastUserId.current = null;
                lastProfile.current = null;
                setUser(null);
                setProfile(null);
                setIsLoading(false);
                router.push('/');
                router.refresh();
                return;
            }

            if (currentUser) {
                const isNewUser = currentUser.id !== lastUserId.current;
                
                if (isNewUser) {
                    console.log("DEBUG: Actual New User. Fetching...");
                    lastUserId.current = currentUser.id;
                    setUser(currentUser);
                    setIsLoading(true);
                    await fetchProfile(currentUser.id);
                    if (mounted) setIsLoading(false);
                } else {
                    // Mesmo user ID, apenas atualiza a referência sem disparar loading global
                    setUser(currentUser);
                    if (!lastProfile.current) {
                        await fetchProfile(currentUser.id);
                    }
                }
            } else {
                if (mounted) setIsLoading(false);
            }
        });

        // Trata carregamento inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted && session?.user && !lastUserId.current) {
                const u = session.user;
                lastUserId.current = u.id;
                setUser(u);
                fetchProfile(u.id).finally(() => {
                    if (mounted) setIsLoading(false);
                });
            } else if (mounted && !session?.user) {
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
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
