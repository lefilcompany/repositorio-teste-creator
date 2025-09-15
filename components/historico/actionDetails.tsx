'use client';

import Image from 'next/image';
import { History, Image as ImageIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { Action } from '@/types/action';
import { ACTION_STYLE_MAP, ACTION_TYPE_DISPLAY } from '@/types/action';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ActionDetailsProps {
  action: Action | null;
  isLoading?: boolean;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="p-3 bg-muted/50 rounded-lg">
    <p className="text-sm text-muted-foreground">{label}</p>
    {typeof value === 'string' ? (
      <p className="font-semibold text-foreground break-words">{value}</p>
    ) : (
      value
    )}
  </div>
);

export default function ActionDetails({ action, isLoading = false }: ActionDetailsProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="lg:col-span-1 h-full bg-card p-6 rounded-2xl border-2 border-secondary/20 flex flex-col animate-pulse">
        <div className="flex items-center mb-6 flex-shrink-0">
          <Skeleton className="w-16 h-16 rounded-xl mr-4" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="lg:col-span-1 h-full bg-card p-6 rounded-2xl border-2 border-dashed border-secondary/20 flex flex-col items-center justify-center text-center">
        <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-semibold text-foreground">Nenhuma ação selecionada</h3>
        <p className="text-muted-foreground">Selecione uma ação na lista para ver os detalhes.</p>
      </div>
    );
  }

  const displayType = ACTION_TYPE_DISPLAY[action.type];
  const style = ACTION_STYLE_MAP[displayType];
  const Icon = style.icon;

  return (
    <div className="lg:col-span-1 h-full max-h-[calc(100vh-16rem)]">
      <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border-2 border-secondary/20 h-full flex flex-col">
        <div className="flex items-center mb-6 flex-shrink-0">
          <div className={cn("flex-shrink-0 rounded-xl w-16 h-16 flex items-center justify-center mr-4", style.background)}>
            <Icon className={cn("h-8 w-8", style.color)} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground break-words">{displayType}</h2>
            <p className="text-sm text-muted-foreground">{formatDate(action.createdAt)}</p>
          </div>
          <Button
            onClick={() => router.push(`/historico/${action.id}`)}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
        </div>

        <div className="space-y-4 text-left overflow-y-auto flex-1 min-h-0 pr-2">
          <DetailItem label="Marca" value={action.brand?.name || 'N/A'} />

          {action.type === 'CRIAR_CONTEUDO' && (
            <>
              <DetailItem label="Plataforma" value={action.details?.platform} />
              <DetailItem label="Título Gerado" value={action.result?.title} />
              <DetailItem label="Legenda Gerada" value={<p className="font-semibold text-foreground whitespace-pre-line">{action.result?.body}</p>} />
              {action.result?.imageUrl && (
                <div className="w-full aspect-square bg-muted/50 rounded-lg flex items-center justify-center mt-4 relative">
                  <Image src={action.result.imageUrl} alt="Imagem Gerada" fill className="rounded-lg object-cover" />
                </div>
              )}
            </>
          )}

          {action.type === 'REVISAR_CONTEUDO' && (
            <>
              <DetailItem label="Feedback Gerado" value={<p className="font-semibold text-foreground whitespace-pre-line">{action.result?.feedback}</p>} />
              {action.result?.originalImage ? (
                <div className="w-full aspect-square bg-muted/50 rounded-lg flex items-center justify-center mt-4 relative">
                  <Image src={action.result.originalImage} alt="Imagem Original" fill className="rounded-lg object-cover" />
                </div>
              ) : <DetailItem label="Imagem Original" value="Não disponível" />}
            </>
          )}

          {action.type === 'PLANEJAR_CONTEUDO' && (
            <>
              <DetailItem label="Plataforma" value={action.details?.platform} />
              <DetailItem label="Quantidade" value={action.details?.quantity} />
              <div className="p-0">
                <div className="font-semibold text-foreground mb-2">Planejamento Gerado</div>
                {typeof action.result?.plan === 'string' && action.result.plan.trim().length > 0 ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-left overflow-y-auto bg-card rounded-xl border border-border/20 p-4"
                    style={{ minHeight: 200 }}
                    dangerouslySetInnerHTML={{ __html: action.result.plan }}
                  />
                ) : (
                  <div className="text-muted-foreground italic">Nenhum planejamento disponível</div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}