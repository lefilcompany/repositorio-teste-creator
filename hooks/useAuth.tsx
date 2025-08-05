// hooks/useAuth.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (data: Omit<User, 'name'>) => 'success' | 'pending' | 'invalid';
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void; // <-- NOVA FUNÇÃO
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_TOKEN = 'fake-jwt-token-for-local-storage-demo';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // useEffect para carregar dados (sem alterações)
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (token === FAKE_TOKEN) {
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (data: Omit<User, 'name'>): 'success' | 'pending' | 'invalid' => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('creator-users') || '[]') as User[];
      const foundUser = storedUsers.find(
        (u) => u.email === data.email && u.password === data.password
      );

      if (foundUser) {
        if (foundUser.status === 'pending') {
          return 'pending';
        }
        const userToAuth = { ...foundUser };
        delete userToAuth.password; // Não guardamos a senha no authUser

        setUser(userToAuth);
        localStorage.setItem('authToken', FAKE_TOKEN);
        localStorage.setItem('authUser', JSON.stringify(userToAuth));
        router.push('/home');
        return 'success';
      }
      return 'invalid';
    } catch (error) {
      console.error("Login failed", error);
      return 'invalid';
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    router.push('/login');
  };

  // <-- INÍCIO DA NOVA FUNÇÃO -->
  const updateUser = (updatedData: Partial<User>) => {
    if (!user) return;
    try {
        // Atualiza o estado local
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        
        // Atualiza o usuário no localStorage de autenticação
        localStorage.setItem('authUser', JSON.stringify(newUser));

        // Atualiza a lista geral de usuários
        const storedUsers = JSON.parse(localStorage.getItem('creator-users') || '[]') as User[];
        const userIndex = storedUsers.findIndex(u => u.email === user.email);
        
        if (userIndex > -1) {
            const fullUser = storedUsers[userIndex];
            // Mantém a senha original e atualiza o resto
            storedUsers[userIndex] = { ...fullUser, ...updatedData };
            localStorage.setItem('creator-users', JSON.stringify(storedUsers));
        }
    } catch (error) {
        console.error("Failed to update user data", error);
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