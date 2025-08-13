// app/temas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, Plus } from 'lucide-react';
import ThemeList from '@/components/temas/themeList';
import ThemeDetails from '@/components/temas/themeDetails';
import ThemeDialog from '@/components/temas/themeDialog';
import type { StrategicTheme } from '@/types/theme';
import type { Brand } from '@/types/brand';
import { useAuth } from '@/hooks/useAuth';

type ThemeFormData = Omit<StrategicTheme, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userEmail'>;

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
        }
        if (brandsRes.ok) {
          const data: Brand[] = await brandsRes.json();
          setBrands(data);
        }
      } catch (error) {
        console.error('Falha ao carregar temas ou marcas', error);
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
        if (!res.ok) throw new Error('Falha ao salvar tema');
        const saved: StrategicTheme = await res.json();
        setThemes(prev =>
          themeToEdit ? prev.map(t => (t.id === saved.id ? saved : t)) : [...prev, saved]
        );
        if (themeToEdit && selectedTheme?.id === saved.id) {
          setSelectedTheme(saved);
        }
      } catch (error) {
        console.error(error);
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
      }
    } catch (error) {
      console.error('Falha ao deletar tema', error);
    }
  }, [selectedTheme]);

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center flex-shrink-0">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <Palette className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Seus Temas Estratégicos
            </h1>
            <p className="text-muted-foreground">
              Gerencie, edite ou crie novos temas para seus projetos.
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="mt-4 md:mt-0 rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-5 text-base">
          <Plus className="mr-2 h-5 w-5" />
          Novo tema
        </Button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow overflow-hidden">
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