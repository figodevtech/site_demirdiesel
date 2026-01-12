'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    login: (email: string, name: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Simular verificação de sessão ao carregar
        const savedUser = localStorage.getItem('demirdiesel-auth');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Erro ao restaurar sessão:", e);
            }
        }
        setIsLoading(false);
    }, []);

    const login = (email: string, name: string) => {
        const newUser = {
            id: 'user-' + Date.now(),
            email,
            name
        };
        setUser(newUser);
        localStorage.setItem('demirdiesel-auth', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('demirdiesel-auth');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, isLoading }}>
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
