'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react'; // Ícone alterado para User
import PersonaList from '@/components/personas/personaList';
import PersonaDetails from '@/components/personas/personaDetails';
import PersonaDialog from '@/components/personas/personaDialog';
import type { Persona } from '@/types/persona';

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);

  // Carrega personas do localStorage na renderização inicial
  useEffect(() => {
    try {
      const storedPersonas = localStorage.getItem('creator-personas'); // Chave atualizada
      if (storedPersonas) {
        setPersonas(JSON.parse(storedPersonas));
      }
    } catch (error) {
      console.error("Failed to load personas from localStorage", error);
    }
  }, []);

  // Salva personas no localStorage sempre que o estado mudar
  useEffect(() => {
    try {
      localStorage.setItem('creator-personas', JSON.stringify(personas)); // Chave atualizada
    } catch (error) {
      console.error("Failed to save personas to localStorage", error);
    }
  }, [personas]);

  const handleOpenDialog = useCallback((persona: Persona | null = null) => {
    setPersonaToEdit(persona);
    setIsDialogOpen(true);
  }, []);

  const handleSavePersona = useCallback((formData: { name: string; role: string }) => {
    const now = new Date().toISOString();

    if (personaToEdit) {
      const updatedPersonas = personas.map(p =>
        p.id === personaToEdit.id ? { ...p, ...formData, updatedAt: now } : p
      );
      setPersonas(updatedPersonas);
      if (selectedPersona?.id === personaToEdit.id) {
        setSelectedPersona(prev => prev ? { ...prev, ...formData, updatedAt: now } : null);
      }
    } else {
      const newPersona: Persona = {
        id: now,
        name: formData.name,
        role: formData.role,
        createdAt: now,
        updatedAt: now,
      };
      setPersonas(prevPersonas => [...prevPersonas, newPersona]);
    }
  }, [personaToEdit, personas, selectedPersona?.id]);

  const handleDeletePersona = useCallback(() => {
    if (!selectedPersona) return;
    setPersonas(personas.filter(p => p.id !== selectedPersona.id));
    setSelectedPersona(null);
  }, [selectedPersona, personas]);

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
          selectedPersona={selectedPersona}
          onSelectPersona={setSelectedPersona}
        />
        <PersonaDetails
          persona={selectedPersona}
          onEdit={handleOpenDialog}
          onDelete={handleDeletePersona}
        />
      </main>

      <PersonaDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSavePersona}
        personaToEdit={personaToEdit}
      />
    </div>
  );
}