// app/(app)/home/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  Sparkles,
  CheckCircle,
  Users,
  Tag,
  Rocket,
  PlusCircle,
  FileText,
  Home
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import type { Brand } from '@/types/brand';
import type { Action } from '@/types/action';
import type { Team } from '@/types/team';
import { toast } from 'sonner';


export default function HomePage() {
  const { user, team } = useAuth();
  const [stats, setStats] = useState({ conteudosGerados: 0, marcasGerenciadas: 0 });
  const [atividadesRecentes, setAtividadesRecentes] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.teamId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch brands and actions in parallel
        const [brandsResponse, actionsResponse] = await Promise.all([
          fetch(`/api/brands?teamId=${user.teamId}`),
          fetch(`/api/actions?teamId=${user.teamId}&limit=3`) // Assumes an endpoint to get actions
        ]);

        if (brandsResponse.ok) {
          const brandsData: Brand[] = await brandsResponse.json();
          setStats(prev => ({ ...prev, marcasGerenciadas: brandsData.length }));
        } else {
          toast.error('Erro ao carregar marcas para o dashboard');
        }

        if (actionsResponse.ok) {
          const actionsData: Action[] = await actionsResponse.json();
          setAtividadesRecentes(actionsData);
          // A more robust solution would be a dedicated stats endpoint
          const totalActionsRes = await fetch(`/api/actions?teamId=${user.teamId}`);
          if (totalActionsRes.ok) {
            const allActions: Action[] = await totalActionsRes.json();
            setStats(prev => ({ ...prev, conteudosGerados: allActions.length }));
          } else {
            toast.error('Erro ao carregar estatísticas de conteúdo');
          }
        } else {
          toast.error('Erro ao carregar atividades recentes');
        }
      } catch (error) {
        console.error('Falha ao carregar dados do dashboard via API', error);
        toast.error('Erro de conexão ao carregar dados do dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const creditos = team ? {
    restantes: (team.credits?.contentSuggestions || 0) + (team.credits?.contentReviews || 0) + (team.credits?.contentPlans || 0),
    total: (typeof team.plan === 'object' ? 
      ((team.plan.limits?.contentSuggestions || 20) + (team.plan.limits?.contentReviews || 20) + (team.plan.limits?.calendars || 1)) 
      : 41) // Valor padrão para plano FREE: 20 + 20 + 1 = 41
  } : { restantes: 0, total: 0 };

  const creditosUsadosPercentual = (creditos.total > 0)
    ? ((creditos.total - creditos.restantes) / creditos.total) * 100
    : 0;

  const formattedAtividadesRecentes = atividadesRecentes.slice(0, 3).map(action => ({
    id: action.id,
    tipo: action.type,
    titulo: action.brand?.name || 'Marca não especificada',
    data: new Date(action.createdAt).toLocaleDateString('pt-BR'),
  }));

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
                  <h1 className="text-3xl font-bold text-foreground">
                    Olá, {user?.name || 'Usuário'}!
                  </h1>
                  <p className="text-muted-foreground text-base">
                    Bem-vindo(a) de volta ao seu painel de criação
                  </p>
                </div>
              </div>
              <Link href="/content">
                <Button size="lg" className="rounded-full text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Criar Novo Conteúdo
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de Cards de Estatísticas */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card de Créditos */}
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
            <Progress value={creditosUsadosPercentual} className="mt-4 h-3" />
            <Button variant="link" className="px-0 mt-2 text-primary">
              Ver planos e uso <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Card de Conteúdos Gerados */}
        <Card className="bg-card shadow-lg border-2 border-transparent hover:border-secondary/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Conteúdos Gerados</CardTitle>
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.conteudosGerados}</div>
            <p className="text-xs text-muted-foreground">total de conteúdos criados</p>
          </CardContent>
        </Card>

        {/* Card de Marcas Gerenciadas */}
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
                          <p className="text-sm text-muted-foreground">{item.tipo}</p>
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
                    {isLoading ? 'Carregando atividades...' : 'Nenhuma atividade recente encontrada.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}