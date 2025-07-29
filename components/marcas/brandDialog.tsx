// components/marcas/BrandDialog.tsx
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
import type { Brand } from '@/types/brand';

interface BrandDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; responsible: string }) => void;
  brandToEdit: Brand | null;
}

export default function BrandDialog({ isOpen, onOpenChange, onSave, brandToEdit }: BrandDialogProps) {
  const [formData, setFormData] = useState({ name: '', responsible: '' });

  useEffect(() => {
    if (brandToEdit) {
      setFormData({ name: brandToEdit.name, responsible: brandToEdit.responsible });
    } else {
      setFormData({ name: '', responsible: '' });
    }
  }, [brandToEdit, isOpen]);

  const handleSaveClick = () => {
    onSave(formData);
    onOpenChange(false);
  };
  
  const isFormValid = formData.name.trim() !== '' && formData.responsible.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{brandToEdit ? 'Editar Marca' : 'Criar Nova Marca'}</DialogTitle>
          <DialogDescription>
            {brandToEdit ? 'Altere as informações da sua marca.' : 'Preencha os campos abaixo para adicionar uma nova marca.'}
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
              placeholder="Ex: TecNova Soluções"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="responsible" className="text-right">Responsável</Label>
            <Input
              id="responsible"
              value={formData.responsible}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              className="col-span-3"
              placeholder="Ex: Paulo"
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