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
import type { Brand } from '@/types/brand';

type PersonaFormData = Omit<Persona, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userId'>;

interface PersonaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PersonaFormData) => void;
  personaToEdit: Persona | null;
  brands?: Brand[];
}

const initialFormData: PersonaFormData = {
  brandId: '',
  name: '',
  gender: '',
  age: '',
  location: '',
  role: '',
  hobbies: '',
  consumptionHabits: '',
  goals: '',
  challenges: '',
};

export default function PersonaDialog({ isOpen, onOpenChange, onSave, personaToEdit, brands = [] }: PersonaDialogProps) {
  const [formData, setFormData] = useState<PersonaFormData>(initialFormData);

  useEffect(() => {
    if (isOpen && personaToEdit) {
      setFormData({
        brandId: personaToEdit.brandId || '',
        name: personaToEdit.name || '',
        gender: personaToEdit.gender || '',
        age: personaToEdit.age || '',
        location: personaToEdit.location || '',
        role: personaToEdit.role || '',
        hobbies: personaToEdit.hobbies || '',
        consumptionHabits: personaToEdit.consumptionHabits || '',
        goals: personaToEdit.goals || '',
        challenges: personaToEdit.challenges || '',
      });
    } else {
      setFormData(initialFormData);
    }
  }, [personaToEdit, isOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    // Máscara para idade - aceita apenas números
    if (id === 'age') {
      const numericValue = value.replace(/\D/g, ''); // Remove tudo que não é dígito
      setFormData(prev => ({ ...prev, [id]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, brandId: value }));
  };

  const handleSaveClick = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const isFormValid = formData.name.trim() !== '' && formData.brandId.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{personaToEdit ? 'Editar Persona' : 'Nova Persona'}</DialogTitle>
          <DialogDescription>
            Defina o Perfil do(s) seu(s) consumidores.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-6 -mr-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
          {/* Coluna 1 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brandId">Marca</Label>
              <Select onValueChange={handleSelectChange} value={formData.brandId}>
                <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                <SelectContent>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="Escreva o nome do persona" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Idade (em anos)</Label>
              <div className="relative">
                <Input 
                  id="age" 
                  type="text"
                  value={formData.age}
                  onChange={handleInputChange} 
                  placeholder="Ex: 25 anos" 
                  className="pr-14"
                  maxLength={3}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Cargo e Formação</Label>
              <Input id="role" value={formData.role} onChange={handleInputChange} placeholder="Ex: Jornalista com formação em..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumptionHabits">Hábitos de Consumo</Label>
              <Textarea id="consumptionHabits" value={formData.consumptionHabits} onChange={handleInputChange} placeholder="Ex: ainda não conhece o nosso produto/serviço" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenges">Desafios</Label>
              <Textarea id="challenges" value={formData.challenges} onChange={handleInputChange} placeholder="Escreva os maiores desafios que o persona enfrenta" />
            </div>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Input id="gender" value={formData.gender} onChange={handleInputChange} placeholder="Ex: Masculino, Feminino" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input id="location" value={formData.location} onChange={handleInputChange} placeholder="Ex: Recife-PE" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hobbies">Hobbies e Interesses</Label>
              <Textarea id="hobbies" value={formData.hobbies} onChange={handleInputChange} placeholder="Escreva os interesses do persona. Ex: Passeios ao ar livre, yoga" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">Metas e Objetivos</Label>
              <Textarea id="goals" value={formData.goals} onChange={handleInputChange} placeholder="Escreva as metas e objetivos do persona" />
            </div>
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