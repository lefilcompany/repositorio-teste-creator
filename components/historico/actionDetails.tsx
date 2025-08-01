'use client';

import { History, Image as ImageIcon } from 'lucide-react';
import type { Action } from '@/types/action';
import { ACTION_STYLE_MAP } from '@/types/action';
import { cn } from '@/lib/utils';

interface ActionDetailsProps {
  action: Action | null;
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

export default function ActionDetails({ action }: ActionDetailsProps) {
  if (!action) {
    return (
      <div className="lg:col-span-1 h-full bg-card p-6 rounded-2xl border-2 border-dashed border-secondary/20 flex flex-col items-center justify-center text-center">
        <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-semibold text-foreground">Nenhuma ação selecionada</h3>
        <p className="text-muted-foreground">Selecione uma ação na lista para ver os detalhes.</p>
      </div>
    );
  }

  const style = ACTION_STYLE_MAP[action.type];
  const Icon = style.icon;

  return (
    <div className="lg:col-span-1 h-full overflow-hidden">
      <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-secondary/20 h-full flex flex-col">
        <div className="flex items-center mb-6 flex-shrink-0">
          <div className={cn("flex-shrink-0 rounded-xl w-16 h-16 flex items-center justify-center mr-4", style.background)}>
            <Icon className={cn("h-8 w-8", style.color)} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground break-words">{action.type}</h2>
            <p className="text-sm text-muted-foreground">{formatDate(action.createdAt)}</p>
          </div>
        </div>

        <div className="space-y-4 text-left overflow-y-auto flex-grow pr-2 -mr-4">
          <DetailItem label="Marca" value={action.brand || 'N/A'} />

          {action.type === 'Criar conteúdo' && (
            <>
              <DetailItem label="Plataforma" value={action.details.platform} />
              <DetailItem label="Título Gerado" value={action.result.title} />
              <DetailItem label="Legenda Gerada" value={<p className="font-semibold text-foreground whitespace-pre-line">{action.result.body}</p>} />
              {action.result.imageUrl && (
                <div className="w-full aspect-square bg-muted/50 rounded-lg flex items-center justify-center mt-4">
                  <img src={action.result.imageUrl} alt="Imagem Gerada" className="rounded-lg object-cover w-full h-full" />
                </div>
              )}
            </>
          )}

          {action.type === 'Revisar conteúdo' && (
            <>
              <DetailItem label="Feedback Gerado" value={<p className="font-semibold text-foreground whitespace-pre-line">{action.result.feedback}</p>} />
              {action.result.originalImage ? (
                <div className="w-full aspect-square bg-muted/50 rounded-lg flex items-center justify-center mt-4">
                  <img src={action.result.originalImage} alt="Imagem Original" className="rounded-lg object-cover w-full h-full" />
                </div>
              ) : <DetailItem label="Imagem Original" value="Não disponível" />}
            </>
          )}

          {action.type === 'Planejar conteúdo' && (
            <>
              <DetailItem label="Plataforma" value={action.details.platform} />
              <DetailItem label="Quantidade" value={action.details.quantity} />
              <DetailItem label="Planejamento Gerado" value={<p className="font-semibold text-foreground whitespace-pre-line">{action.result.plan}</p>} />
            </>
          )}

        </div>
      </div>
    </div>
  );
}