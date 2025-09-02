// app/(app)/home/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowRight,
  Sparkles,
  CheckCircle,
  Users,
  Tag,
  Rocket,
  FileText,
  Home,
  Plus
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useTeamRealtime } from '@/hooks/useTeamRealtime';
import type { Brand } from '@/types/brand';
import type { Action } from '@/types/action';
import { ACTION_TYPE_DISPLAY } from '@/types/action';
import { toast } from 'sonner';

export default function HomePage() {
  const { user, team } = useAuth();
  const [stats, setStats] = useState({ acoesTotais: 0, marcasGerenciadas: 0 });
  const [atividadesRecentes, setAtividadesRecentes] = useState<Action[]>([]);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  // Estados de carregamento independentes
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const { team: teamRealtime, loading: loadingTeamRealtime } = useTeamRealtime(user?.teamId);

  // Detecta quando a autenticação está carregada
  useEffect(() => {
    if (user !== undefined) {
      setIsAuthLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true; // Flag para evitar updates se componente foi desmontado
    
    const fetchBrands = async () => {
      if (!user?.teamId || !isAuthLoaded) {
        setIsLoadingBrands(false);
        return;
      }

      try {
        // Primeiro tentar buscar dados do team com contadores
        const teamResponse = await fetch(`/api/teams/${user.teamId}`);
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          if (isMounted) {
            setStats(prev => ({ 
              ...prev, 
              marcasGerenciadas: teamData.totalBrands || 0 
            }));
          }
        } else {
          // Fallback: buscar marcas diretamente (se a API de brands não precisar de teamId)
          const brandsResponse = await fetch(`/api/brands`);
          if (brandsResponse.ok) {
            const brandsData: Brand[] = await brandsResponse.json();
            // Filtrar marcas do team atual
            const teamBrands = brandsData.filter(brand => brand.teamId === user.teamId);
            if (isMounted) {
              setStats(prev => ({ ...prev, marcasGerenciadas: teamBrands.length }));
            }
          } else {
            // Se ambas as APIs falharem, usar 0
            if (isMounted) {
              setStats(prev => ({ ...prev, marcasGerenciadas: 0 }));
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          setStats(prev => ({ ...prev, marcasGerenciadas: 0 }));
        }
      } finally {
        if (isMounted) {
          setIsLoadingBrands(false);
        }
      }
    };

    const fetchActivities = async () => {
      if (!user?.id || !user?.teamId || !isAuthLoaded) {
        setIsLoadingActivities(false);
        return;
      }

      try {
        // Buscar ações aprovadas do usuário específico
        const actionsResponse = await fetch(`/api/actions?teamId=${user.teamId}&userId=${user.id}&approved=true&limit=5`);
        if (actionsResponse.ok) {
          const actionsData: Action[] = await actionsResponse.json();
          
          // Filtrar apenas ações válidas e aprovadas do usuário específico
          const validActions = actionsData.filter(action => {
            if (!action.approved || action.status !== 'Aprovado') return false;
            if (action.userId !== user.id) return false; // Garantir que é do usuário específico
            if (!action.result) return false;
            
            // Validar se a ação tem conteúdo válido
            if (action.type === 'REVISAR_CONTEUDO') {
              return !!(action.result as any)?.feedback;
            }
            if (action.type === 'CRIAR_CONTEUDO') {
              const result = action.result as any;
              return !!(result?.title || result?.body || result?.content);
            }
            if (action.type === 'PLANEJAR_CONTEUDO') {
              return !!(action.result as any)?.plan;
            }
            
            return true;
          });
          
          if (isMounted) {
            setAtividadesRecentes(validActions.slice(0, 3));
          }
        } else {
          // Se a API falhar, usar array vazio
          if (isMounted) {
            setAtividadesRecentes([]);
          }
        }
      } catch (error) {
        if (isMounted) {
          setAtividadesRecentes([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingActivities(false);
        }
      }
    };

    const fetchStats = async () => {
      if (!user?.id || !user?.teamId || !isAuthLoaded) {
        setIsLoadingStats(false);
        return;
      }

      try {
        // Buscar todas as ações aprovadas do usuário específico (todos os tipos)
        const actionsResponse = await fetch(`/api/actions?teamId=${user.teamId}&userId=${user.id}&approved=true`);
        if (actionsResponse.ok) {
          const actionsData: Action[] = await actionsResponse.json();
          // Contar todas as ações aprovadas do usuário (criar, revisar e planejar conteúdo)
          const userTotalActions = actionsData.filter(action => 
            action.approved && 
            action.status === 'Aprovado' && 
            action.userId === user.id &&
            (action.type === 'CRIAR_CONTEUDO' || action.type === 'REVISAR_CONTEUDO' || action.type === 'PLANEJAR_CONTEUDO')
          );
          if (isMounted) {
            setStats(prev => ({ ...prev, acoesTotais: userTotalActions.length }));
          }
        } else {
          // Se a API falhar, usar 0
          if (isMounted) {
            setStats(prev => ({ ...prev, acoesTotais: 0 }));
          }
        }
      } catch (error) {
        if (isMounted) {
          setStats(prev => ({ ...prev, acoesTotais: 0 }));
        }
      } finally {
        if (isMounted) {
          setIsLoadingStats(false);
        }
      }
    };

    if (isAuthLoaded && user?.id && user?.teamId) {
      // Executar com pequenos delays para melhor UX
      const timer1 = setTimeout(fetchBrands, 0);
      const timer2 = setTimeout(fetchActivities, 100);
      const timer3 = setTimeout(fetchStats, 200);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoaded]);

  // Calculando créditos corretamente - os créditos no team.credits são os créditos restantes
  const creditos = teamRealtime ? {
    // Garantir que estamos usando os valores corretos do banco
    restantes: (teamRealtime.credits?.contentSuggestions || 0) + (teamRealtime.credits?.contentReviews || 0) + (teamRealtime.credits?.contentPlans || 0),
    total: (typeof teamRealtime.plan === 'object' ? 
      ((teamRealtime.plan.limits?.contentSuggestions || 20) + (teamRealtime.plan.limits?.contentReviews || 20) + (teamRealtime.plan.limits?.calendars || 5)) 
      : 45) // Valor padrão para plano FREE: 20 + 20 + 5 = 45
  } : { restantes: 0, total: 0 };

  const creditosUsadosPercentual = (creditos.total > 0)
    ? ((creditos.total - creditos.restantes) / creditos.total) * 100
    : 0;

  const formattedAtividadesRecentes = atividadesRecentes.slice(0, 3).map(action => {
    // Monta o título e subtítulo baseado no tipo de ação
    let titulo = '';
    let subtitulo = '';
    
    switch (action.type) {
      case 'CRIAR_CONTEUDO':
        titulo = 'Conteúdo Criado';
        const createResult = action.result as any;
        if (createResult?.title) {
          subtitulo = createResult.title;
        } else {
          subtitulo = `Conteúdo para ${action.brand?.name || 'marca não especificada'}`;
        }
        break;
        
      case 'REVISAR_CONTEUDO':
        titulo = 'Revisão de Imagem';
        subtitulo = `Análise realizada para ${action.brand?.name || 'marca não especificada'}`;
        break;
        
      case 'PLANEJAR_CONTEUDO':
        titulo = 'Calendário Planejado';
        subtitulo = `Planejamento para ${action.brand?.name || 'marca não especificada'}`;
        break;
        
      default:
        titulo = ACTION_TYPE_DISPLAY[action.type] || 'Ação realizada';
        subtitulo = action.brand?.name || 'Marca não especificada';
    }
    
    return {
      id: action.id,
      tipo: ACTION_TYPE_DISPLAY[action.type] || action.type,
      titulo: titulo,
      subtitulo: subtitulo,
      data: new Date(action.createdAt).toLocaleDateString('pt-BR'),
    };
  });

  // Componentes de skeleton
  const StatsCardSkeleton = () => (
    <Card className="bg-card shadow-lg border-2 border-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-16 mb-2" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  );

  const CreditsCardSkeleton = () => (
    <Card className="lg:col-span-2 bg-card shadow-lg border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-16 mb-2" />
        <Skeleton className="h-3 w-48 mb-4" />
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-6 w-32" />
      </CardContent>
    </Card>
  );

  const ActivitiesSkeleton = () => (
    <div className="divide-y">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                  <Home className="h-8 w-8" />
                </div>
                <div>
                  {!isAuthLoaded || !user ? (
                    <>
                      <Skeleton className="h-8 w-48 mb-2" />
                      <Skeleton className="h-4 w-64" />
                    </>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold text-foreground">
                        Olá, {user?.name || 'Usuário'}!
                      </h1>
                      <p className="text-muted-foreground text-base">
                        Bem-vindo(a) de volta ao seu painel de criação
                      </p>
                    </>
                  )}
                </div>
              </div>
              <Link href="/content">
                <Button size="lg" className="rounded-full text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105">
                  <Plus className="mr-2 h-5 w-5" />
                  Criar Novo Conteúdo
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* Grid de Cards de Estatísticas */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card de Créditos */}
          {(!isAuthLoaded || loadingTeamRealtime) ? (
            <CreditsCardSkeleton />
          ) : (
            <Card className="lg:col-span-2 bg-card shadow-lg border-2 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium text-primary">Créditos Restantes</CardTitle>
                <Rocket className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{creditos.restantes}</div>
                <p className="text-xs text-muted-foreground">
                  de {creditos.total} créditos disponíveis
                </p>
                <Progress value={100 - creditosUsadosPercentual} className="mt-4 h-3" />
                <Link href="/planos">
                  <Button variant="link" className="px-0 mt-2 text-primary">
                    Ver planos e uso <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Card de Conteúdos Gerados */}
          {isLoadingStats ? (
            <StatsCardSkeleton />
          ) : (
            <Card className="bg-card shadow-lg border-2 border-transparent hover:border-secondary/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Minhas Ações</CardTitle>
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.acoesTotais}</div>
                <p className="text-xs text-muted-foreground">total de ações realizadas</p>
              </CardContent>
            </Card>
          )}

          {/* Card de Marcas Gerenciadas */}
          {isLoadingBrands ? (
            <StatsCardSkeleton />
          ) : (
            <Card className="bg-card shadow-lg border-2 border-transparent hover:border-secondary/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Marcas Gerenciadas</CardTitle>
                <Tag className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.marcasGerenciadas}</div>
                <p className="text-xs text-muted-foreground">total de marcas ativas</p>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Seção de Ações Rápidas e Atividades Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ações Rápidas */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-lg border-0 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-secondary/10 text-secondary rounded-lg p-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Ações Rápidas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/content" className="block">
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Sparkles className="h-6 w-6 text-accent" />
                      <div>
                        <p className="font-semibold">Criar Conteúdo</p>
                        <p className="text-sm text-muted-foreground">Gerar novas imagens e textos.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/revisar" className="block">
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <CheckCircle className="h-6 w-6 text-accent" />
                      <div>
                        <p className="font-semibold">Revisar Imagem</p>
                        <p className="text-sm text-muted-foreground">Receber feedback da IA.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/personas" className="block">
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Users className="h-6 w-6 text-accent" />
                      <div>
                        <p className="font-semibold">Gerenciar Personas</p>
                        <p className="text-sm text-muted-foreground">Adicionar ou editar suas personas.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Atividades Recentes */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                    <FileText className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Atividades Recentes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingActivities ? (
                  <ActivitiesSkeleton />
                ) : (
                  <div className="divide-y">
                    {formattedAtividadesRecentes.length > 0 ? (
                      formattedAtividadesRecentes.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-full">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold">{item.titulo}</p>
                              <p className="text-sm text-muted-foreground">{item.subtitulo}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{item.data}</p>
                            <Link href={`/historico?actionId=${item.id}`} className="text-sm text-primary hover:underline">Ver detalhes</Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        Nenhuma atividade recente encontrada.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
