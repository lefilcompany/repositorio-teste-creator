// components/personas/personaDetails.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Users } from 'lucide-react';
import type { Persona } from '@/types/persona';
import type { Brand } from '@/types/brand';

interface PersonaDetailsProps {
  persona: Persona | null;
  onEdit: (persona: Persona) => void;
  onDelete: () => void;
  brands: Brand[];
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const DetailField = ({ label, value }: { label: string, value?: string }) => {
  if (!value) return null;
  return (
    <div className="p-3 bg-muted/50 rounded-lg break-words">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground whitespace-pre-wrap">{value}</p>
    </div>
  );
};

const ToneOfVoiceField = ({ label, value }: { label: string, value?: string }) => {
  if (!value) return null;
  const tones = value.split(', ').filter(Boolean);
  if (tones.length === 0) return null;
  
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {tones.map((tone, index) => (
          <span 
            key={index}
            className="bg-gradient-to-r from-primary/15 to-primary/5 border-2 border-primary/30 text-primary text-xs font-semibold px-2 py-1 rounded-lg"
          >
            {tone}
          </span>
        ))}
      </div>
    </div>
  );
};

const JourneyStageField = ({ label, value }: { label: string, value?: string }) => {
  if (!value) return null;
  
  const stageLabels: { [key: string]: string } = {
    discovery: 'Descoberta',
    consideration: 'Consideração',
    decision: 'Decisão'
  };
  
  const displayValue = stageLabels[value] || value;
  
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-sm text-muted-foreground">{label}</p>
      <span className="inline-block bg-secondary/20 text-secondary-foreground text-sm font-medium px-3 py-1 rounded-full mt-1">
        {displayValue}
      </span>
    </div>
  );
};

export default function PersonaDetails({ persona, onEdit, onDelete, brands }: PersonaDetailsProps) {
  if (!persona) {
    return (
      <div className="lg:col-span-1 h-full bg-card p-6 rounded-2xl border-2 border-dashed border-secondary/20 flex flex-col items-center justify-center text-center space-y-2">
        <Users className="h-16 w-16 text-muted-foreground/50" strokeWidth={1.5} />
        <h3 className="text-xl font-semibold text-foreground">Nenhuma persona selecionada</h3>
        <p className="text-muted-foreground">Selecione uma persona na lista para ver os detalhes ou crie uma nova.</p>
      </div>
    );
  }

  const wasUpdated = persona.createdAt !== persona.updatedAt;
  const brandName = brands.find(b => b.id === persona.brandId)?.name || 'Marca não encontrada';
  
  // Compatibilidade com campos antigos (caso a persona venha com a estrutura antiga)
  const personaData = {
    professionalContext: persona.professionalContext || (persona as any).role || '',
    beliefsAndInterests: persona.beliefsAndInterests || (persona as any).hobbies || '',
    contentConsumptionRoutine: persona.contentConsumptionRoutine || (persona as any).consumptionHabits || '',
    mainGoal: persona.mainGoal || (persona as any).goals || '',
    preferredToneOfVoice: persona.preferredToneOfVoice || '',
    purchaseJourneyStage: persona.purchaseJourneyStage || '',
    interestTriggers: persona.interestTriggers || '',
  };

  return (
    <div className="lg:col-span-1 max-h-[calc(100vh-16rem)] bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border-2 border-secondary/20 flex flex-col overflow-hidden">
      <div className="flex items-center mb-6 flex-shrink-0">
        <div className="bg-gradient-to-br from-secondary to-primary text-white rounded-xl w-16 h-16 flex items-center justify-center font-bold text-3xl mr-4 flex-shrink-0">
          {persona.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground break-words">{persona.name}</h2>
          <p className="text-md text-muted-foreground">Marca: {brandName}</p>
        </div>
      </div>

      <div className="overflow-y-auto pr-2 flex-1 min-h-0">
        <div className="space-y-4 text-left">
          {/* Informações Demográficas */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Informações Demográficas</h3>
            <DetailField label="Idade" value={persona.age} />
            <DetailField label="Gênero" value={persona.gender} />
            <DetailField label="Localização" value={persona.location} />
            <DetailField label="Contexto Profissional" value={personaData.professionalContext} />
          </div>

          {/* Comportamento e Preferências */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Comportamento e Preferências</h3>
            <DetailField label="Rotina de Consumo de Conteúdo" value={personaData.contentConsumptionRoutine} />
            <DetailField label="Crenças e Interesses" value={personaData.beliefsAndInterests} />
            <ToneOfVoiceField label="Tom de Voz Preferido" value={personaData.preferredToneOfVoice} />
            <JourneyStageField label="Estágio da Jornada" value={personaData.purchaseJourneyStage} />
          </div>

          {/* Objetivos e Desafios */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Objetivos e Desafios</h3>
            <DetailField label="Objetivo Principal" value={personaData.mainGoal} />
            <DetailField label="Principais Dores e Desafios" value={persona.challenges} />
            <DetailField label="Gatilhos de Interesse" value={personaData.interestTriggers} />
          </div>

          {/* Metadados */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Informações do Sistema</h3>
            <DetailField label="Data de Criação" value={formatDate(persona.createdAt)} />
            {wasUpdated && (
              <DetailField label="Última Atualização" value={formatDate(persona.updatedAt)} />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mt-6 flex-shrink-0">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full flex-1 rounded-full py-5">
              <Trash2 className="mr-2 h-4 w-4" /> Deletar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso irá deletar permanentemente a persona &quot;{persona.name}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={() => onEdit(persona)} className="w-full flex-1 rounded-full py-5">
          <Edit className="mr-2 h-4 w-4" /> Editar persona
        </Button>
      </div>
    </div>
  );
}