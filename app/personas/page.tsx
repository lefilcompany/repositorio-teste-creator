// app/personas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import PersonaList from '@/components/personas/personaList';
import PersonaDetails from '@/components/personas/personaDetails';
import PersonaDialog from '@/components/personas/personaDialog';
import type { Persona } from '@/types/persona';

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  // **NOVO ESTADO:** Controla se os dados já foram carregados do localStorage
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);

  // Efeito para carregar os dados do localStorage APENAS UMA VEZ
  useEffect(() => {
    try {
      const storedPersonas = localStorage.getItem('creator-personas');
      if (storedPersonas) {
        setPersonas(JSON.parse(storedPersonas));
      }
    } catch (error) {
      console.error("Failed to load personas from localStorage", error);
    } finally {
      // **NOVO:** Marca que o carregamento inicial foi concluído
      setIsLoaded(true);
    }
  }, []); // Array de dependências vazio para rodar apenas na montagem

  // Efeito para SALVAR os dados, agora com uma guarda
  useEffect(() => {
    // **CORREÇÃO CRÍTICA:** Só salva no localStorage se o carregamento inicial já ocorreu.
    if (isLoaded) {
      try {
        localStorage.setItem('creator-personas', JSON.stringify(personas));
      } catch (error) {
        console.error("Failed to save personas to localStorage", error);
      }
    }
  }, [personas, isLoaded]); // Roda sempre que 'personas' ou 'isLoaded' mudar

  const handleOpenDialog = useCallback((persona: Persona | null = null) => {
    setPersonaToEdit(persona);
    setIsDialogOpen(true);
  }, []);

  // Funções de salvar e deletar atualizadas para usar a forma funcional de 'setPersonas'
  const handleSavePersona = useCallback((formData: { name: string; role: string }) => {
    const now = new Date().toISOString();
    setPersonas(prevPersonas => {
      if (personaToEdit) {
        const updatedPersonas = prevPersonas.map(p =>
          p.id === personaToEdit.id ? { ...p, ...formData, updatedAt: now } : p
        );
        if (selectedPersona?.id === personaToEdit.id) {
          setSelectedPersona(prev => prev ? { ...prev, ...formData, updatedAt: now } : null);
        }
        return updatedPersonas;
      } else {
        const newPersona: Persona = {
          id: now,
          name: formData.name,
          role: formData.role,
          createdAt: now,
          updatedAt: now,
        };
        return [...prevPersonas, newPersona];
      }
    });
  }, [personaToEdit, selectedPersona?.id]);

  const handleDeletePersona = useCallback(() => {
    if (!selectedPersona) return;
    setPersonas(prevPersonas => prevPersonas.filter(p => p.id !== selectedPersona.id));
    setSelectedPersona(null);
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