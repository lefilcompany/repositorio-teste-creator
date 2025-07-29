'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface PersonaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; role: string }) => void;
  personaToEdit: Persona | null;
}

export default function PersonaDialog({ isOpen, onOpenChange, onSave, personaToEdit }: PersonaDialogProps) {
  const [formData, setFormData] = useState({ name: '', role: '' });

  useEffect(() => {
    if (personaToEdit) {
      setFormData({ name: personaToEdit.name, role: personaToEdit.role });
    } else {
      setFormData({ name: '', role: '' });
    }
  }, [personaToEdit, isOpen]);

  const handleSaveClick = () => {
    onSave(formData);
    onOpenChange(false);
  };
  
  const isFormValid = formData.name.trim() !== '' && formData.role.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{personaToEdit ? 'Editar Persona' : 'Criar Nova Persona'}</DialogTitle>
          <DialogDescription>
            {personaToEdit ? 'Altere as informações da sua persona.' : 'Preencha os campos abaixo para adicionar uma nova persona.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
              placeholder="Ex: Ana Silva"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Papel</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="col-span-3"
              placeholder="Ex: Gerente de Produto"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSaveClick} disabled={!isFormValid}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}