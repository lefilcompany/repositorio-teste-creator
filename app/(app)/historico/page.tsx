// /app/historico/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';
import type { Action, ActionSummary } from '@/types/action';
import type { BrandSummary } from '@/types/brand';
import { ACTION_TYPE_DISPLAY } from '@/types/action';
import ActionList from '@/components/historico/actionList';
import ActionDetails from '@/components/historico/actionDetails';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function HistoricoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionIdFromUrl = searchParams.get('actionId');

  const [actions, setActions] = useState<ActionSummary[]>([]);
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [selectedActionSummary, setSelectedActionSummary] = useState<ActionSummary | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [isLoadingActions, setIsLoadingActions] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [isLoadingActionDetails, setIsLoadingActionDetails] = useState(false);

  // Estados para os filtros
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Novos estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const [initialUrlActionHandled, setInitialUrlActionHandled] = useState(false);

  const handleSelectAction = useCallback(async (action: ActionSummary) => {
    setSelectedActionSummary(action);
    setIsLoadingActionDetails(true);
    try {
      const res = await fetch(`/api/actions/${action.id}?teamId=${user?.teamId}`);
      if (res.ok) {
        const data: Action = await res.json();
        setSelectedAction(data);
      } else {
        toast.error('Erro ao carregar detalhes da ação');
      }
    } catch {
      toast.error('Erro de conexão ao carregar detalhes da ação');
    } finally {
      setIsLoadingActionDetails(false);
    }
  }, [user?.teamId]);

  // Carrega ações aprovadas via API com base nos filtros e página atual
  useEffect(() => {
    const loadData = async () => {
      if (!user?.teamId) return;

      setIsLoadingActions(true);
      try {
        const params = new URLSearchParams({
          teamId: user.teamId,
          approved: 'true',
          summary: 'true',
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
        });

        if (brandFilter !== 'all') {
          params.append('brandName', brandFilter);
        }
        if (typeFilter !== 'all') {
          params.append('type', typeFilter);
        }

        const actionsRes = await fetch(`/api/actions?${params.toString()}`);
        if (actionsRes.ok) {
          const { data, total } = await actionsRes.json();
          setActions(data);
          setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));

          if (actionIdFromUrl && !initialUrlActionHandled) {
            const targetAction = data.find((action: ActionSummary) => action.id === actionIdFromUrl);
            if (targetAction) {
              await handleSelectAction(targetAction);
              setInitialUrlActionHandled(true);
            }
          }
        } else {
          toast.error('Erro ao carregar histórico de ações');
          setActions([]);
          setTotalPages(0);
        }
      } catch (error) {
        toast.error('Erro de conexão ao carregar histórico');
      } finally {
        setIsLoadingActions(false);
      }
    };

    loadData();
  }, [user?.teamId, currentPage, brandFilter, typeFilter, actionIdFromUrl, handleSelectAction, initialUrlActionHandled]);

  // Carrega marcas para os filtros
  useEffect(() => {
    const loadBrands = async () => {
      if (!user?.teamId) return;
      setIsLoadingBrands(true);
      try {
        const brandsRes = await fetch(`/api/brands?teamId=${user.teamId}&summary=true`);
        if (brandsRes.ok) {
          const brandsData: BrandSummary[] = await brandsRes.json();
          setBrands(brandsData);
        } else {
          toast.error('Erro ao carregar marcas para filtros');
        }
      } catch (error) {
        toast.error('Erro de conexão ao carregar marcas');
      } finally {
        setIsLoadingBrands(false);
      }
    };
    loadBrands();
  }, [user?.teamId]);

  // Reseta para a primeira página sempre que um filtro é alterado
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandFilter, typeFilter]);

  // Atualiza a ação selecionada se ela não estiver mais na lista da página atual
  useEffect(() => {
    if (selectedActionSummary && !actions.find(a => a.id === selectedActionSummary.id)) {
      setSelectedActionSummary(null);
      setSelectedAction(null);
    }
  }, [actions, selectedActionSummary]);

  // Limpa o parâmetro da URL depois que a ação foi selecionada automaticamente
  useEffect(() => {
    if (actionIdFromUrl && selectedActionSummary?.id === actionIdFromUrl) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('actionId');
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  }, [selectedActionSummary, actionIdFromUrl, router]);

  return (
    <div className="min-h-full flex flex-col gap-6">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-secondary/10 text-secondary rounded-lg p-3">
                <History className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Histórico de Ações</CardTitle>
                <p className="text-muted-foreground">
                  Visualize e filtre todas as ações realizadas no sistema.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {/* Filtro de Marca */}
              <Select onValueChange={setBrandFilter} value={brandFilter}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-lg">
                  <SelectValue placeholder="Filtrar por marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Marcas</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Filtro de Ação */}
              <Select onValueChange={setTypeFilter} value={typeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-lg">
                  <SelectValue placeholder="Filtrar por ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Ações</SelectItem>
                  {Object.values(ACTION_TYPE_DISPLAY).map(displayType => (
                    <SelectItem key={displayType} value={displayType}>{displayType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 flex-1">
        <ActionList
          actions={actions}
          selectedAction={selectedActionSummary}
          onSelectAction={handleSelectAction}
          isLoading={isLoadingActions}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        {selectedActionSummary ? (
          <ActionDetails action={selectedAction} isLoading={isLoadingActionDetails} />
        ) : (
          <div className="lg:col-span-1 h-full bg-card p-6 rounded-2xl border-2 border-dashed border-secondary/20 flex flex-col items-center justify-center text-center">
            <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Nenhuma ação selecionada</h3>
            <p className="text-muted-foreground">Selecione uma ação na lista para ver os detalhes.</p>
          </div>
        )}
      </main>
    </div>
  );
}