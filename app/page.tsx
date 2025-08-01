// app/page.tsx
'use client'; // Necessário para usar hooks como useState e useEffect

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

// Interfaces para tipagem dos dados do localStorage
interface Brand {
  id: string;
  name: string;
  responsible: string;
  createdAt: string;
  updatedAt: string;
}

interface Action {
  id: string;
  type: string;
  brand: string;
  // Adicione outros campos que possam existir no seu histórico
  createdAt: string;
}


export default function HomePage() {
  // Estado para armazenar os dados dinâmicos do dashboard
  const [dashboardData, setDashboardData] = useState({
    userName: "Usuário",
    stats: {
      conteudosGerados: 0,
      marcasGerenciadas: 0,
    },
    creditos: {
      restantes: 75,
      total: 100,
    },
    atividadesRecentes: [] as { id: string; tipo: string; titulo: string; data: string }[],
  });

  useEffect(() => {
    try {
      const storedBrands = localStorage.getItem('creator-brands');
      const brands: Brand[] = storedBrands ? JSON.parse(storedBrands) : [];

      // Buscar e processar o histórico de ações
      const storedActions = localStorage.getItem('creator-action-history');
      const actions: Action[] = storedActions ? JSON.parse(storedActions) : [];

      // Ordenar ações da mais recente para a mais antiga e pegar as 3 últimas
      const atividadesRecentes = actions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .map(action => ({
          id: action.id,
          tipo: action.type,
          titulo: action.brand, // Usando a marca como título, ajuste se tiver outro campo
          data: new Date(action.createdAt).toLocaleDateString('pt-BR'),
        }));

      // Atualizar o estado com os dados do localStorage
      setDashboardData(prevData => ({
        ...prevData,
        stats: {
          ...prevData.stats,
          marcasGerenciadas: brands.length,
          conteudosGerados: actions.length,
        },
        atividadesRecentes: atividadesRecentes,
      }));

    } catch (error) {
      console.error("Falha ao carregar dados do dashboard do localStorage", error);
    }
  }, []); // O array vazio assegura que o efeito rode apenas uma vez, no client-side

  const creditosUsadosPercentual = (dashboardData.creditos.total > 0)
    ? ((dashboardData.creditos.total - dashboardData.creditos.restantes) / dashboardData.creditos.total) * 100
    : 0;

  return (
    <div className="flex flex-col min-h-full p-4 md:p-8 space-y-8 pb-8">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <div className='flex items-center space-x-2 mb-2'>
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <Home className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Olá, {dashboardData.userName}!
            </h1>
          </div>
          <p className="text-muted-foreground">
            Bem-vindo(a) de volta ao seu painel de criação.
          </p>
        </div>
        <Link href="/content">
          <Button size="lg" className="mt-4 md:mt-0 rounded-full text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105">
            <PlusCircle className="mr-2 h-5 w-5" />
            Criar Novo Conteúdo
          </Button>
        </Link>
      </header>

      {/* Grid de Cards de Estatísticas */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card de Créditos */}
        <Card className="lg:col-span-2 bg-card shadow-lg border-2 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium text-primary">Créditos Restantes</CardTitle>
            <Rocket className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dashboardData.creditos.restantes}</div>
            <p className="text-xs text-muted-foreground">
              de {dashboardData.creditos.total} créditos disponíveis
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
            <div className="text-4xl font-bold">{dashboardData.stats.conteudosGerados}</div>
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
            <div className="text-4xl font-bold">{dashboardData.stats.marcasGerenciadas}</div>
            <p className="text-xs text-muted-foreground">total de marcas ativas</p>
          </CardContent>
        </Card>
      </main>

      {/* Seção de Ações Rápidas e Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ações Rápidas */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xl font-semibold">Ações Rápidas</h3>
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
        </div>

        {/* Atividades Recentes */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4">Atividades Recentes</h3>
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <div className="divide-y">
                {dashboardData.atividadesRecentes.length > 0 ? (
                  dashboardData.atividadesRecentes.map((item) => (
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
                        <Link href="#" className="text-sm text-primary hover:underline">Ver detalhes</Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhuma atividade recente encontrada.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}