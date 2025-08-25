// components/personas/personaList.tsx
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Persona } from '@/types/persona';
import type { Brand } from '@/types/brand';

interface PersonaListProps {
  personas: Persona[];
  brands: Brand[];
  selectedPersona: Persona | null;
  onSelectPersona: (persona: Persona) => void;
  isLoading?: boolean;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

// Componente de skeleton para personas
const PersonaSkeleton = () => (
  <div className="w-full p-4 rounded-lg border-2 border-transparent bg-muted/50 flex items-center justify-between">
    <div className="flex items-center">
      <Skeleton className="w-10 h-10 rounded-lg mr-4" />
      <div>
        <Skeleton className="h-5 w-28 mb-2" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
    <Skeleton className="h-4 w-24 hidden md:block" />
  </div>
);

export default function PersonaList({ personas, brands, selectedPersona, onSelectPersona, isLoading = false }: PersonaListProps) {
  const sortedPersonas = useMemo(() => {
    // Adiciona uma verificação para garantir que persona.name existe antes de ordenar
    return [...personas].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [personas]);

  const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);

  return (
    <div className="lg:col-span-2 bg-card p-4 md:p-6 rounded-2xl border-2 border-primary/10 flex flex-col max-h-[calc(100vh-16rem)] overflow-hidden">
      <h2 className="text-2xl font-semibold text-foreground mb-4 px-2 flex-shrink-0">Todas as personas</h2>
      <div className="overflow-y-auto pr-2 flex-1 min-h-0">
        {isLoading ? (
          <ul className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <PersonaSkeleton />
              </li>
            ))}
          </ul>
        ) : sortedPersonas.length > 0 ? (
          <ul className="space-y-3">
            {sortedPersonas.map((persona) => (
              <li key={persona.id}>
                <button
                  onClick={() => onSelectPersona(persona)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between",
                    selectedPersona?.id === persona.id
                      ? "bg-primary/10 border-primary shadow-md"
                      : "bg-muted/50 border-transparent hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-lg w-10 h-10 flex items-center justify-center font-bold text-xl mr-4">
                      {/* Adiciona uma verificação para evitar erro se o nome for nulo */}
                      {(persona.name || ' ').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-foreground">{persona.name}</p>
                      <p className="text-sm text-muted-foreground">Marca: {brandMap.get(persona.brandId) || 'Não definida'}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground hidden md:block">
                    Criado em: {formatDate(persona.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma persona encontrada
          </div>
        )}
      </div>
    </div>
  );
}