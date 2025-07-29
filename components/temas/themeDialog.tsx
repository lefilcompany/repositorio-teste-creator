// components/temas/ThemeDialog.tsx
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
import type { StrategicTheme } from '@/types/theme';

interface ThemeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; responsible: string }) => void;
  themeToEdit: StrategicTheme | null;
}

export default function ThemeDialog({ isOpen, onOpenChange, onSave, themeToEdit }: ThemeDialogProps) {
  const [formData, setFormData] = useState({ name: '', responsible: '' });

  useEffect(() => {
    if (themeToEdit) {
      setFormData({ name: themeToEdit.name, responsible: themeToEdit.responsible });
    } else {
      setFormData({ name: '', responsible: '' });
    }
  }, [themeToEdit, isOpen]);

  const handleSaveClick = () => {
    onSave(formData);
    onOpenChange(false);
  };
  
  const isFormValid = formData.name.trim() !== '' && formData.responsible.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{themeToEdit ? 'Editar Tema' : 'Criar Novo Tema'}</DialogTitle>
          <DialogDescription>
            {themeToEdit ? 'Altere as informações do seu tema.' : 'Preencha os campos abaixo para adicionar um novo tema.'}
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
              placeholder="Ex: Expansão de Mercado"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="responsible" className="text-right">Responsável</Label>
            <Input
              id="responsible"
              value={formData.responsible}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              className="col-span-3"
              placeholder="Ex: Equipe de Estratégia"
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