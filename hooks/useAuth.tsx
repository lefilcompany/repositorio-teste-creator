// hooks/useAuth.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (data: Omit<User, 'name'>) => Promise<'success' | 'pending' | 'invalid'>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Gera um token aleatório com no mínimo 32 caracteres
const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadTeam = async (teamId: string | undefined | null) => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) {
        const team = await res.json();
        localStorage.setItem('creator-teams', JSON.stringify([team]));
      }
    } catch (error) {
      console.error('Failed to load team data', error);
    }
  };

  // useEffect para carregar dados (sem alterações)
  useEffect(() => {
      const init = async () => {
        try {
          const token = localStorage.getItem('authToken');
          if (token && token.length >= 32) {
            const storedUser = localStorage.getItem('authUser');
            if (storedUser) {
              const parsedUser: User = JSON.parse(storedUser);
              setUser(parsedUser);
              await loadTeam(parsedUser.teamId);
            } else {
              logout();
            }
          }
        } catch (error) {
          console.error('Failed to parse auth data from localStorage', error);
        } finally {
          setIsLoading(false);
        }
      };
      init();
    }, []);

  const login = async (
    data: Omit<User, 'name'>
  ): Promise<'success' | 'pending' | 'invalid'> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.status === 403) return 'pending';
      if (!res.ok) return 'invalid';
      const userToAuth: User = await res.json();
      setUser(userToAuth);
      const token = generateToken();
      localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(userToAuth));
        await loadTeam(userToAuth.teamId);
        router.push('/home');
        return 'success';
      } catch (error) {
        console.error('Login failed', error);
        return 'invalid';
      }
    };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('creator-teams');
    router.push('/login');
  };

  // <-- INÍCIO DA NOVA FUNÇÃO -->
  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        const newUser: User = await res.json();
        setUser(newUser);
        localStorage.setItem('authUser', JSON.stringify(newUser));
      }
    } catch (error) {
      console.error('Failed to update user data', error);
    }
  };
  // <-- FIM DA NOVA FUNÇÃO -->
  
  const value = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    updateUser, // <-- EXPORTAR A FUNÇÃO
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};