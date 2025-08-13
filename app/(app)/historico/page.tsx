'use client';

import { useState, useEffect, useMemo } from 'react';
import { History } from 'lucide-react';
import type { Action } from '@/types/action';
import type { Brand } from '@/types/brand';
import ActionList from '@/components/historico/actionList';
import ActionDetails from '@/components/historico/actionDetails';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';

export default function HistoricoPage() {
  const { user } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);

  // Estados para os filtros
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Carrega ações e marcas do localStorage
  useEffect(() => {
    try {
      if (user?.teamId) {
        const storedActions = JSON.parse(localStorage.getItem('creator-action-history') || '[]') as Action[];
        setActions(storedActions.filter(a => a.teamId === user.teamId));
        const storedBrands = JSON.parse(localStorage.getItem('creator-brands') || '[]') as Brand[];
        setBrands(storedBrands.filter(b => b.teamId === user.teamId));
      }
    } catch (error) {
      console.error("Falha ao carregar dados do localStorage", error);
    }
  }, [user]);

  // Lógica de filtragem
  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      const brandMatch = brandFilter === 'all' || action.brand === brandFilter;
      const typeMatch = typeFilter === 'all' || action.type === typeFilter;
      return brandMatch && typeMatch;
    });
  }, [actions, brandFilter, typeFilter]);

  // Atualiza a ação selecionada se ela não estiver mais na lista filtrada
  useEffect(() => {
    if (selectedAction && !filteredActions.find(a => a.id === selectedAction.id)) {
      setSelectedAction(null);
    }
  }, [filteredActions, selectedAction]);

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center flex-shrink-0 gap-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <History className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Histórico de Ações</h1>
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
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow overflow-hidden">
        <ActionList
          actions={filteredActions}
          selectedAction={selectedAction}
          onSelectAction={setSelectedAction}
        />
        <ActionDetails action={selectedAction} />
      </main>
    </div>
  );
}