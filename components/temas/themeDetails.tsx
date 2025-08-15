'use client';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Palette } from 'lucide-react';
import type { StrategicTheme } from '@/types/theme';
import type { Brand } from '@/types/brand';

interface ThemeDetailsProps {
  theme: StrategicTheme | null;
  onEdit: (theme: StrategicTheme) => void;
  onDelete: () => void;
  brands: Brand[]; // Recebe as marcas para encontrar o nome
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const DetailField = ({ label, value }: { label: string, value?: string }) => {
  if (!value) return null;
  return (
    <div className="p-3 bg-muted/50 rounded-lg break-words">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground whitespace-pre-wrap">{value}</p>
    </div>
  );
};

export default function ThemeDetails({ theme, onEdit, onDelete, brands }: ThemeDetailsProps) {
  if (!theme) {
    return (
      <div className="lg:col-span-1 h-full bg-card p-6 rounded-2xl border-2 border-dashed border-secondary/20 flex flex-col items-center justify-center text-center">
        <Palette className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-semibold text-foreground">Nenhum tema selecionado</h3>
        <p className="text-muted-foreground">Selecione um tema na lista para ver os detalhes ou crie um novo.</p>
      </div>
    );
  }

  const wasUpdated = theme.createdAt !== theme.updatedAt;
  const brandName = brands.find(b => b.id === theme.brandId)?.name || 'Marca não encontrada';

  return (
    <div className="lg:col-span-1 max-h-[calc(100vh-16rem)] bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border-2 border-secondary/20 flex flex-col overflow-hidden">
      <div className="flex items-center mb-6 flex-shrink-0">
        <div className="bg-gradient-to-br from-secondary to-primary text-white rounded-xl w-16 h-16 flex items-center justify-center font-bold text-3xl mr-4 flex-shrink-0">
          {theme.title.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground break-words">{theme.title}</h2>
          <p className="text-md text-muted-foreground">Marca: {brandName}</p>
        </div>
      </div>

      <div className="overflow-y-auto pr-2 flex-1 min-h-0">
        <div className="space-y-4 text-left">
          <DetailField label="Descrição" value={theme.description} />
          <DetailField label="Paleta de Cores" value={theme.colorPalette} />
          <DetailField label="Tom de Voz" value={theme.toneOfVoice} />
          <DetailField label="Universo-Alvo" value={theme.targetAudience} />
          <DetailField label="Hashtags" value={theme.hashtags} />
          <DetailField label="Objetivos" value={theme.objectives} />
          <DetailField label="Formato dos Conteúdos" value={theme.contentFormat} />
          <DetailField label="Macro-Temas" value={theme.macroThemes} />
          <DetailField label="Melhores Formatos" value={theme.bestFormats} />
          <DetailField label="Plataformas" value={theme.platforms} />
          <DetailField label="Ação Esperada" value={theme.expectedAction} />
          <DetailField label="Informações Adicionais" value={theme.additionalInfo} />
          <DetailField label="Data de Criação" value={formatDate(theme.createdAt)} />
          {wasUpdated && (
            <DetailField label="Última Atualização" value={formatDate(theme.updatedAt)} />
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mt-6 flex-shrink-0">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full flex-1 rounded-full py-5">
              <Trash2 className="mr-2 h-4 w-4" /> Deletar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso irá deletar permanentemente o tema &quot;{theme.title}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={() => onEdit(theme)} className="w-full flex-1 rounded-full py-5">
          <Edit className="mr-2 h-4 w-4" /> Editar tema
        </Button>
      </div>
    </div>
  );
}