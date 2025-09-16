// /components/historico/actionList.tsx

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ActionSummary } from '@/types/action';
import { ACTION_STYLE_MAP, ACTION_TYPE_DISPLAY } from '@/types/action';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface ActionListProps {
  actions: ActionSummary[];
  selectedAction: ActionSummary | null;
  onSelectAction: (action: ActionSummary) => void;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, '...', totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};


const ActionSkeleton = () => (
  <div className="w-full text-left p-4 rounded-lg border-2 border-transparent bg-muted/50 flex items-center justify-between gap-4">
    <div className="flex items-center overflow-hidden flex-1">
      <Skeleton className="w-10 h-10 rounded-lg mr-4" />
      <div className="overflow-hidden flex-1">
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-4 w-16 hidden md:block" />
    </div>
  </div>
);

export default function ActionList({
  actions,
  selectedAction,
  onSelectAction,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
}: ActionListProps) {
  const router = useRouter();

  const handleViewAction = (actionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    router.push(`/historico/${actionId}`);
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page > 0 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const paginationRange = generatePagination(currentPage, totalPages);

  return (
    <div className="lg:col-span-2 bg-card p-4 md:p-6 rounded-2xl border-2 border-primary/10 flex flex-col h-full max-h-[calc(100vh-16rem)]">
      <h2 className="text-2xl font-semibold text-foreground mb-4 px-2 flex-shrink-0">Ações Recentes</h2>
      <div className="overflow-y-auto pr-2 flex-1 min-h-0">
        {/* ... (código da lista de ações permanece o mesmo) ... */}
        {isLoading ? (
          <ul className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i}>
                <ActionSkeleton />
              </li>
            ))}
          </ul>
        ) : actions.length > 0 ? (
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
                        : "bg-muted/50 border-transparent hover:border-border/60 hover:bg-muted"

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
            <p>Nenhuma ação encontrada para o(s) filtro(s) selecionado(s).</p>
          </div>
        )}
      </div>

      {totalPages > 1 && !isLoading && (
        <div className="pt-2 mt-auto flex-shrink-0 border-t border-border/20">
          <Pagination className="scale-90"> 
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageClick(currentPage - 1); }}
                  className={cn("cursor-pointer", currentPage === 1 && "pointer-events-none opacity-50")}
                  aria-disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {paginationRange.map((page, index) => {
                if (typeof page === 'string') {
                  return <PaginationEllipsis key={`ellipsis-${index}`} />;
                }
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageClick(page); }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageClick(currentPage + 1); }}
                  className={cn("cursor-pointer", currentPage === totalPages && "pointer-events-none opacity-50")}
                  aria-disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}