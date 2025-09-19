// hooks/useAuth.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { Team } from '@/types/team';
import { isTokenExpired, getTokenPayload } from '@/lib/jwt';
import { api } from '@/lib/api';
import { buildPlanSnapshot, getDefaultCredits, getPlanDefinition, PlanKey, resolvePlanKey } from '@/lib/plans';

const trialPlanDefinition = getPlanDefinition('TRIAL');
const fallbackPlanSnapshot = buildPlanSnapshot(trialPlanDefinition);
const fallbackCredits = getDefaultCredits(trialPlanDefinition);

const normalizePlanSnapshot = (planKey: PlanKey, plan: any) => {
  const baseDefinition = getPlanDefinition(planKey);
  const baseSnapshot = buildPlanSnapshot(baseDefinition);
  if (!plan || typeof plan !== 'object') return baseSnapshot;

  return {
    ...baseSnapshot,
    ...plan,
    key: plan.key ?? baseSnapshot.key,
    price: plan.price ?? baseSnapshot.price,
    description: plan.description ?? baseSnapshot.description,
    isTrial: plan.isTrial ?? baseSnapshot.isTrial,
    trialDays: plan.trialDays ?? baseSnapshot.trialDays,
    limits: {
      ...baseSnapshot.limits,
      ...(plan.limits || {}),
      calendars: plan.limits?.calendars ?? plan.limits?.contentPlans ?? baseSnapshot.limits.calendars,
      contentPlans: plan.limits?.contentPlans ?? plan.limits?.calendars ?? baseSnapshot.limits.contentPlans,
      contentSuggestions: plan.limits?.contentSuggestions ?? baseSnapshot.limits.contentSuggestions,
      contentReviews: plan.limits?.contentReviews ?? baseSnapshot.limits.contentReviews,
      customCreations: plan.limits?.customCreations ?? baseSnapshot.limits.customCreations,
      members: plan.limits?.members ?? baseSnapshot.limits.members,
      brands: plan.limits?.brands ?? baseSnapshot.limits.brands,
      themes: plan.limits?.themes ?? baseSnapshot.limits.themes,
      personas: plan.limits?.personas ?? baseSnapshot.limits.personas,
    },
  };
};

const normalizeCredits = (planKey: PlanKey, credits: any) => {
  const definition = getPlanDefinition(planKey);
  const defaults = getDefaultCredits(definition);
  return {
    contentSuggestions: typeof credits?.contentSuggestions === 'number' ? credits.contentSuggestions : defaults.contentSuggestions,
    customCreations: typeof credits?.customCreations === 'number' ? credits.customCreations : defaults.customCreations,
    contentPlans: typeof credits?.contentPlans === 'number'
      ? credits.contentPlans
      : typeof credits?.calendars === 'number'
        ? credits.calendars
        : defaults.contentPlans,
    contentReviews: typeof credits?.contentReviews === 'number' ? credits.contentReviews : defaults.contentReviews,
  };
};

const extractEmails = (items: any[], accessor?: (item: any) => string | null | undefined) => {
  if (!Array.isArray(items)) return [] as string[];
  return items
    .map(item => {
      if (accessor) return accessor(item) ?? null;
      if (typeof item === 'string') return item;
      if (item && typeof item.email === 'string') return item.email;
      if (item && item.user && typeof item.user.email === 'string') return item.user.email;
      return null;
    })
    .filter((email): email is string => Boolean(email));
};

const transformTeamResponse = (teamSource: any, userEmail: string, userRole?: string): Team => {
  if (!teamSource) {
    return {
      id: '',
      name: '',
      code: '',
      admin: userRole === 'ADMIN' ? userEmail : '',
      members: [],
      pending: [],
      plan: fallbackPlanSnapshot,
      planKey: 'TRIAL',
      subscriptionStatus: 'TRIAL',
      trialEndsAt: null,
      credits: fallbackCredits,
    };
  }

  const planKey = resolvePlanKey(teamSource.planKey, teamSource.plan?.name);
  const planSnapshot = normalizePlanSnapshot(planKey, teamSource.plan);
  const credits = normalizeCredits(planKey, teamSource.credits);

  const members = extractEmails(teamSource.members ?? []);
  const pendingJoinRequests = extractEmails(teamSource.joinRequests ?? []);
  const pendingDirect = extractEmails(teamSource.pending ?? []);
  const pending = Array.from(new Set([...pendingDirect, ...pendingJoinRequests]));

  return {
    id: teamSource.id,
    name: teamSource.name,
    code: teamSource.displayCode ?? teamSource.code ?? '',
    displayCode: teamSource.displayCode ?? teamSource.code ?? '',
    admin: teamSource.admin?.email ?? (userRole === 'ADMIN' ? userEmail : (teamSource.admin || 'N/A')),
    members,
    pending,
    plan: planSnapshot,
    planKey,
    subscriptionStatus: teamSource.subscriptionStatus ?? (planKey === 'TRIAL' ? 'TRIAL' : 'ACTIVE'),
    trialEndsAt: teamSource.trialEndsAt ?? null,
    credits,
  };
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  team: Team | null;
  pendingNoTeamUser: User | null;
  login: (data: Omit<User, 'name'> & { rememberMe?: boolean }) => Promise<'success' | 'pending' | 'invalid' | 'no_team' | 'trial_expired'>;
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
  const [loginRememberMe, setLoginRememberMe] = useState(false);
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

        // Extrair payload sem verificar assinatura
        try {
          const payload = getTokenPayload(token);
          if (!payload?.userId) {
            throw new Error('Token payload inválido');
          }
          const userData = await api.get(`/api/users/${payload.userId}`);
          
          console.log('✅ Usuário carregado:', userData.email);
          setUser(userData);
          
          // Carregar equipe se existir
          if (userData.team) {
            setTeam(transformTeamResponse(userData.team, userData.email, userData.role));
            console.log('✅ Equipe carregada');
          } else {
            setTeam(null);
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
  ): Promise<'success' | 'pending' | 'invalid' | 'no_team' | 'trial_expired'> => {
    try {
      const { rememberMe, ...loginData } = data;
      setLoginRememberMe(rememberMe ?? false);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginData, rememberMe }),
      });

      const responseData = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 403 && responseData?.status === 'pending') return 'pending';
        if (res.status === 402 && responseData?.status === 'trial_expired') return 'trial_expired';
        return 'invalid';
      }

      if (!responseData) {
        return 'invalid';
      }

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
          const normalizedTeam = transformTeamResponse(fullUserData.team, fullUserData.email, fullUserData.role);
          console.log('Dados da equipe no login:', normalizedTeam);
          setTeam(normalizedTeam);
        } else {
          setTeam(null);
        }
      } catch (error) {
        console.error('Erro ao carregar dados completos:', error);
        // Carregar equipe básica se falhou
        if (userToAuth.teamId) {
          setTeam(transformTeamResponse({
            id: userToAuth.teamId,
            name: 'Carregando...',
            displayCode: '',
            code: '',
            admin: { email: userToAuth.email },
            members: [],
            pending: [],
            planKey: 'TRIAL',
            plan: null,
            credits: {},
          }, userToAuth.email || '', userToAuth.role));
        }
      }

      router.push('/home');
      return 'success';
    } catch (error) {
      console.error('Login failed', error);
      return 'invalid';
    }
  };

  const completeLogin = async (updatedUser: User, rememberMe: boolean = loginRememberMe) => {
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
            const normalizedTeam = transformTeamResponse(fullUserData.team, fullUserData.email, fullUserData.role);
            console.log('Dados da equipe no completeLogin:', normalizedTeam);
            setTeam(normalizedTeam);
          } else {
            setTeam(null);
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
      const token = localStorage.getItem('authToken');
      if (token) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        }).catch(error => console.error('Erro no logout:', error));
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
      setTeam(null);
      setLoginRememberMe(false);
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
          setTeam(transformTeamResponse(userData.team, userData.email, userData.role));
        } else {
          setTeam(null);
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