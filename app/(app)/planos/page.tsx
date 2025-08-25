'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Team } from '@/types/team';
import { toast } from 'sonner';
import { ArrowLeft, Rocket, Zap, CheckCircle, Calendar, Tag, Users, Palette, UserCheck, Building2, Target, Crown, X } from 'lucide-react';
import Link from 'next/link';

export default function PlanosPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!user) return;

      // Debug log

      try {
        const response = await fetch(`/api/teams?userId=${user.id}`);
        if (response.ok) {
          const teamsData = await response.json();
          // A API retorna um array de teams, precisamos encontrar o team do usuário
          if (Array.isArray(teamsData) && teamsData.length > 0) {
            const currentTeam = teamsData.find(t => t.id === user.teamId) || teamsData[0];
            setTeam(currentTeam);
          } else {
            throw new Error('Nenhum time encontrado');
          }
        } else {
          const errorText = await response.text();
          throw new Error('Falha ao carregar dados do time');
        }
      } catch (error) {
        toast.error('Erro ao carregar informações do plano');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!team || typeof team.plan !== 'object' || !team.plan.limits) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg">Erro ao carregar informações do plano</p>
          <p className="text-sm text-muted-foreground">
            {!team ? 'Team não encontrado' : 'Dados do plano inválidos'}
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

  const { plan, credits } = team;
  const planLimits = plan.limits;

  // Cálculo dos créditos - correção: os créditos no banco representam os disponíveis, não os usados
  const creditData = [
    {
      name: 'Sugestões de Conteúdo',
      current: credits?.contentSuggestions || 0,
      limit: planLimits?.contentSuggestions || 20,
      icon: <Zap className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      name: 'Revisões de Conteúdo',
      current: credits?.contentReviews || 0,
      limit: planLimits?.contentReviews || 20,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      name: 'Calendários',
      current: credits?.contentPlans || 0,
      limit: planLimits?.calendars || 5,
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-purple-600'
    }
  ];

  const totalCredits = creditData.reduce((acc, credit) => acc + credit.current, 0);
  const totalLimits = creditData.reduce((acc, credit) => acc + credit.limit, 0);

  return (
    <div className="min-h-full flex flex-col gap-4">
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
                      até {planLimits?.brands || 1}
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
                      até {planLimits?.themes || 3}
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
                      até {planLimits?.personas || 2}
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
                      até {planLimits?.members || 5}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-9">
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
            </CardContent>
          </Card>

          {/* Informações do plano */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Plano FREE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Todas as funcionalidades básicas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Suporte via email</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Funcionalidades Plano Pro</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Suporte prioritário</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

