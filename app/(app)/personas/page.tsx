// app/personas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import PersonaList from '@/components/personas/personaList';
import PersonaDetails from '@/components/personas/personaDetails';
import PersonaDialog from '@/components/personas/personaDialog';
import type { Persona } from '@/types/persona';
import type { Brand } from '@/types/brand';
import { useAuth } from '@/hooks/useAuth';

type PersonaFormData = Omit<Persona, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userId'>;

export default function PersonasPage() {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);
  useEffect(() => {
    const load = async () => {
      if (!user?.teamId) return;
      try {
        const [personasRes, brandsRes] = await Promise.all([
          fetch(`/api/personas?teamId=${user.teamId}`),
          fetch(`/api/brands?teamId=${user.teamId}`),
        ]);
        if (personasRes.ok) {
          const data: Persona[] = await personasRes.json();
          setPersonas(data);
        }
        if (brandsRes.ok) {
          const data: Brand[] = await brandsRes.json();
          setBrands(data);
        }
      } catch (error) {
        console.error('Falha ao carregar personas ou marcas', error);
      }
    };
    load();
  }, [user]);

  const handleOpenDialog = useCallback((persona: Persona | null = null) => {
    setPersonaToEdit(persona);
    setIsDialogOpen(true);
  }, []);

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
        if (!res.ok) throw new Error('Falha ao salvar persona');
        const saved: Persona = await res.json();
        setPersonas(prev =>
          personaToEdit ? prev.map(p => (p.id === saved.id ? saved : p)) : [...prev, saved]
        );
        if (personaToEdit && selectedPersona?.id === saved.id) {
          setSelectedPersona(saved);
        }
      } catch (error) {
        console.error(error);
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
      }
    } catch (error) {
      console.error('Falha ao deletar persona', error);
    }
  }, [selectedPersona]);

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center flex-shrink-0">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Suas Personas
            </h1>
            <p className="text-muted-foreground">
              Gerencie, edite ou crie novas personas para seus projetos.
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="mt-4 md:mt-0 rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-5 text-base">
          <Plus className="mr-2 h-5 w-5" />
          Nova persona
        </Button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow overflow-hidden">
        <PersonaList
          personas={personas}
          brands={brands}
          selectedPersona={selectedPersona}
          onSelectPersona={setSelectedPersona}
        />
        <PersonaDetails
          persona={selectedPersona}
          brands={brands}
          onEdit={handleOpenDialog}
          onDelete={handleDeletePersona}
        />
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