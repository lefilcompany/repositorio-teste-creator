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
import type { Team } from '@/types/team';
import { useAuth } from '@/hooks/useAuth';
import { useThemesRealtime } from '@/hooks/useThemesRealtime';
import { useBrandsRealtime } from '@/hooks/useBrandsRealtime';
import { toast } from 'sonner';

type ThemeFormData = Omit<StrategicTheme, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userId'>;

export default function TemasPage() {
  const { user } = useAuth();
  const { themes, loading: isLoadingThemes } = useThemesRealtime(user?.teamId);
  const { brands } = useBrandsRealtime(user?.teamId);
  const [selectedTheme, setSelectedTheme] = useState<StrategicTheme | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [themeToEdit, setThemeToEdit] = useState<StrategicTheme | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);

  useEffect(() => {
    const loadTeam = async () => {
      if (!user?.id) {
        setIsLoadingTeam(false);
        return;
      }
      try {
        const teamRes = await fetch(`/api/teams?userId=${user.id}`);
        if (teamRes.ok) {
          const teamsData: Team[] = await teamRes.json();
          const currentTeam = teamsData.find(t => t.id === user.teamId);
          if (currentTeam) setTeam(currentTeam);
        } else {
          toast.error('Erro ao carregar dados da equipe');
        }
      } catch (error) {
        toast.error('Erro de conexão ao carregar dados');
      } finally {
        setIsLoadingTeam(false);
      }
    };

    loadTeam();
  }, [user]);

  const handleOpenDialog = useCallback((theme: StrategicTheme | null = null) => {
    // Verificar limite antes de abrir o diálogo para novo tema
    if (!theme && team && typeof team.plan === 'object') {
      const planLimits = team.plan.limits;
      const currentThemesCount = themes.length;
      const maxThemes = planLimits?.themes || 3;
      
      if (currentThemesCount >= maxThemes) {
        toast.error(`Limite atingido! Seu plano ${team.plan.name} permite apenas ${maxThemes} tema${maxThemes > 1 ? 's' : ''}.`);
        return;
      }
    }
    
    setThemeToEdit(theme);
    setIsDialogOpen(true);
  }, [themes.length, team]);

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
        if (themeToEdit && selectedTheme?.id === saved.id) {
          setSelectedTheme(saved);
        }
        toast.success(themeToEdit ? 'Tema atualizado com sucesso!' : 'Tema criado com sucesso!');
      } catch (error) {
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
        setSelectedTheme(null);
        toast.success('Tema deletado com sucesso!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erro ao deletar tema');
      }
    } catch (error) {
      toast.error('Erro ao deletar tema. Tente novamente.');
    }
  }, [selectedTheme]);

  // Verificar se o limite foi atingido
  const isAtThemeLimit = team && typeof team.plan === 'object'
    ? themes.length >= (team.plan.limits?.themes || 3)
    : false;

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
            <Button 
              onClick={() => handleOpenDialog()} 
              disabled={isAtThemeLimit}
              className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
          isLoading={isLoadingThemes}
        />
        {selectedTheme && !isLoadingThemes ? (
          <ThemeDetails
            theme={selectedTheme}
            brands={brands} // Passa as marcas para os detalhes
            onEdit={handleOpenDialog}
            onDelete={handleDeleteTheme}
          />
        ) : (
          <div className="bg-card p-6 rounded-2xl border-2 border-primary/10 flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              {isLoadingThemes ? 'Carregando temas...' : 'Selecione um tema para ver os detalhes'}
            </p>
          </div>
        )}
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
