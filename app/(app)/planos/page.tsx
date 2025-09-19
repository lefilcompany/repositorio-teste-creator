'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Team } from '@/types/team';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Crown,
  Palette,
  Sparkles,
  Tag,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import {
  AVAILABLE_PLANS,
  buildPlanSnapshot,
  getDefaultCredits,
  getPlanDefinition,
  PlanDefinition,
  PlanKey,
  resolvePlanKey,
  isTrialExpired,
} from '@/lib/plans';

const UPGRADE_PLANS = AVAILABLE_PLANS.filter(plan => plan.key !== 'TRIAL');

const FEATURE_LABELS: { key: keyof PlanDefinition['limits']; label: string }[] = [
  { key: 'members', label: 'Membros' },
  { key: 'brands', label: 'Marcas' },
  { key: 'themes', label: 'Temas Estratégicos' },
  { key: 'personas', label: 'Personas' },
  { key: 'contentSuggestions', label: 'Conteúdos rápidos' },
  { key: 'customCreations', label: 'Conteúdos personalizados' },
  { key: 'contentPlans', label: 'Planejamentos de Conteúdo' },
  { key: 'contentReviews', label: 'Revisões de Conteúdo' },
];

const normalizeTeamPlan = (team: Team) => {
  const planName = typeof team.plan === 'object' ? team.plan.name : (team.plan as string | undefined);
  const planKey = resolvePlanKey(team.planKey, planName);
  const planDefinition = getPlanDefinition(planKey);
  const baseSnapshot = buildPlanSnapshot(planDefinition);

  if (typeof team.plan !== 'object') {
    return { planKey, planDefinition, planSnapshot: baseSnapshot };
  }

  const limits = team.plan.limits || {};
  const planSnapshot = {
    ...baseSnapshot,
    ...team.plan,
    limits: {
      ...baseSnapshot.limits,
      ...limits,
      contentPlans: limits.contentPlans ?? limits.calendars ?? baseSnapshot.limits.contentPlans,
      calendars: limits.calendars ?? limits.contentPlans ?? baseSnapshot.limits.calendars,
      customCreations: limits.customCreations ?? baseSnapshot.limits.customCreations,
    },
  };

  return { planKey, planDefinition, planSnapshot };
};

const normalizeCredits = (team: Team, planDefinition: PlanDefinition) => {
  const defaults = getDefaultCredits(planDefinition);
  const credits = team.credits || {};
  return {
    contentSuggestions: typeof credits.contentSuggestions === 'number'
      ? credits.contentSuggestions
      : defaults.contentSuggestions,
    customCreations: typeof credits.customCreations === 'number'
      ? credits.customCreations
      : defaults.customCreations,
    contentPlans: typeof credits.contentPlans === 'number'
      ? credits.contentPlans
      : (credits as any)?.calendars ?? defaults.contentPlans,
    contentReviews: typeof credits.contentReviews === 'number'
      ? credits.contentReviews
      : defaults.contentReviews,
  };
};

export default function PlanosPage() {
  const { user, reloadTeam } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingPlan, setUpdatingPlan] = useState<PlanKey | null>(null);

  const team = useMemo(() => teams.find(t => t.id === user?.teamId) || null, [teams, user?.teamId]);

  useEffect(() => {
    const loadTeams = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const teamsRes = await fetch(`/api/teams?userId=${user.id}`);
        if (teamsRes.ok) {
          const teamsData: Team[] = await teamsRes.json();
          setTeams(teamsData);
        } else {
          toast.error('Erro ao carregar informações do plano');
        }
      } catch (error) {
        toast.error('Erro de conexão ao carregar informações do plano');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeams();
  }, [user]);

  const isAdmin = user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg">Equipe não encontrada</p>
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

  const { planKey, planDefinition, planSnapshot } = normalizeTeamPlan(team);
  const planLimits = planSnapshot.limits;
  const credits = normalizeCredits(team, planDefinition);
  const normalizedLimits = {
    contentSuggestions: planLimits.contentSuggestions ?? planDefinition.limits.contentSuggestions,
    customCreations: planLimits.customCreations ?? planDefinition.limits.customCreations,
    contentPlans: planLimits.contentPlans ?? planLimits.calendars ?? planDefinition.limits.contentPlans,
    contentReviews: planLimits.contentReviews ?? planDefinition.limits.contentReviews,
  };

  const creditData = [
    {
      name: 'Conteúdos rápidos',
      current: credits.contentSuggestions,
      limit: normalizedLimits.contentSuggestions,
      icon: <Zap className="h-4 w-4" />,
      color: 'text-blue-600',
    },
    {
      name: 'Conteúdos personalizados',
      current: credits.customCreations,
      limit: normalizedLimits.customCreations,
      icon: <Sparkles className="h-4 w-4" />,
      color: 'text-pink-600',
    },
    {
      name: 'Planejamentos',
      current: credits.contentPlans,
      limit: normalizedLimits.contentPlans,
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-purple-600',
    },
    {
      name: 'Revisões de Conteúdo',
      current: credits.contentReviews,
      limit: normalizedLimits.contentReviews,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600',
    },
  ];

  const totalCredits = creditData.reduce((acc, credit) => acc + credit.current, 0);
  const totalLimits = creditData.reduce((acc, credit) => acc + credit.limit, 0);

  const subscriptionStatus = team.subscriptionStatus || (planKey === 'TRIAL' ? 'TRIAL' : 'ACTIVE');
  const trialExpired = isTrialExpired(team.trialEndsAt ?? null);
  const trialEndsAtDate = team.trialEndsAt ? new Date(team.trialEndsAt) : null;
  const daysLeft = trialEndsAtDate && !trialExpired
    ? Math.max(0, Math.ceil((trialEndsAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const showTrialCountdown = subscriptionStatus === 'TRIAL' && !trialExpired;
  const showExpiredWarning = subscriptionStatus === 'EXPIRED' || (subscriptionStatus === 'TRIAL' && trialExpired);

  let statusLabel = 'Plano ativo';
  let statusClass = 'bg-emerald-100 text-emerald-700';

  if (subscriptionStatus === 'TRIAL') {
    statusLabel = trialExpired ? 'Teste expirado' : 'Teste gratuito';
    statusClass = trialExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  } else if (subscriptionStatus === 'EXPIRED') {
    statusLabel = 'Assinatura expirada';
    statusClass = 'bg-red-100 text-red-700';
  } else if (subscriptionStatus === 'CANCELLED') {
    statusLabel = 'Assinatura cancelada';
    statusClass = 'bg-slate-200 text-slate-700';
  }

  const handlePlanSelection = async (targetPlanKey: PlanKey) => {
    if (!team) return;
    if (targetPlanKey === planKey) {
      toast.info('Este já é o plano atual da equipe.');
      return;
    }

    if (!isAdmin) {
      toast.info('Somente administradores podem alterar o plano da equipe.');
      return;
    }

    const targetDefinition = getPlanDefinition(targetPlanKey);
    const planPayload = buildPlanSnapshot(targetDefinition);
    const creditsPayload = getDefaultCredits(targetDefinition);

    try {
      setUpdatingPlan(targetPlanKey);
      const response = await fetch('/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: team.id,
          plan: planPayload,
          planKey: targetDefinition.key,
          subscriptionStatus: 'ACTIVE',
          credits: creditsPayload,
          trialEndsAt: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Não foi possível atualizar o plano.');
      }

      const updatedTeam: Team = await response.json();
      setTeams(prev => prev.map(t => (t.id === updatedTeam.id ? updatedTeam : t)));
      await reloadTeam();
      toast.success(`Plano ${targetDefinition.name} ativado com sucesso!`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar o plano.');
    } finally {
      setUpdatingPlan(null);
    }
  };

  return (
    <div className="min-h-full flex flex-col gap-4">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Crown className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-foreground">
                  Plano {planSnapshot.name}
                </CardTitle>
                <p className="text-muted-foreground text-base">
                  {planDefinition.description || 'Gerencie seu plano e acompanhe o uso de recursos'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                {statusLabel}
              </span>
              {showTrialCountdown && (
                <span className="text-xs text-muted-foreground">
                  Restam {daysLeft} dia{daysLeft === 1 ? '' : 's'} de teste gratuito
                </span>
              )}
              <span className="text-sm font-medium text-foreground">{planSnapshot.price}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {showExpiredWarning && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Período de teste encerrado</p>
              <p className="text-sm text-red-600">
                Escolha um plano para continuar acessando todos os recursos do Creator.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
        <div className="space-y-6">
          <Card className="bg-white/80 border border-primary/10 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Plano Atual
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Você está usando o plano {planSnapshot.name}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creditData.map((credit, index) => {
              const usedCredits = Math.max(0, credit.limit - credit.current);
              const percentage = credit.limit > 0 ? (usedCredits / credit.limit) * 100 : 0;
              const isLow = credit.current <= credit.limit * 0.2;
              const isAtLimit = credit.current <= 0;

              return (
                <Card key={index} className={`${isAtLimit ? 'border-destructive/50' : isLow ? 'border-amber-500/50' : 'border-green-500/50'}`}>
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
                      <Progress value={percentage} className="h-2" />
                      {isAtLimit && (
                        <p className="text-xs text-destructive">
                          Créditos esgotados
                        </p>
                      )}
                      {isLow && !isAtLimit && (
                        <p className="text-xs text-amber-600">
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
                      até {planLimits?.brands || planDefinition.limits.brands}
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
                      até {planLimits?.themes || planDefinition.limits.themes}
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
                      até {planLimits?.personas || planDefinition.limits.personas}
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
                      até {planLimits?.members || planDefinition.limits.members}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
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
            </CardContent>
          </Card>

          <div className="space-y-4">
            {UPGRADE_PLANS.map(planOption => {
              const isCurrentPlan = planOption.key === planKey;
              const isProcessing = updatingPlan === planOption.key;
              const features = FEATURE_LABELS.map(feature => ({
                label: feature.label,
                value: planOption.limits[feature.key],
              }));

              return (
                <Card key={planOption.key} className="bg-white border border-secondary flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">
                        {planOption.name}
                      </CardTitle>
                      {isCurrentPlan && (
                        <span className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded">Plano atual</span>
                      )}
                    </div>
                    <div className="text-2xl font-bold mt-1">{planOption.price}</div>
                    <p className="text-sm text-muted-foreground">
                      {planOption.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 pb-4">
                    <div className="space-y-2">
                      {features.map(feature => (
                        <div className="flex items-center gap-2" key={feature.label}>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">
                            <span className="font-medium">{feature.value}</span> {feature.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full mt-3"
                      variant={isCurrentPlan ? 'outline' : 'default'}
                      disabled={isCurrentPlan || isProcessing || !isAdmin}
                      onClick={() => handlePlanSelection(planOption.key)}
                    >
                      {isProcessing ? 'Atualizando...' : isCurrentPlan ? 'Plano atual' : 'Selecionar plano'}
                    </Button>
                    {!isAdmin && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Apenas administradores podem alterar o plano.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
