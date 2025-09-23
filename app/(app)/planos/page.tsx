'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Team } from '@/types/team';
import { toast } from 'sonner';
import { ArrowLeft, Zap, CheckCircle, Calendar, Tag, Users, Palette, UserCheck, Building2, Target, Crown, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface SubscriptionStatus {
  canAccess: boolean;
  isExpired: boolean;
  isTrial: boolean;
  daysRemaining?: number;
  plan?: Plan;
}

export default function PlanosPage() {
  const { user, logout } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamData, setTeamData] = useState<any>(null); // Dados da API com créditos calculados
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showPlansSelection, setShowPlansSelection] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';
  const selectedPlan = searchParams.get('selected');
  const team = teams.find(t => t.id === user?.teamId) || null;

  // Carrega dados da equipe via API
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Carregar teams
        const teamsRes = await fetch(`/api/teams?userId=${user.id}`);
        if (teamsRes.ok) {
          const teamsData: Team[] = await teamsRes.json();
          setTeams(teamsData);
          
          // Se há um team do usuário, buscar dados completos da subscription
          const userTeam = teamsData.find(t => t.id === user.teamId);
          if (userTeam) {
            const teamDataRes = await fetch(`/api/teams/${userTeam.id}?summary=true`);
            if (teamDataRes.ok) {
              const teamDataResponse = await teamDataRes.json();
              setTeamData(teamDataResponse);
            }
          }
        }

        // Carregar planos disponíveis
        const plansResponse = await fetch('/api/plans');
        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          // Ordenar planos: FREE, BASIC, PRO, ENTERPRISE
          const planOrder = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
          const sortedPlans = plansData.sort((a: Plan, b: Plan) => {
            const aIndex = planOrder.indexOf(a.name);
            const bIndex = planOrder.indexOf(b.name);
            return aIndex - bIndex;
          });
          setPlans(sortedPlans);
        }

        // Carregar status da assinatura atual
        const statusResponse = await fetch('/api/teams/subscription-status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setSubscriptionStatus(statusData);
        }

        // Se expirou, mostrar seleção de planos automaticamente
        if (isExpired) {
          setShowPlansSelection(true);
        }

      } catch (error) {
        toast.error('Erro de conexão ao carregar informações');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isExpired]);

  const handleSubscribe = async (planName: string) => {
    if (!user || !team) {
      router.push('/login');
      return;
    }

    // Por enquanto, apenas mostrar toast informativo
    // A integração com API de pagamento será implementada posteriormente
    toast.info(`Plano ${planName} selecionado. Sistema de pagamento será implementado em breve.`, {
      description: "Em breve você poderá assinar planos diretamente pelo sistema."
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se a assinatura expirou ou não tem acesso, mostrar seleção de planos
  if (subscriptionStatus?.isExpired || showPlansSelection || !subscriptionStatus?.canAccess) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Escolha seu Plano</h1>
          <p className="text-gray-600 mb-6">
            Selecione o plano que melhor atende às necessidades da sua equipe
          </p>

          {isExpired && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertDescription className="text-orange-800">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Seu período de teste expirou. Escolha um plano para continuar usando o Creator.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {subscriptionStatus?.isTrial && !subscriptionStatus?.isExpired && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Você está no período de teste gratuito.
                {subscriptionStatus.daysRemaining !== undefined && (
                  <> Restam {subscriptionStatus.daysRemaining} dias.</>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.name === 'PRO' ? 'border-blue-500 shadow-lg scale-105' : ''
                } ${plan.name === 'ENTERPRISE' ? 'border-indigo-500 shadow-lg' : ''
                } ${subscriptionStatus?.plan?.id === plan.id ? 'border-green-500 bg-green-50' : ''
                } ${selectedPlan === plan.name ? 'border-orange-500 bg-orange-50 shadow-xl ring-2 ring-orange-200' : ''
                }`}
            >
              {plan.name === 'PRO' && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Mais Popular
                </Badge>
              )}

              {plan.name === 'ENTERPRISE' && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-indigo-500">
                  Premium
                </Badge>
              )}

              {subscriptionStatus?.plan?.id === plan.id && (
                <Badge className="absolute -top-2 right-4 bg-green-500">
                  Plano Atual
                </Badge>
              )}

              {selectedPlan === plan.name && (
                <Badge className="absolute -top-2 left-4 bg-orange-500">
                  Selecionado
                </Badge>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                </div>
                {plan.price > 0 && <div className="text-sm text-gray-500">mensal</div>}
                {plan.trialDays > 0 && (
                  <Badge variant="outline" className="mx-auto">
                    {plan.trialDays} dias grátis
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.maxMembers >= 999999 ? 'Membros ilimitados' : `${plan.maxMembers} Membros`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.maxBrands >= 999999 ? 'Marcas ilimitadas' : `${plan.maxBrands} ${plan.maxBrands === 1 ? 'Marca' : 'Marcas'}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.maxStrategicThemes >= 999999 ? 'Temas ilimitados' : `${plan.maxStrategicThemes} Temas Estratégicos`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.maxPersonas >= 999999 ? 'Personas ilimitadas' : `${plan.maxPersonas} Personas`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.name === 'ENTERPRISE' ? `${plan.quickContentCreations}+ Criações Rápidas` : `${plan.quickContentCreations} Criações Rápidas`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.name === 'ENTERPRISE' ? `${plan.customContentSuggestions}+ Conteúdos Personalizados` : `${plan.customContentSuggestions} Conteúdos Personalizados`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.name === 'ENTERPRISE' ? `${plan.contentPlans}+ Planejamentos` : `${plan.contentPlans} Planejamentos`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.name === 'ENTERPRISE' ? `${plan.contentReviews}+ Revisões` : `${plan.contentReviews} Revisões`}
                    </span>
                  </div>
                  {plan.name === 'ENTERPRISE' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-indigo-600">Integrações avançadas</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  variant={plan.name === 'PRO' ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={subscriptionStatus?.plan?.id === plan.id}
                >
                  {subscriptionStatus?.plan?.id === plan.id ? (
                    'Plano Atual'
                  ) : plan.name === 'FREE' ? (
                    'Continuar Grátis'
                  ) : (
                    'Assinar Agora'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Todos os planos incluem suporte técnico e atualizações gratuitas.
          </p>
          {!isExpired && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowPlansSelection(false)}
            >
              Voltar ao Painel
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!team || !team.plan) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg">Erro ao carregar informações do plano</p>
          <p className="text-sm text-muted-foreground">
            {!team ? 'Team não encontrado' : 'Plano não encontrado'}
          </p>
          <Link href="/home">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { plan } = team;
  // Usar dados da API em vez de team.credits
  const credits = teamData?.credits || {};

  // Cálculo dos créditos - usar dados da API de subscription
  const creditData = [
    {
      name: 'Criações Rápidas',
      current: credits?.quickContentCreations || 0,
      limit: teamData?.plan?.quickContentCreations || plan?.quickContentCreations || 5, // Usar dados do plano da API
      icon: <Zap className="h-4 w-4" />,
      color: 'text-orange-600'
    },
    {
      name: 'Sugestões de Conteúdo',
      current: credits?.contentSuggestions || 0,
      limit: teamData?.plan?.customContentSuggestions || plan?.customContentSuggestions || 15, // Usar dados do plano da API
      icon: <Zap className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      name: 'Revisões de Conteúdo',
      current: credits?.contentReviews || 0,
      limit: teamData?.plan?.contentReviews || plan?.contentReviews || 10, // Usar dados do plano da API
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      name: 'Calendários',
      current: credits?.contentPlans || 0,
      limit: teamData?.plan?.contentPlans || plan?.contentPlans || 5, // Usar dados do plano da API
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-purple-600'
    }
  ];

  const totalCredits = creditData.reduce((acc, credit) => acc + credit.current, 0);
  const totalLimits = creditData.reduce((acc, credit) => acc + credit.limit, 0);

  return (
    <div className="min-h-full flex flex-col gap-4">
      {/* Alertas de assinatura */}
      {subscriptionStatus?.isTrial && !subscriptionStatus?.isExpired && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Você está no período de teste gratuito.
            {subscriptionStatus.daysRemaining !== undefined && (
              <> Restam {subscriptionStatus.daysRemaining} dias.</>
            )}
            {' '}
            <Button
              variant="link"
              className="p-0 h-auto text-blue-800 underline"
              onClick={() => setShowPlansSelection(true)}
            >
              Ver planos disponíveis
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {subscriptionStatus?.isTrial && subscriptionStatus?.isExpired && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Seu período de teste expirou.
            <Button
              variant="link"
              className="p-0 h-auto text-orange-800 underline ml-1"
              onClick={() => setShowPlansSelection(true)}
            >
              Escolha um plano para continuar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header seguindo o padrão do sistema */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Crown className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-foreground">
                  Planos e Uso
                </CardTitle>
                <p className="text-muted-foreground text-base">
                  Gerencie seu plano e acompanhe o uso de recursos
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid principal */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 flex-1">
        {/* Seção principal - 3 colunas */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card de resumo do plano */}
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                      {plan.name}
                    </span>
                    Plano Atual
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Você está usando o plano {plan.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{totalCredits}</p>
                  <p className="text-sm text-muted-foreground">
                    de {totalLimits} créditos disponíveis
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Cards de créditos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creditData.map((credit, index) => {
              // Créditos disponíveis = current, Créditos usados = limit - current
              const usedCredits = Math.max(0, credit.limit - credit.current);
              const percentage = credit.limit > 0 ? (usedCredits / credit.limit) * 100 : 0;
              const isLow = credit.current <= (credit.limit * 0.2); // Créditos baixos quando restam 20% ou menos
              const isAtLimit = credit.current <= 0; // Limite atingido quando não há créditos disponíveis

              return (
                <Card key={index} className={`${isAtLimit ? 'border-destructive/50' : isLow ? 'border-yellow-500/50' : 'border-green-500/50'}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className={credit.color}>{credit.icon}</span>
                      {credit.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-foreground">{credit.current}</span>
                        <span className="text-sm text-muted-foreground">
                          de {credit.limit} disponíveis
                        </span>
                      </div>
                      {/* Barra mostra créditos disponíveis */}
                      <Progress value={(credit.current / credit.limit) * 100} className="h-2" />
                      {isAtLimit && (
                        <p className="text-xs text-destructive">
                          Créditos esgotados
                        </p>
                      )}
                      {isLow && !isAtLimit && (
                        <p className="text-xs text-yellow-600">
                          Poucos créditos restantes
                        </p>
                      )}
                      {!isLow && !isAtLimit && (
                        <p className="text-xs text-green-600">
                          Créditos disponíveis
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Limites de recursos */}
          <Card>
            <CardHeader>
              <CardTitle>Limites de Recursos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Recursos disponíveis no seu plano atual
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Marcas</p>
                    <p className="text-xs text-muted-foreground">
                      até {teamData?.plan?.maxBrands || plan?.maxBrands || 1}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Palette className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Temas</p>
                    <p className="text-xs text-muted-foreground">
                      até {teamData?.plan?.maxStrategicThemes || plan?.maxStrategicThemes || 3}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Personas</p>
                    <p className="text-xs text-muted-foreground">
                      até {teamData?.plan?.maxPersonas || plan?.maxPersonas || 2}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/5">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <UserCheck className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Membros</p>
                    <p className="text-xs text-muted-foreground">
                      até {teamData?.plan?.maxMembers || plan?.maxMembers || 5}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ações rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/marcas">
                <Button variant="outline" className="w-full justify-start mb-2 hover:bg-secondary">
                  <Tag className="h-4 w-4 mr-2" />
                  Gerenciar Marcas
                </Button>
              </Link>
              <Link href="/temas">
                <Button variant="outline" className="w-full justify-start mb-2 hover:bg-secondary">
                  <Palette className="h-4 w-4 mr-2" />
                  Gerenciar Temas
                </Button>
              </Link>
              <Link href="/personas">
                <Button variant="outline" className="w-full justify-start hover:bg-secondary">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Personas
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-secondary"
                onClick={() => setShowPlansSelection(true)}
              >
                <Crown className="h-4 w-4 mr-2" />
                Gerenciar Planos
              </Button>
            </CardContent>
          </Card>

          {/* Card do plano assinado */}
          {(() => {
            const planos = [
              {
                key: 'free',
                name: 'Plano Free',
                price: 'R$0',
                cor: 'border-gray-300',
                info: [
                  { label: 'Todas as funcionalidades básicas', included: true },
                  { label: 'Suporte via email', included: true },
                  { label: 'Funcionalidades Plano Pro', included: false },
                  { label: 'Suporte prioritário', included: false },
                ],
              },
              {
                key: 'pro',
                name: 'Profissional',
                price: 'R$99,90',
                cor: 'border-purple-400',
                info: [
                  { label: 'Tudo do plano Free', included: true },
                  { label: 'Funcionalidades avançadas', included: true },
                  { label: 'Suporte prioritário', included: true },
                  { label: 'Integrações avançadas', included: false },
                ],
              },
              {
                key: 'enterprise',
                name: 'Enterprise',
                price: 'R$499,90',
                cor: 'border-blue-500',
                info: [
                  { label: 'Tudo do plano Profissional', included: true },
                  { label: 'Recursos ilimitados', included: true },
                  { label: 'Importação de guidelines', included: true },
                  { label: 'Integrações avançadas', included: true },
                ],
              },
              {
                key: 'lefil',
                name: 'LeFil',
                price: 'R$999,90',
                cor: 'border-yellow-400',
                info: [
                  { label: 'Tudo do plano Enterprise', included: true },
                  { label: 'Recursos ilimitados', included: true },
                  { label: 'Importação de guidelines', included: true },
                  { label: 'Integrações avançadas', included: true },
                ],
              },
            ];
            const planoEquipe = (plan?.name || '').toLowerCase();
            let planoAtual = planos.find(p =>
              (p.key === 'free' && planoEquipe.includes('free')) ||
              (p.key === 'pro' && planoEquipe.includes('pro')) ||
              (p.key === 'enterprise' && planoEquipe.includes('enterprise'))
            );
            // fallback para free se não encontrar
            if (!planoAtual) planoAtual = planos[0];
            return (
              <Card className={"bg-white border border-secondary flex flex-col justify-between"}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {planoAtual.name}
                    <span className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded">Seu Plano</span>
                  </CardTitle>
                  <div className="text-2xl font-bold mt-1">{planoAtual.price} <span className="text-base font-normal text-muted-foreground">/mês</span></div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 pb-3">
                  {planoAtual.info.map((b, i) => (
                    <div className="flex items-center gap-2" key={i}>
                      {b.included ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={`text-sm ${b.included ? '' : 'text-muted-foreground line-through'}`}>{b.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </main>
    </div>
  );
}

