// app/personas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users } from 'lucide-react';
import PersonaList from '@/components/personas/personaList';
import PersonaDetails from '@/components/personas/personaDetails';
import PersonaDialog from '@/components/personas/personaDialog';
import type { Persona } from '@/types/persona';
import type { Brand } from '@/types/brand';
import type { Team } from '@/types/team';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type PersonaFormData = Omit<Persona, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userId'>;

export default function PersonasPage() {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(true);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  
  useEffect(() => {
    const load = async () => {
      if (!user?.teamId) return;
      
      try {
        // Load personas
        const personasRes = await fetch(`/api/personas?teamId=${user.teamId}`);
        if (personasRes.ok) {
          const data: Persona[] = await personasRes.json();
          setPersonas(data);
        } else {
          toast.error('Erro ao carregar personas');
        }
      } catch (error) {
        toast.error('Erro de conexão ao carregar personas');
      } finally {
        setIsLoadingPersonas(false);
      }
    };
    
    load();
  }, [user]);

  useEffect(() => {
    const loadBrandsAndTeam = async () => {
      if (!user?.teamId) return;
      
      try {
        const [brandsRes, teamRes] = await Promise.all([
          fetch(`/api/brands?teamId=${user.teamId}`),
          fetch(`/api/teams?userId=${user.id}`)
        ]);
        
        if (brandsRes.ok) {
          const data: Brand[] = await brandsRes.json();
          setBrands(data);
        } else {
          toast.error('Erro ao carregar marcas');
        }

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
    
    loadBrandsAndTeam();
  }, [user]);

  const handleOpenDialog = useCallback((persona: Persona | null = null) => {
    // Verificar limite antes de abrir o diálogo para nova persona
    if (!persona && team && typeof team.plan === 'object') {
      const planLimits = team.plan.limits;
      const currentPersonasCount = personas.length;
      const maxPersonas = planLimits?.personas || 2;
      
      if (currentPersonasCount >= maxPersonas) {
        toast.error(`Limite atingido! Seu plano ${team.plan.name} permite apenas ${maxPersonas} persona${maxPersonas > 1 ? 's' : ''}.`);
        return;
      }
    }
    
    setPersonaToEdit(persona);
    setIsDialogOpen(true);
  }, [personas.length, team]);

  const handleSavePersona = useCallback(
    async (formData: PersonaFormData) => {
      if (!user?.teamId || !user.id) return;
      try {
        const method = personaToEdit ? 'PATCH' : 'POST';
        const url = personaToEdit ? `/api/personas/${personaToEdit.id}` : '/api/personas';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, teamId: user.teamId, userId: user.id }),
        });
        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || 'Erro ao salvar persona');
          throw new Error('Falha ao salvar persona');
        }
        const saved: Persona = await res.json();
        setPersonas(prev =>
          personaToEdit ? prev.map(p => (p.id === saved.id ? saved : p)) : [...prev, saved]
        );
        if (personaToEdit && selectedPersona?.id === saved.id) {
          setSelectedPersona(saved);
        }
        toast.success(personaToEdit ? 'Persona atualizada com sucesso!' : 'Persona criada com sucesso!');
      } catch (error) {
        toast.error('Erro ao salvar persona. Tente novamente.');
      }
    },
    [personaToEdit, selectedPersona?.id, user]
  );

  const handleDeletePersona = useCallback(async () => {
    if (!selectedPersona) return;
    try {
      const res = await fetch(`/api/personas/${selectedPersona.id}`, { method: 'DELETE' });
      if (res.ok) {
        setPersonas(prev => prev.filter(p => p.id !== selectedPersona.id));
        setSelectedPersona(null);
        toast.success('Persona deletada com sucesso!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erro ao deletar persona');
      }
    } catch (error) {
      toast.error('Erro ao deletar persona. Tente novamente.');
    }
  }, [selectedPersona]);

  // Verificar se o limite foi atingido
  const isAtPersonaLimit = team && typeof team.plan === 'object' 
    ? personas.length >= (team.plan.limits?.personas || 2)
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
          selectedPersona={selectedPersona}
          onSelectPersona={setSelectedPersona}
          isLoading={isLoadingPersonas}
        />
        {selectedPersona && !isLoadingPersonas ? (
          <PersonaDetails
            persona={selectedPersona}
            brands={brands}
            onEdit={handleOpenDialog}
            onDelete={handleDeletePersona}
          />
        ) : (
          <div className="bg-card p-6 rounded-2xl border-2 border-primary/10 flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              {isLoadingPersonas ? 'Carregando personas...' : 'Selecione uma persona para ver os detalhes'}
            </p>
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
