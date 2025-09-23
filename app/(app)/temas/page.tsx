// app/temas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Plus } from 'lucide-react';
import ThemeList from '@/components/temas/themeList';
import ThemeDetails from '@/components/temas/themeDetails';
import ThemeDialog from '@/components/temas/themeDialog';
import type { StrategicTheme, StrategicThemeSummary } from '@/types/theme';
import type { BrandSummary } from '@/types/brand';
import type { Team } from '@/types/team';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type ThemeFormData = Omit<StrategicTheme, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userId'>;

export default function TemasPage() {
  const { user } = useAuth();
  const [themes, setThemes] = useState<StrategicThemeSummary[]>([]);
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [selectedThemeSummary, setSelectedThemeSummary] = useState<StrategicThemeSummary | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<StrategicTheme | null>(null);
  const [isLoadingThemeDetails, setIsLoadingThemeDetails] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [themeToEdit, setThemeToEdit] = useState<StrategicTheme | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);

  // Carrega temas, marcas e dados da equipe via API
  useEffect(() => {
    const loadData = async () => {
      if (!user?.teamId) return;

      try {
        // Carrega temas
        const themesRes = await fetch(`/api/themes?teamId=${user.teamId}&summary=true`);
        if (themesRes.ok) {
          const themesData: StrategicThemeSummary[] = await themesRes.json();
          setThemes(themesData);
        } else {
          toast.error('Erro ao carregar temas');
        }

        // Carrega marcas
        const brandsRes = await fetch(`/api/brands?teamId=${user.teamId}&summary=true`);
        if (brandsRes.ok) {
          const brandsData: BrandSummary[] = await brandsRes.json();
          setBrands(brandsData);
        } else {
          toast.error('Erro ao carregar marcas');
        }
      } catch (error) {
        toast.error('Erro de conexão ao carregar dados');
      } finally {
        setIsLoadingThemes(false);
        setIsLoadingBrands(false);
      }
    };

    loadData();
  }, [user]);

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
    if (!theme && team && team.plan) {
      const currentThemesCount = themes.length;
      const maxThemes = team.plan?.maxStrategicThemes || 3;

      if (currentThemesCount >= maxThemes) {
        toast.error(`Limite atingido! Seu plano ${team.plan?.displayName || 'atual'} permite apenas ${maxThemes} tema${maxThemes > 1 ? 's' : ''}.`);
        return;
      }
    }

    setThemeToEdit(theme);
    setIsDialogOpen(true);
  }, [themes.length, team]);

  const handleSaveTheme = useCallback(
    async (formData: ThemeFormData) => {
      if (!user?.teamId || !user.id) {
        toast.error('Usuário não autenticado ou sem equipe');
        return;
      }

      const toastId = 'theme-operation';
      try {
        toast.loading(themeToEdit ? 'Atualizando tema...' : 'Criando tema...', { id: toastId });
      
        const method = themeToEdit ? 'PATCH' : 'POST';
        const url = themeToEdit ? `/api/themes/${themeToEdit.id}` : '/api/themes';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, teamId: user.teamId, userId: user.id }),
        });
        
        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || 'Erro ao salvar tema', { id: toastId });
          throw new Error(error.error || 'Falha ao salvar tema');
        }
        
        const saved: StrategicTheme = await res.json();
        const summary: StrategicThemeSummary = {
          id: saved.id,
          brandId: saved.brandId,
          title: saved.title,
          createdAt: saved.createdAt,
        };

        // Atualiza a lista de temas
        setThemes(prev => {
          if (themeToEdit) {
            return prev.map(theme => theme.id === summary.id ? summary : theme);
          }
          return [...prev, summary];
        });

        // Atualiza o tema selecionado se necessário
        if (themeToEdit && selectedTheme?.id === saved.id) {
          setSelectedTheme(saved);
          setSelectedThemeSummary(summary);
        } else if (!themeToEdit) {
          setSelectedTheme(saved);
          setSelectedThemeSummary(summary);
        }
        
        // Fecha o diálogo após salvar com sucesso
        setIsDialogOpen(false);
        setThemeToEdit(null);

        toast.success(
          themeToEdit ? 'Tema atualizado com sucesso!' : 'Tema criado com sucesso!',
          { id: toastId }
        );
        
        return saved;
      } catch (error) {
        toast.error('Erro ao salvar tema. Tente novamente.', { id: toastId });
        throw error;
      }
    },
    [themeToEdit, selectedTheme?.id, user]
  );

  const handleDeleteTheme = useCallback(async () => {
    if (!selectedTheme || !user?.teamId || !user?.id) {
      toast.error('Não foi possível deletar o tema. Verifique se você está logado.');
      return;
    }

    const toastId = 'theme-operation';
    try {
      toast.loading('Deletando tema...', { id: toastId });

      const res = await fetch(`/api/themes/${selectedTheme.id}?teamId=${user.teamId}&userId=${user.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Remove o tema da lista local e limpa a seleção
        setThemes(prev => prev.filter(theme => theme.id !== selectedTheme.id));
        setSelectedTheme(null);
        setSelectedThemeSummary(null);
        
        // Fecha o diálogo se estiver aberto
        setIsDialogOpen(false);
        setThemeToEdit(null);
        
        toast.success('Tema deletado com sucesso!', { id: toastId });
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erro ao deletar tema', { id: toastId });
      }
    } catch (error) {
      toast.error('Erro ao deletar tema. Tente novamente.', { id: toastId });
    }
  }, [selectedTheme, user]);

  const handleSelectTheme = useCallback(async (theme: StrategicThemeSummary) => {
    setSelectedThemeSummary(theme);
    setIsLoadingThemeDetails(true);
    try {
      const res = await fetch(`/api/themes/${theme.id}?teamId=${user?.teamId}`);
      if (res.ok) {
        const data: StrategicTheme = await res.json();
        setSelectedTheme(data);
      } else {
        toast.error('Erro ao carregar detalhes do tema');
      }
    } catch {
      toast.error('Erro de conexão ao carregar detalhes do tema');
    } finally {
      setIsLoadingThemeDetails(false);
    }
  }, [user?.teamId]);

  // Verificar se o limite foi atingido
  const isAtThemeLimit = team && team.plan
    ? themes.length >= (team.plan?.maxStrategicThemes || 3)
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
          brands={brands}
          selectedTheme={selectedThemeSummary}
          onSelectTheme={handleSelectTheme}
          isLoading={isLoadingThemes}
        />
        {selectedThemeSummary ? (
          <ThemeDetails
            theme={selectedTheme}
            brands={brands}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteTheme}
            isLoading={isLoadingThemeDetails}
          />
        ) : (
          <div className="lg:col-span-1 h-full bg-card p-6 rounded-2xl border-2 border-dashed border-secondary/20 flex flex-col items-center justify-center text-center space-y-2">
            <Palette className="h-16 w-16 text-muted-foreground/50" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-foreground">Nenhum tema selecionado</h3>
            <p className="text-muted-foreground">Selecione um tema estratégico na lista para ver os detalhes ou crie um novo.</p>
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
