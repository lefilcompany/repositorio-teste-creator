// components/temas/ThemeDetails.tsx
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
import { Edit, Trash2, Palette } from 'lucide-react'; // Changed icon to Target
import type { StrategicTheme } from '@/types/theme';

interface ThemeDetailsProps {
  theme: StrategicTheme | null;
  onEdit: (theme: StrategicTheme) => void;
  onDelete: () => void;
}

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};


export default function ThemeDetails({ theme, onEdit, onDelete }: ThemeDetailsProps) {
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

  return (
    <div className="lg:col-span-1 h-full">
      <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-secondary/20 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-br from-secondary to-primary text-white rounded-xl w-16 h-16 flex items-center justify-center font-bold text-3xl mr-4">
              {theme.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-foreground break-words">{theme.name}</h2>
          </div>
          <div className="space-y-4 text-left">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Responsável</p>
              <p className="font-semibold text-foreground">{theme.responsible}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Data de Criação</p>
              <p className="font-semibold text-foreground">{formatDate(theme.createdAt)}</p>
            </div>
            {wasUpdated && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Última Atualização</p>
                <p className="font-semibold text-foreground">{formatDate(theme.updatedAt)}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3 mt-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full flex-1 rounded-full hover:bg-destructive hover:border-destructive py-5">
                <Trash2 className="mr-2 h-4 w-4" /> Deletar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita. Isso irá deletar permanentemente o tema "{theme.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => onEdit(theme)} className="w-full flex-1 rounded-full bg-accent hover:bg-accent/80 py-5">
            <Edit className="mr-2 h-4 w-4" /> Editar tema
          </Button>
        </div>
      </div>
    </div>
  );
}