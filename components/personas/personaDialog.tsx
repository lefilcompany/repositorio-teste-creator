// components/personas/personaDialog.tsx
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { Persona } from '@/types/persona';
import type { Brand, BrandSummary } from '@/types/brand';
import { X, Info } from 'lucide-react';

type PersonaFormData = {
  brandId: string;
  name: string;
  age: string;
  gender: string;
  location: string;
  professionalContext: string;
  contentConsumptionRoutine: string;
  mainGoal: string;
  challenges: string;
  beliefsAndInterests: string;
  preferredToneOfVoice: string;
  purchaseJourneyStage: string;
  interestTriggers: string;
};

interface PersonaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PersonaFormData) => void;
  personaToEdit: Persona | null;
  brands?: BrandSummary[];
}

const initialFormData: PersonaFormData = {
  brandId: '',
  name: '',
  age: '',
  gender: '',
  location: '',
  professionalContext: '',
  contentConsumptionRoutine: '',
  mainGoal: '',
  challenges: '',
  beliefsAndInterests: '',
  preferredToneOfVoice: '',
  purchaseJourneyStage: '',
  interestTriggers: '',
};

const toneOptions = ['Inspirador', 'Técnico', 'Empático', 'Divertido', 'Formal', 'Casual', 'Sério', 'Otimista'];
const genderOptions = ['Masculino', 'Feminino', 'Não-binário / Outro', 'Prefiro não especificar'];
const journeyStageOptions = [
  { value: 'discovery', label: 'Descoberta' },
  { value: 'consideration', label: 'Consideração' },
  { value: 'decision', label: 'Decisão' },
];

const journeyStageDescriptions: { [key: string]: string } = {
  discovery: 'Nesta fase, a persona está aprendendo sobre um problema ou necessidade, mas ainda não conhece as soluções disponíveis.',
  consideration: 'Aqui, a persona já identificou seu problema e agora pesquisa ativamente, comparando diferentes soluções e abordagens.',
  decision: 'A persona está pronta para escolher. Ela procura a melhor oferta, marca ou produto para resolver seu problema de vez.'
};


export default function PersonaDialog({ isOpen, onOpenChange, onSave, personaToEdit, brands = [] }: PersonaDialogProps) {
  const [formData, setFormData] = useState<PersonaFormData>(initialFormData);
  const [toneList, setToneList] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && personaToEdit) {
      const existingData = {
        brandId: personaToEdit.brandId || '',
        name: personaToEdit.name || '',
        gender: personaToEdit.gender || '',
        age: personaToEdit.age || '',
        location: personaToEdit.location || '',
        professionalContext: (personaToEdit as any).professionalContext || (personaToEdit as any).role || '',
        contentConsumptionRoutine: (personaToEdit as any).contentConsumptionRoutine || (personaToEdit as any).consumptionHabits || '',
        mainGoal: (personaToEdit as any).mainGoal || (personaToEdit as any).goals || '',
        challenges: personaToEdit.challenges || '',
        beliefsAndInterests: (personaToEdit as any).beliefsAndInterests || (personaToEdit as any).hobbies || '',
        preferredToneOfVoice: (personaToEdit as any).preferredToneOfVoice || '',
        purchaseJourneyStage: (personaToEdit as any).purchaseJourneyStage || '',
        interestTriggers: (personaToEdit as any).interestTriggers || '',
      };
      setFormData(existingData);

      const tones = existingData.preferredToneOfVoice ? existingData.preferredToneOfVoice.split(', ').filter(Boolean) : [];
      setToneList(tones);

    } else {
      setFormData(initialFormData);
      setToneList([]);
    }
  }, [personaToEdit, isOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === 'age') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [id]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSelectChange = (field: keyof PersonaFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToneSelect = (tone: string) => {
    if (tone && !toneList.includes(tone)) {
      const newList = [...toneList, tone];
      setToneList(newList);
      handleSelectChange('preferredToneOfVoice', newList.join(', '));
    }
  };

  const handleToneRemove = (toneToRemove: string) => {
    const newList = toneList.filter(tone => tone !== toneToRemove);
    setToneList(newList);
    handleSelectChange('preferredToneOfVoice', newList.join(', '));
  };

  const handleSaveClick = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const isFormValid =
    formData.brandId.trim() !== '' &&
    formData.name.trim() !== '' &&
    formData.mainGoal.trim() !== '' &&
    formData.challenges.trim() !== '' &&
    toneList.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{personaToEdit ? 'Editar Persona' : 'Nova Persona'}</DialogTitle>
          <DialogDescription>
            Defina o perfil estratégico do seu consumidor ideal para criar comunicações mais eficazes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-6 -mr-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4">

          <div className="space-y-2">
            <Label htmlFor="brandId">Marca <span className="text-red-500">*</span></Label>
            <Select onValueChange={(value) => handleSelectChange('brandId', value)} value={formData.brandId}>
              <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
              <SelectContent>
                {brands.map(brand => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Persona <span className="text-red-500">*</span></Label>
            <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: Mariana Inovadora" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Idade</Label>
            <Input id="age" type="text" value={formData.age} onChange={handleInputChange} placeholder="Ex: 32" maxLength={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gênero</Label>
            <Select onValueChange={(value) => handleSelectChange('gender', value)} value={formData.gender}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {genderOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Localização</Label>
            <Input id="location" value={formData.location} onChange={handleInputChange} placeholder="Ex: Recife, PE" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="professionalContext">Contexto Profissional</Label>
            <Input id="professionalContext" value={formData.professionalContext} onChange={handleInputChange} placeholder="Ex: Gerente de Marketing em uma startup" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toneOfVoice">Tom de Voz <span className="text-red-500">*</span> (escolha um ou mais)</Label>
            <Select onValueChange={handleToneSelect} value="">
              <SelectTrigger><SelectValue placeholder="Escolha como sua marca deve se comunicar" /></SelectTrigger>
              <SelectContent>
                {toneOptions.map(option => (
                  <SelectItem key={option} value={option} disabled={toneList.includes(option)}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 min-h-[50px] p-3 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 mt-3">
              {toneList.length === 0 ? (
                <span className="text-sm text-muted-foreground italic self-center">Os tons de voz que você escolher aparecerão aqui.</span>
              ) : (
                toneList.map(tone => (
                  <div key={tone} className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 border-2 border-primary/30 text-primary text-sm font-semibold px-3 py-1.5 rounded-xl">
                    {tone}
                    <button onClick={() => handleToneRemove(tone)} className="ml-1 text-primary hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-destructive/10" aria-label={`Remover tom ${tone}`}>
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseJourneyStage">Estágio da Jornada</Label>
            <Select onValueChange={(value) => handleSelectChange('purchaseJourneyStage', value)} value={formData.purchaseJourneyStage}>
              <SelectTrigger><SelectValue placeholder="Selecione o estágio da persona" /></SelectTrigger>
              <SelectContent>
                {journeyStageOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3 min-h-[50px] p-3 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 mt-3">
              <Info size={18} className="text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                {formData.purchaseJourneyStage
                  ? journeyStageDescriptions[formData.purchaseJourneyStage]
                  : 'Selecione um estágio acima para ver a descrição detalhada.'}
              </span>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="mainGoal">Objetivo Principal <span className="text-red-500">*</span></Label>
            <Textarea id="mainGoal" value={formData.mainGoal} onChange={handleInputChange} placeholder="O que essa persona busca? (Ex: Otimizar seu tempo, gerar mais leads)" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="challenges">Principais Dores e Desafios <span className="text-red-500">*</span></Label>
            <Textarea id="challenges" value={formData.challenges} onChange={handleInputChange} placeholder="Quais problemas ou frustrações ela enfrenta? (Ex: Sente-se sobrecarregada, dificuldade em provar ROI)" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="contentConsumptionRoutine">Rotina de Consumo de Conteúdo</Label>
            <Textarea id="contentConsumptionRoutine" value={formData.contentConsumptionRoutine} onChange={handleInputChange} placeholder="Plataforma, horário, formato preferido... (Ex: Ouve podcasts no trânsito, lê newsletters de IA, usa LinkedIn para networking)" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beliefsAndInterests">Crenças e Interesses</Label>
            <Textarea
              id="beliefsAndInterests"
              value={formData.beliefsAndInterests}
              onChange={handleInputChange}
              placeholder="Quais princípios guiam suas decisões? Ex: Valoriza a eficiência, acredita em dados (e não em opiniões) e se interessa por novas IAs."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestTriggers">Gatilhos de Interesse</Label>
            <Textarea
              id="interestTriggers"
              value={formData.interestTriggers}
              onChange={handleInputChange}
              placeholder="Que tipo de conteúdo ou chamada atrai sua atenção? Ex: '5 dicas para...', 'O erro que todos cometem em...'"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSaveClick} disabled={!isFormValid}>
            {personaToEdit ? 'Salvar Alterações' : 'Criar Persona'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}