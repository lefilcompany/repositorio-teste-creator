// app/temas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Plus } from 'lucide-react';
import ThemeList from '@/components/temas/themeList';
import ThemeDetails from '@/components/temas/themeDetails';
import ThemeDialog from '@/components/temas/themeDialog';
import type { StrategicTheme } from '@/types/theme';
import type { Brand } from '@/types/brand';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type ThemeFormData = Omit<StrategicTheme, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userId'>;

export default function TemasPage() {
  const { user } = useAuth();
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<StrategicTheme | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [themeToEdit, setThemeToEdit] = useState<StrategicTheme | null>(null);
  useEffect(() => {
    const load = async () => {
      if (!user?.teamId) return;
      try {
        const [themesRes, brandsRes] = await Promise.all([
          fetch(`/api/themes?teamId=${user.teamId}`),
          fetch(`/api/brands?teamId=${user.teamId}`),
        ]);
        if (themesRes.ok) {
          const data: StrategicTheme[] = await themesRes.json();
          setThemes(data);
        } else {
          toast.error('Erro ao carregar temas estratégicos');
        }
        if (brandsRes.ok) {
          const data: Brand[] = await brandsRes.json();
          setBrands(data);
        } else {
          toast.error('Erro ao carregar marcas');
        }
      } catch (error) {
        console.error('Falha ao carregar temas ou marcas', error);
        toast.error('Erro de conexão ao carregar dados');
      }
    };
    load();
  }, [user]);

  const handleOpenDialog = useCallback((theme: StrategicTheme | null = null) => {
    setThemeToEdit(theme);
    setIsDialogOpen(true);
  }, []);

  const handleSaveTheme = useCallback(
    async (formData: ThemeFormData) => {
      if (!user?.teamId || !user.id) return;
      try {
        const method = themeToEdit ? 'PATCH' : 'POST';
        const url = themeToEdit ? `/api/themes/${themeToEdit.id}` : '/api/themes';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, teamId: user.teamId, userId: user.id }),
        });
        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || 'Erro ao salvar tema');
          throw new Error('Falha ao salvar tema');
        }
        const saved: StrategicTheme = await res.json();
        setThemes(prev =>
          themeToEdit ? prev.map(t => (t.id === saved.id ? saved : t)) : [...prev, saved]
        );
        if (themeToEdit && selectedTheme?.id === saved.id) {
          setSelectedTheme(saved);
        }
        toast.success(themeToEdit ? 'Tema atualizado com sucesso!' : 'Tema criado com sucesso!');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao salvar tema. Tente novamente.');
      }
    },
    [themeToEdit, selectedTheme?.id, user]
  );

  const handleDeleteTheme = useCallback(async () => {
    if (!selectedTheme) return;
    try {
      const res = await fetch(`/api/themes/${selectedTheme.id}`, { method: 'DELETE' });
      if (res.ok) {
        setThemes(prev => prev.filter(t => t.id !== selectedTheme.id));
        setSelectedTheme(null);
        toast.success('Tema deletado com sucesso!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erro ao deletar tema');
      }
    } catch (error) {
      console.error('Falha ao deletar tema', error);
      toast.error('Erro ao deletar tema. Tente novamente.');
    }
  }, [selectedTheme]);

  return (
    <div className="min-h-full flex flex-col gap-6">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-secondary/10 text-secondary rounded-lg p-3">
                <Palette className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Seus Temas Estratégicos
                </CardTitle>
                <p className="text-muted-foreground">
                  Gerencie, edite ou crie novos temas para seus projetos.
                </p>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()} className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-5 text-base">
              <Plus className="mr-2 h-5 w-5" />
              Novo tema
            </Button>
          </div>
        </CardHeader>
      </Card>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 flex-1">
        <ThemeList
          themes={themes}
          brands={brands} // Passa as marcas para a lista
          selectedTheme={selectedTheme}
          onSelectTheme={setSelectedTheme}
        />
        <ThemeDetails
          theme={selectedTheme}
          brands={brands} // Passa as marcas para os detalhes
          onEdit={handleOpenDialog}
          onDelete={handleDeleteTheme}
        />
      </main>

      <ThemeDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveTheme}
        themeToEdit={themeToEdit}
        brands={brands} // Passa as marcas para o diálogo
      />
    </div>
  );
}