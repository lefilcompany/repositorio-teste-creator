// components/trial-expired-modal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Crown, CheckCircle, Users, Building2, Target, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// --- CONTROLES ROBUSTOS DE SESSÃO ---
// Variáveis no escopo do módulo para persistir entre re-renderizações e re-montagens do componente.
// Isso previne race conditions de forma muito mais eficaz que o useRef.
let isCheckInProgress = false;
let hasModalBeenShownThisSession = false;


interface SubscriptionStatus {
  canAccess: boolean;
  isExpired: boolean;
  isTrial: boolean;
  daysRemaining?: number;
  plan?: any;
  teamId?: string;
  teamName?: string;
}

interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  trialDays: number;
  maxMembers: number;
  maxBrands: number;
  maxStrategicThemes: number;
  maxPersonas: number;
  quickContentCreations: number;
  customContentSuggestions: number;
  contentPlans: number;
  contentReviews: number;
  isActive: boolean;
}

export default function TrialExpiredModal() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Função para resetar as travas da sessão.
  // Chamada ao detectar um novo usuário ou no logout.
  const resetSessionLocks = () => {
    console.log('Controles de sessão resetados.');
    isCheckInProgress = false;
    hasModalBeenShownThisSession = false;
  };

  const getModalStateKey = useCallback(() => user ? `trial_modal_dismissed_${user.id}` : null, [user]);

  const isModalDismissed = useCallback(() => {
    const key = getModalStateKey();
    if (!key) return false;
    return localStorage.getItem(key) === 'true';
  }, [getModalStateKey]);

  const dismissModal = useCallback(() => {
    const key = getModalStateKey();
    if (key) {
      localStorage.setItem(key, 'true');
      document.cookie = `trial_modal_dismissed=true; path=/; max-age=${30 * 24 * 60 * 60}`;
    }
  }, [getModalStateKey]);

  const clearDismissalState = useCallback(() => {
    const key = getModalStateKey();
    if (key) {
      localStorage.removeItem(key);
      document.cookie = 'trial_modal_dismissed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    resetSessionLocks();
  }, [getModalStateKey]);

  const loadPlans = useCallback(async () => {
    if (plans.length > 0) return;
    try {
      console.log('Carregando planos...');
      const response = await fetch('/api/plans');
      if (response.ok) {
        const data = await response.json();
        const paidPlans = data.filter((plan: Plan) => plan.name !== 'FREE');
        const planOrder = ['BASIC', 'PRO', 'ENTERPRISE'];
        const sortedPlans = paidPlans.sort((a: Plan, b: Plan) => {
          const aIndex = planOrder.indexOf(a.name);
          const bIndex = planOrder.indexOf(b.name);
          return aIndex - bIndex;
        });
        setPlans(sortedPlans);
        console.log('Planos carregados com sucesso.');
      } else {
        console.error('Erro ao carregar planos:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  }, [plans.length]);

  const checkSubscriptionStatus = useCallback(async () => {
    // Guarda principal usando as travas do módulo.
    if (!user || !isAuthenticated || isCheckInProgress || hasModalBeenShownThisSession) {
      return;
    }

    console.log('Iniciando verificação de status da assinatura...');
    isCheckInProgress = true;
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('Token de autenticação não encontrado.');
        return;
      }

      const response = await fetch('/api/teams/subscription-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);

        const shouldShowModal = data.isTrial && data.isExpired && !data.canAccess;
        const wasDismissed = isModalDismissed();

        if (shouldShowModal && !wasDismissed) {
          console.log('Condições atendidas para exibir o modal.');
          hasModalBeenShownThisSession = true; // Ativa a trava de exibição da sessão.
          setIsOpen(true);
          loadPlans();
        } else if (shouldShowModal && wasDismissed) {
          console.log('Trial expirado e modal ignorado anteriormente. Redirecionando...');
          router.push('/planos?expired=true');
        }
      } else {
        console.error('Falha na API de verificação de status:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error);
    } finally {
      isCheckInProgress = false;
      setIsLoading(false);
    }
  }, [user, isAuthenticated, router, isModalDismissed, loadPlans]);

  // Efeito para iniciar as verificações.
  useEffect(() => {
    if (!user || !isAuthenticated) return;

    // Atraso mínimo para garantir que o ambiente de autenticação esteja estável.
    const initialCheckTimeout = setTimeout(() => {
        checkSubscriptionStatus();
    }, 500);

    const interval = setInterval(checkSubscriptionStatus, 180000); // 3 minutos

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(interval);
    };
  }, [user, isAuthenticated, checkSubscriptionStatus]);

  // Efeito para resetar as travas ao mudar de usuário.
  useEffect(() => {
    if (user?.id) {
      const previousUserId = localStorage.getItem('lastUserId');
      if (previousUserId && previousUserId !== user.id) {
        console.log('Novo usuário detectado, resetando estado do modal.');
        clearDismissalState();
      }
      localStorage.setItem('lastUserId', user.id);
    }
  }, [user?.id, clearDismissalState]);

  const handleDecideLater = () => {
    console.log('Usuário escolheu decidir depois. Fazendo logout.');
    dismissModal();
    setIsOpen(false);
    resetSessionLocks(); // Reseta as travas no logout.
    logout();
  };

  const handleViewPlans = () => {
    dismissModal();
    setIsOpen(false);
    router.push('/planos?expired=true');
  };
  
  const handleSubscribe = (planName: string) => {
    toast.info(`Você selecionou o plano ${planName}.`);
    setIsOpen(false);
    router.push(`/planos?expired=true&selected=${planName}`);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
                <div className="rounded-full p-4">
                    <img 
                        src="/assets/logoCreatorPreta.png" 
                        alt="Creator Logo" 
                        className="w-80 h-full object-contain"
                    />
                    <AlertTriangle className="h-8 w-8 text-white hidden" />
                </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-gray-900">
                Escolha o plano ideal para sua equipe
            </DialogTitle>
            <DialogDescription className="text-center text-lg text-gray-600 mt-2">
                <div className="text-center mb-6">
                    <p className="text-gray-600">
                        Milhares de criadores confiam no Creator para transformar suas ideias em realidade.
                        <span className="block mt-1 text-blue-600 font-medium">
                            Continue criando conteúdo incrível sem limitações!
                        </span>
                    </p>
                </div>
            </DialogDescription>
        </DialogHeader>

        <div>
            <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
                <Card key={plan.id} className={`relative border-2 hover:border-blue-300 transition-colors ${
                    plan.name === 'PRO' ? 'ring-2 ring-purple-200' : ''
                } ${
                    plan.name === 'ENTERPRISE' ? 'ring-2 ring-blue-200' : ''
                }`}>
                    {plan.name === 'PRO' && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-md">
                                <Crown className="h-4 w-4" />
                                Mais Popular
                            </div>
                        </div>
                    )}
                    {plan.name === 'ENTERPRISE' && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-md">
                                <Crown className="h-4 w-4" />
                                Premium
                            </div>
                        </div>
                    )}
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-lg font-bold text-gray-900">{plan.displayName}</CardTitle>
                        <div className="text-2xl font-bold text-blue-600">
                            {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2).replace('.', ',')}`}
                            {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mês</span>}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2 mb-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-green-500" />
                                <span>{plan.maxMembers >= 999999 ? 'Membros ilimitados' : `Até ${plan.maxMembers} membros`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-green-500" />
                                <span>{plan.maxBrands >= 999999 ? 'Marcas ilimitadas' : `Até ${plan.maxBrands} marcas`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2"><Target className="h-4 w-4 text-green-500" />
                                <span>
                                    {plan.maxPersonas >= 999999 ? 'Personas ilimitadas' : `Até ${plan.maxPersonas} personas`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-green-500" />
                                <span>
                                    {plan.name === 'ENTERPRISE' ? `${plan.quickContentCreations}+ criações rápidas/mês` : `${plan.quickContentCreations} criações rápidas/mês`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />
                                <span>
                                    {plan.name === 'ENTERPRISE' ? `${plan.customContentSuggestions}+ conteúdos personalizados` : `${plan.customContentSuggestions} conteúdos personalizados`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />
                                <span>
                                    {plan.name === 'ENTERPRISE' ? `${plan.contentPlans}+ planejamentos/mês` : `${plan.contentPlans} planejamentos/mês`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />
                                <span>
                                    {plan.name === 'ENTERPRISE' ? `${plan.contentReviews}+ revisões/mês` : `${plan.contentReviews} revisões/mês`}
                                </span>
                            </div>
                            {plan.name === 'ENTERPRISE' && (<div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="font-medium text-blue-600">Integrações avançadas</span>
                            </div>
                            )}
                        </div>
                        <Button 
                            className={`w-full mt-4 h-12 text-base font-semibold transition-all duration-300 ${
                                plan.name === 'PRO' 
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-1' 
                                : plan.name === 'ENTERPRISE'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-1'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 hover:border-slate-400'
                            }`}
                            onClick={() => handleSubscribe(plan.name)}
                        >
                            <Crown className="h-4 w-4 mr-2" />
                            {plan.name === 'PRO' && "Assinar PRO"}
                            {plan.name === 'ENTERPRISE' && "Assinar Enterprise"}
                            {plan.name === 'BASIC' && "Assinar Básico"}
                        </Button>
                    </CardContent>
                </Card>
            ))}
            </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={handleViewPlans}
            className="flex-1 border-2 border-secondary text-secondary hover:bg-secondary hover:text-white transition-all duration-300"
          >
            Ver comparação completa
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleDecideLater}
            className="flex-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-all duration-300"
          >
            Talvez mais tarde
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}