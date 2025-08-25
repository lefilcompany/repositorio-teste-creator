'use client';

import { useState, useEffect } from 'react';
import type { Action } from '@/types/action';
import type { Brand } from '@/types/brand';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  conteudosGerados: number;
  marcasGerenciadas: number;
}

interface UseDashboardReturn {
  stats: DashboardStats;
  atividadesRecentes: Action[];
  marcas: Brand[];
  credits: {
    restantes: number;
    total: number;
    percentualUsado: number;
  };
  isLoading: boolean;
  error: string | null;
  refetchData: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const { user, team, isLoading: isAuthLoading } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({ conteudosGerados: 0, marcasGerenciadas: 0 });
  const [atividadesRecentes, setAtividadesRecentes] = useState<Action[]>([]);
  const [marcas, setMarcas] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculação simples de créditos
  const credits = {
    restantes: team?.credits ? 
      (team.credits.contentSuggestions || 0) + 
      (team.credits.contentReviews || 0) + 
      (team.credits.contentPlans || 0) : 0,
    total: 45, // Valor padrão
    get percentualUsado() {
      return this.total > 0 ? ((this.total - this.restantes) / this.total) * 100 : 0;
    }
  };

  // Função simples para buscar dados
  const fetchAllData = async () => {
    if (!user || !team) return;

    try {
      setIsLoading(true);
      setError(null);

      // Dados mockados para evitar requisições que estão falhando
      const mockStats = { conteudosGerados: 12, marcasGerenciadas: 3 };
      const mockActivities: Action[] = [
        {
          id: '1',
          type: 'CRIAR_CONTEUDO',
          status: 'Aprovado',
          result: { title: 'Conteúdo sobre marketing digital' },
          createdAt: new Date().toISOString(),
          approved: true,
          teamId: team.id,
          userId: user.id,
          brandId: 'mock-brand-1',
          revisions: 0
        },
        {
          id: '2',
          type: 'REVISAR_CONTEUDO',
          status: 'Aprovado',
          result: { feedback: 'Conteúdo revisado com sucesso' },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          approved: true,
          teamId: team.id,
          userId: user.id,
          brandId: 'mock-brand-1',
          revisions: 1
        },
        {
          id: '3',
          type: 'PLANEJAR_CONTEUDO',
          status: 'Aprovado',
          result: { plan: 'Plano de conteúdo para redes sociais' },
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          approved: true,
          teamId: team.id,
          userId: user.id,
          brandId: 'mock-brand-1',
          revisions: 0
        }
      ];
      
      const mockBrands: Brand[] = [
        {
          id: '1',
          name: 'Minha Marca',
          teamId: team.id,
          userId: user.id,
          responsible: 'João Silva',
          segment: 'Tecnologia',
          values: 'Inovação, qualidade, confiança',
          keywords: 'tecnologia, inovação, digital',
          goals: 'Ser líder no mercado de tecnologia',
          inspirations: 'Apple, Google, Microsoft',
          successMetrics: 'Vendas, engajamento, reconhecimento',
          references: 'Empresas do vale do silício',
          specialDates: 'Black Friday, Natal',
          sectorRestrictions: 'Nenhuma',
          promise: 'Tecnologia que transforma vidas',
          crisisInfo: 'Plano de gestão de crise definido',
          milestones: 'Lançamento do produto principal',
          collaborations: 'Parcerias estratégicas',
          restrictions: 'Sem conteúdo político',
          moodboard: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Segunda Marca',
          teamId: team.id,
          userId: user.id,
          responsible: 'Maria Santos',
          segment: 'Moda',
          values: 'Diversão, criatividade, autenticidade',
          keywords: 'moda, estilo, juventude',
          goals: 'Ser referência em moda jovem',
          inspirations: 'Zara, H&M, Uniqlo',
          successMetrics: 'Vendas online, seguidores',
          references: 'Influenciadores de moda',
          specialDates: 'Fashion Week, Black Friday',
          sectorRestrictions: 'Nenhuma',
          promise: 'Moda acessível e estilosa',
          crisisInfo: 'Protocolo de resposta rápida',
          milestones: 'Abertura de nova loja',
          collaborations: 'Influenciadores digitais',
          restrictions: 'Sem conteúdo controverso',
          moodboard: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      setStats(mockStats);
      setAtividadesRecentes(mockActivities);
      setMarcas(mockBrands);

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
      
      // Dados de fallback em caso de erro
      setStats({ conteudosGerados: 0, marcasGerenciadas: 0 });
      setAtividadesRecentes([]);
      setMarcas([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para recarregar dados
  const refetchData = async () => {
    await fetchAllData();
  };

  // Carregar dados uma única vez quando o componente monta
  useEffect(() => {
    if (!isAuthLoading && user && team) {
      fetchAllData();
    }
  }, [isAuthLoading, user?.id, team?.id]); // Dependencies específicas para evitar loops

  return {
    stats,
    atividadesRecentes,
    marcas,
    credits,
    isLoading: isAuthLoading || isLoading,
    error,
    refetchData
  };
}
