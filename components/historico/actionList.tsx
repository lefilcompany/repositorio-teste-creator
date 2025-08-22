'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Action } from '@/types/action';
import { ACTION_STYLE_MAP, ACTION_TYPE_DISPLAY } from '@/types/action';

interface ActionListProps {
  actions: Action[];
  selectedAction: Action | null;
  onSelectAction: (action: Action) => void;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function ActionList({ actions, selectedAction, onSelectAction }: ActionListProps) {
  const router = useRouter();

  const handleViewAction = (actionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Previne que o clique selecione a ação
    router.push(`/historico/${actionId}`);
  };

  return (
    <div className="lg:col-span-2 bg-card p-4 md:p-6 rounded-2xl border-2 border-primary/10 flex flex-col h-full max-h-[calc(100vh-16rem)]">
      <h2 className="text-2xl font-semibold text-foreground mb-4 px-2 flex-shrink-0">Ações Recentes</h2>
      <div className="overflow-y-auto pr-2 flex-1 min-h-0">
        {actions.length > 0 ? (
          <ul className="space-y-3">
            {actions.map((action) => {
              const displayType = ACTION_TYPE_DISPLAY[action.type];
              const style = ACTION_STYLE_MAP[displayType];
              const Icon = style.icon;
              return (
                <li key={action.id}>
                  <button
                    onClick={() => onSelectAction(action)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between gap-4",
                      selectedAction?.id === action.id
                        ? "bg-primary/10 border-primary shadow-md"
                        : "bg-muted/50 border-transparent hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-center overflow-hidden flex-1">
                      <div className={cn("flex-shrink-0 rounded-lg w-10 h-10 flex items-center justify-center mr-4", style.background)}>
                        <Icon className={cn("h-5 w-5", style.color)} />
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="font-semibold text-lg text-foreground truncate">{ACTION_TYPE_DISPLAY[action.type]}</p>
                        <p className="text-sm text-muted-foreground truncate">Marca: {action.brand?.name || 'Não especificada'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        onClick={(e) => handleViewAction(action.id, e)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Visualizar</span>
                      </Button>
                      <span className="text-sm text-muted-foreground hidden md:block">
                        {formatDate(action.createdAt)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            <p>Nenhuma ação encontrada para os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}