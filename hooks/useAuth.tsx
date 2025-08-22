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
  login: (data: Omit<User, 'name'> & { rememberMe?: boolean }) => Promise<'success' | 'pending' | 'invalid' | 'no_team'>;
  completeLogin: (user: User, rememberMe?: boolean) => Promise<void>;
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

  useEffect(() => {
    const init = async () => {
      console.log('🔄 Iniciando autenticação...');
      setIsLoading(true);
      
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.log('❌ Sem token - não autenticado');
          setUser(null);
          setTeam(null);
          setIsLoading(false);
          return;
        }

        // Verificar se token expirou
        if (isTokenExpired(token)) {
          console.log('⏰ Token expirado - limpando');
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          setUser(null);
          setTeam(null);
          setIsLoading(false);
          return;
        }

        console.log('✅ Token válido - carregando usuário...');
        
        // Tentar pegar dados do usuário da API
        try {
          const payload = await verifyJWT(token);
          const userData = await api.get(`/api/users/${payload.userId}`);
          
          console.log('✅ Usuário carregado:', userData.email);
          setUser(userData);
          
          // Carregar equipe se existir
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
            setTeam(teamData);
            console.log('✅ Equipe carregada');
          }
          
        } catch (error) {
          console.error('❌ Erro ao carregar dados:', error);
          // Token inválido - limpar tudo
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          setUser(null);
          setTeam(null);
        }
        
      } catch (error) {
        console.error('❌ Erro geral:', error);
        setUser(null);
        setTeam(null);
      } finally {
        setIsLoading(false);
        console.log('🏁 Autenticação finalizada');
      }
    };
    
    init();
  }, []);

  const [pendingNoTeamUser, setPendingNoTeamUser] = useState<User | null>(null);

  const login = async (
    data: Omit<User, 'name'> & { rememberMe?: boolean }
  ): Promise<'success' | 'pending' | 'invalid' | 'no_team'> => {
    try {
      const { rememberMe, ...loginData } = data;
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginData, rememberMe }),
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
          // Carregar equipe básica se falhou
          if (userToAuth.teamId) {
            setTeam({ 
              id: userToAuth.teamId, 
              name: 'Loading...', 
              code: '', 
              displayCode: '', 
              admin: '', 
              members: [], 
              pending: [], 
              plan: 'FREE',
              credits: {
                contentSuggestions: 20,
                contentReviews: 20,
                contentPlans: 1
              }
            });
          }
        }      router.push('/home');
      return 'success';
    } catch (error) {
      console.error('Login failed', error);
      return 'invalid';
    }
  };

  const completeLogin = async (updatedUser: User, rememberMe: boolean = false) => {
    setUser(updatedUser);
    
    // Criar novo token JWT após completar o login
    try {
      const response = await fetch('/api/auth/complete-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: updatedUser.id, rememberMe }),
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
          // Não fazer nada - dados básicos já foram carregados
        }
      } else {
        console.error('Erro ao gerar token após complete login');
        // Não fazer nada - já temos dados básicos do usuário
      }
    } catch (error) {
      console.error('Erro ao gerar token após complete login:', error);
      // Não fazer nada - já temos dados básicos do usuário
    }

    router.push('/home');
  };

  const logout = (redirect: boolean = true) => {
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
      // Limpar caches relacionados
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_') || key.startsWith('team_')) {
          localStorage.removeItem(key);
        }
      });
      
      if (redirect) {
        router.push('/login');
      }
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
    // Função simplificada - recarregar dados do usuário completo
    if (user?.id) {
      try {
        const userData = await api.get(`/api/users/${user.id}`);
        setUser(userData);
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
            credits: userData.team.credits || {
              contentSuggestions: 20,
              contentReviews: 20,
              contentPlans: 1
            }
          };
          setTeam(teamData);
        }
      } catch (error) {
        console.error('Erro ao recarregar equipe:', error);
      }
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