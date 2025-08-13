// hooks/useAuth.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { Team } from '@/types/team';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  team: Team | null;
  login: (data: Omit<User, 'name'>) => Promise<'success' | 'pending' | 'invalid'>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  isLoading: boolean;
  reloadTeam: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadTeam = async (teamId: string | undefined | null) => {
    if (!teamId) {
      setTeam(null);
      return;
    }
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) {
        const teamData = await res.json();
        setTeam(teamData);
      } else {
        setTeam(null);
        console.error('Failed to load team data');
      }
    } catch (error) {
      console.error('Failed to load team data', error);
      setTeam(null);
    }
  };

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
            await logout();
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

  const logout = async () => {
    setUser(null);
    setTeam(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    router.push('/login');
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (!user?.id) return;
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
      } else {
        throw new Error('Falha ao atualizar usuário');
      }
    } catch (error) {
      console.error('Failed to update user data', error);
    }
  };

  const reloadTeam = async () => {
    if (user?.teamId) {
      await loadTeam(user.teamId);
    }
  };

  const value = {
    isAuthenticated: !!user,
    user,
    team,
    login,
    logout,
    updateUser,
    isLoading,
    reloadTeam,
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