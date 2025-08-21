// hooks/useAuth.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { Team } from '@/types/team';
import { verifyJWT, isTokenExpired } from '@/lib/jwt';
import { api } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  team: Team | null;
  pendingNoTeamUser: User | null;
  login: (data: Omit<User, 'name'>) => Promise<'success' | 'pending' | 'invalid' | 'no_team'>;
  completeLogin: (user: User) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  isLoading: boolean;
  reloadTeam: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      const teamData = await api.get(`/api/teams/${teamId}`);
      console.log('Dados da equipe carregados via loadTeam:', teamData);
      setTeam(teamData);
    } catch (error) {
      console.error('Failed to load team data', error);
      setTeam(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (token) {
          // Verificar se o token é válido e não expirou
          if (isTokenExpired(token)) {
            // Token expirado, fazer logout
            logout();
            return;
          }

          const payload = await verifyJWT(token);
          
          if (payload) {
            // Buscar dados atualizados do usuário
            try {
              const userData = await api.get(`/api/users/${payload.userId}`);
              console.log('Dados do usuário carregados:', userData);
              setUser(userData);
              
              // Se o usuário tem uma equipe, carregar os dados da equipe
              if (userData.team) {
                const teamData = {
                  id: userData.team.id,
                  name: userData.team.name,
                  code: userData.team.displayCode,
                  displayCode: userData.team.displayCode,
                  admin: userData.role === 'ADMIN' ? userData.email : 'N/A',
                  members: userData.team.members?.map((member: any) => member.email) || [],
                  pending: [],
                  plan: userData.team.plan || 'FREE',
                  credits: userData.team.credits || {}
                };
                console.log('Dados da equipe (useAuth):', teamData);
                console.log('Credits from team:', userData.team.credits);
                setTeam(teamData);
              } else {
                console.log('Usuário não possui equipe');
                setTeam(null);
              }
            } catch (error) {
              console.error('Erro ao carregar dados do usuário:', error);
              logout();
            }
          } else {
            logout();
          }
        }
      } catch (error) {
        console.error('Failed to parse auth data from localStorage', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router]);

  const [pendingNoTeamUser, setPendingNoTeamUser] = useState<User | null>(null);

  const login = async (
    data: Omit<User, 'name'>
  ): Promise<'success' | 'pending' | 'invalid' | 'no_team'> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (res.status === 403) return 'pending';
      if (!res.ok) return 'invalid';

      const responseData = await res.json();
      
      // Se retornou status no_team, não fazer login ainda
      if (responseData.status === 'no_team') {
        setPendingNoTeamUser(responseData.user);
        return 'no_team';
      }

      // Login normal para usuários ACTIVE com JWT
      const userToAuth: User = responseData.user;
      const jwtToken = responseData.token;
      
      setUser(userToAuth);

      localStorage.setItem('authToken', jwtToken);
      localStorage.setItem('authUser', JSON.stringify(userToAuth));

      // Carregar dados completos do usuário incluindo equipe
      try {
        const fullUserData = await api.get(`/api/users/${userToAuth.id}`);
        console.log('Dados completos do usuário no login:', fullUserData);
        setUser(fullUserData);
        
        if (fullUserData.team) {
          const teamData = {
            id: fullUserData.team.id,
            name: fullUserData.team.name,
            code: fullUserData.team.displayCode,
            displayCode: fullUserData.team.displayCode,
            admin: fullUserData.role === 'ADMIN' ? fullUserData.email : 'N/A',
            members: fullUserData.team.members?.map((member: any) => member.email) || [],
            pending: [],
            plan: fullUserData.team.plan || 'FREE',
            credits: fullUserData.team.credits || {
              contentSuggestions: 20,
              contentReviews: 20,
              contentPlans: 1
            }
          };
          console.log('Dados da equipe no login:', teamData);
          setTeam(teamData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados completos:', error);
        // Fallback para dados básicos do login
        await loadTeam(userToAuth.teamId);
      }

      router.push('/home');
      return 'success';
    } catch (error) {
      console.error('Login failed', error);
      return 'invalid';
    }
  };

  const completeLogin = async (updatedUser: User) => {
    setUser(updatedUser);
    
    // Criar novo token JWT após completar o login
    try {
      const response = await fetch('/api/auth/complete-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: updatedUser.id }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        setUser(data.user);
        
        // Carregar dados completos do usuário incluindo equipe
        try {
          const fullUserData = await api.get(`/api/users/${data.user.id}`);
          console.log('Dados completos no completeLogin:', fullUserData);
          setUser(fullUserData);
          
          if (fullUserData.team) {
            const teamData = {
              id: fullUserData.team.id,
              name: fullUserData.team.name,
              code: fullUserData.team.displayCode,
              displayCode: fullUserData.team.displayCode,
              admin: fullUserData.role === 'ADMIN' ? fullUserData.email : 'N/A',
              members: fullUserData.team.members?.map((member: any) => member.email) || [],
              pending: [],
              plan: fullUserData.team.plan || 'FREE',
              credits: fullUserData.team.credits || {
                contentSuggestions: 20,
                contentReviews: 20,
                contentPlans: 1
              }
            };
            console.log('Dados da equipe no completeLogin:', teamData);
            setTeam(teamData);
          }
        } catch (error) {
          console.error('Erro ao carregar dados completos no completeLogin:', error);
          await loadTeam(data.user.teamId);
        }
      } else {
        console.error('Erro ao gerar token após complete login');
        await loadTeam(updatedUser.teamId);
      }
    } catch (error) {
      console.error('Erro ao gerar token após complete login:', error);
      await loadTeam(updatedUser.teamId);
    }

    router.push('/home');
  };

  const logout = () => {
    try {
      // Chamar API de logout se necessário
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(error => console.error('Erro no logout:', error));
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
      setTeam(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      router.push('/login');
    }
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (!user?.id) return;
    try {
      const newUser = await api.patch(`/api/users/${user.id}`, updatedData);
      setUser(newUser);
      localStorage.setItem('authUser', JSON.stringify(newUser));
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
    pendingNoTeamUser,
    login,
    completeLogin,
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