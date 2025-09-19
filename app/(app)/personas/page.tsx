// app/personas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users } from 'lucide-react';
import PersonaList from '@/components/personas/personaList';
import PersonaDetails from '@/components/personas/personaDetails';
import PersonaDialog from '@/components/personas/personaDialog';
import type { Persona, PersonaSummary } from '@/types/persona';
import type { BrandSummary } from '@/types/brand';
import type { Team } from '@/types/team';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type PersonaFormData = Omit<Persona, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userId'>;

export default function PersonasPage() {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [selectedPersonaSummary, setSelectedPersonaSummary] = useState<PersonaSummary | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isLoadingPersonaDetails, setIsLoadingPersonaDetails] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);

  // Carrega personas, marcas e dados da equipe via API
  useEffect(() => {
    const loadData = async () => {
      if (!user?.teamId) return;

      try {
        // Carrega personas
        const personasRes = await fetch(`/api/personas?teamId=${user.teamId}&summary=true`);
        if (personasRes.ok) {
          const personasData: PersonaSummary[] = await personasRes.json();
          setPersonas(personasData);
        } else {
          toast.error('Erro ao carregar personas');
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
        setIsLoadingPersonas(false);
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

  const handleOpenDialog = useCallback((persona: Persona | null = null) => {
    // Verificar limite antes de abrir o diálogo para nova persona
    if (!persona && team && team.plan) {
      const currentPersonasCount = personas.length;
      const maxPersonas = team.plan.maxPersonas || 2;

      if (currentPersonasCount >= maxPersonas) {
        toast.error(`Limite atingido! Seu plano ${team.plan.displayName} permite apenas ${maxPersonas} persona${maxPersonas > 1 ? 's' : ''}.`);
        return;
      }
    }

    setPersonaToEdit(persona);
    setIsDialogOpen(true);
  }, [personas.length, team]);

  const handleSavePersona = useCallback(async (formData: PersonaFormData) => {
    if (!user?.teamId || !user.id) {
      toast.error('Usuário não autenticado ou sem equipe');
      return;
    }

    const toastId = 'persona-operation';
    try {
      toast.loading(personaToEdit ? 'Atualizando persona...' : 'Criando persona...', { id: toastId });
      
      const method = personaToEdit ? 'PATCH' : 'POST';
      const url = personaToEdit ? `/api/personas/${personaToEdit.id}` : '/api/personas';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, teamId: user.teamId, userId: user.id }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Erro ao salvar persona', { id: toastId });
        throw new Error(error.error || 'Falha ao salvar persona');
      }
      
      const saved: Persona = await res.json();

      const summary: PersonaSummary = {
        id: saved.id,
        brandId: saved.brandId,
        name: saved.name,
        createdAt: saved.createdAt,
      };

      // Atualiza a lista de personas
      setPersonas(prev => {
        if (personaToEdit) {
          return prev.map(persona => persona.id === summary.id ? summary : persona);
        }
        return [...prev, summary];
      });

      // Atualiza a persona selecionada se necessário
      if (personaToEdit && selectedPersona?.id === saved.id) {
        setSelectedPersona(saved);
        setSelectedPersonaSummary(summary);
      } else if (!personaToEdit) {
        setSelectedPersona(saved);
        setSelectedPersonaSummary(summary);
      }
      
      // Fecha o diálogo após salvar com sucesso
      setIsDialogOpen(false);
      setPersonaToEdit(null);

      toast.success(
        personaToEdit ? 'Persona atualizada com sucesso!' : 'Persona criada com sucesso!',
        { id: toastId }
      );
    } catch (error) {
      toast.error('Erro ao salvar persona. Tente novamente.');
    }
  },
    [personaToEdit, selectedPersona?.id, user]
  );

  const handleDeletePersona = useCallback(async () => {
    if (!selectedPersona || !user?.teamId || !user?.id) {
      toast.error('Não foi possível deletar a persona. Verifique se você está logado.');
      return;
    }

    const toastId = 'persona-operation';
    try {
      toast.loading('Deletando persona...', { id: toastId });

      const res = await fetch(`/api/personas/${selectedPersona.id}?teamId=${user.teamId}&userId=${user.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Remove a persona da lista local e limpa a seleção
        setPersonas(prev => prev.filter(persona => persona.id !== selectedPersona.id));
        setSelectedPersona(null);
        setSelectedPersonaSummary(null);
        
        // Fecha o diálogo se estiver aberto
        setIsDialogOpen(false);
        setPersonaToEdit(null);
        
        toast.success('Persona deletada com sucesso!', { id: toastId });
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erro ao deletar persona', { id: toastId });
      }
    } catch (error) {
      toast.error('Erro ao deletar persona. Tente novamente.', { id: toastId });
    }
  }, [selectedPersona, user]);

  const handleSelectPersona = useCallback(async (persona: PersonaSummary) => {
    setSelectedPersonaSummary(persona);
    setIsLoadingPersonaDetails(true);
    try {
      const res = await fetch(`/api/personas/${persona.id}?teamId=${user?.teamId}`);
      if (res.ok) {
        const data: Persona = await res.json();
        setSelectedPersona(data);
      } else {
        toast.error('Erro ao carregar detalhes da persona');
      }
    } catch {
      toast.error('Erro de conexão ao carregar detalhes da persona');
    } finally {
      setIsLoadingPersonaDetails(false);
    }
  }, [user?.teamId]);

  // Verificar se o limite foi atingido
  const isAtPersonaLimit = team && team.plan
    ? personas.length >= (team.plan.maxPersonas || 2)
    : false;

  return (
    <div className="min-h-full flex flex-col gap-6">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Suas Personas
                </CardTitle>
                <p className="text-muted-foreground">
                  Gerencie, edite ou crie novas personas para seus projetos.
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              disabled={isAtPersonaLimit}
              className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nova persona
            </Button>
          </div>
        </CardHeader>
      </Card>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 flex-1">
        <PersonaList
          personas={personas}
          brands={brands}
          selectedPersona={selectedPersonaSummary}
          onSelectPersona={handleSelectPersona}
          isLoading={isLoadingPersonas}
        />
        {selectedPersonaSummary ? (
          <PersonaDetails
            persona={selectedPersona}
            brands={brands}
            onEdit={handleOpenDialog}
            onDelete={handleDeletePersona}
            isLoading={isLoadingPersonaDetails}
          />
        ) : (
          <div className="lg:col-span-1 h-full bg-card p-6 rounded-2xl border-2 border-dashed border-secondary/20 flex flex-col items-center justify-center text-center space-y-2">
            <Users className="h-16 w-16 text-muted-foreground/50" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-foreground">Nenhuma persona selecionada</h3>
            <p className="text-muted-foreground">Selecione uma persona na lista para ver os detalhes ou crie uma nova.</p>
          </div>
        )}
      </main>

      <PersonaDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSavePersona}
        personaToEdit={personaToEdit}
        brands={brands}
      />
    </div>
  );
}
