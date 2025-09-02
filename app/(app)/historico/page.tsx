'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';
import type { Action } from '@/types/action';
import { ACTION_TYPE_DISPLAY } from '@/types/action';
import ActionList from '@/components/historico/actionList';
import ActionDetails from '@/components/historico/actionDetails';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import { useActionsRealtime } from '@/hooks/useActionsRealtime';
import { useBrandsRealtime } from '@/hooks/useBrandsRealtime';

export default function HistoricoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionIdFromUrl = searchParams.get('actionId');
  
  const { actions, loading: isLoadingActions } = useActionsRealtime(user?.teamId, { approved: true });
  const { brands } = useBrandsRealtime(user?.teamId);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);

  // Estados para os filtros
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Seleciona ação com base no parâmetro da URL quando as ações estiverem carregadas
  useEffect(() => {
    if (actionIdFromUrl && actions.length > 0) {
      const targetAction = actions.find(action => action.id === actionIdFromUrl);
      if (targetAction) {
        setSelectedAction(targetAction);
        if (targetAction.brand?.name) {
          setBrandFilter(targetAction.brand.name);
        }
        const actionTypeDisplay = ACTION_TYPE_DISPLAY[targetAction.type];
        if (actionTypeDisplay) {
          setTypeFilter(actionTypeDisplay);
        }
      }
    }
  }, [actions, actionIdFromUrl]);

  // Lógica de filtragem
  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      const brandMatch = brandFilter === 'all' || action.brand?.name === brandFilter;
      const typeMatch = typeFilter === 'all' || ACTION_TYPE_DISPLAY[action.type] === typeFilter;
      return brandMatch && typeMatch;
    });
  }, [actions, brandFilter, typeFilter]);

  // Atualiza a ação selecionada se ela não estiver mais na lista filtrada
  useEffect(() => {
    if (selectedAction && !filteredActions.find(a => a.id === selectedAction.id)) {
      setSelectedAction(null);
    }
  }, [filteredActions, selectedAction]);

  // Limpa o parâmetro da URL depois que a ação foi selecionada automaticamente
  useEffect(() => {
    if (actionIdFromUrl && selectedAction?.id === actionIdFromUrl) {
      // Remove o parâmetro actionId da URL sem recarregar a página
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('actionId');
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  }, [selectedAction, actionIdFromUrl, router]);

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
                  <SelectItem value="Criar conteúdo">Criar conteúdo</SelectItem>
                  <SelectItem value="Revisar conteúdo">Revisar conteúdo</SelectItem>
                  <SelectItem value="Planejar conteúdo">Planejar conteúdo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 flex-1">
        <ActionList
          actions={filteredActions}
          selectedAction={selectedAction}
          onSelectAction={setSelectedAction}
          isLoading={isLoadingActions}
        />
        {selectedAction && !isLoadingActions ? (
          <ActionDetails action={selectedAction} />
        ) : (
          <div className="bg-card p-6 rounded-2xl border-2 border-primary/10 flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              {isLoadingActions ? 'Carregando histórico...' : 'Selecione uma ação para ver os detalhes'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
