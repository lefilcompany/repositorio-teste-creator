// components/marcas/BrandDialog.tsx
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { Brand, MoodboardFile } from '@/types/brand';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/types/team';
import type { User } from '@/types/user';

type BrandFormData = Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userEmail'>;

interface BrandDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BrandFormData) => void;
  brandToEdit: Brand | null;
}

const initialFormData: BrandFormData = {
  name: '',
  responsible: '',
  segment: '',
  values: '',
  keywords: '',
  goals: '',
  inspirations: '',
  successMetrics: '',
  references: '',
  specialDates: '',
  sectorRestrictions: '',
  promise: '',
  crisisInfo: '',
  milestones: '',
  collaborations: '',
  restrictions: '',
  moodboard: null, // O valor inicial agora é nulo
};

export default function BrandDialog({ isOpen, onOpenChange, onSave, brandToEdit }: BrandDialogProps) {
  const [formData, setFormData] = useState<BrandFormData>(initialFormData);
  const { user } = useAuth();
  const [members, setMembers] = useState<{ email: string; name: string }[]>([]);

  useEffect(() => {
    if (isOpen && brandToEdit) {
      setFormData({
        name: brandToEdit.name,
        responsible: brandToEdit.responsible,
        segment: brandToEdit.segment || '',
        values: brandToEdit.values || '',
        keywords: brandToEdit.keywords || '',
        goals: brandToEdit.goals || '',
        inspirations: brandToEdit.inspirations || '',
        successMetrics: brandToEdit.successMetrics || '',
        references: brandToEdit.references || '',
        specialDates: brandToEdit.specialDates || '',
        sectorRestrictions: brandToEdit.sectorRestrictions || '',
        promise: brandToEdit.promise || '',
        crisisInfo: brandToEdit.crisisInfo || '',
        milestones: brandToEdit.milestones || '',
        collaborations: brandToEdit.collaborations || '',
        restrictions: brandToEdit.restrictions || '',
        moodboard: brandToEdit.moodboard || null,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [brandToEdit, isOpen]);

  useEffect(() => {
    if (isOpen && user?.teamId) {
      const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
      const users = JSON.parse(localStorage.getItem('creator-users') || '[]') as User[];
      const team = teams.find(t => t.id === user.teamId);
      if (team) {
        const data = team.members.map(email => {
          const u = users.find(us => us.email === email);
          return { email, name: u?.name || email };
        });
        setMembers(data);
      }
    }
  }, [isOpen, user]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // **ATUALIZADO:** Lê o arquivo e armazena um objeto com nome, tipo e conteúdo
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newFile: MoodboardFile = {
          name: file.name,
          type: file.type,
          content: reader.result as string,
        };
        setFormData(prev => ({ ...prev, moodboard: newFile }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, moodboard: null }));
    }
  }

  const handleSaveClick = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const isFormValid = formData.name.trim() !== '' && formData.responsible.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{brandToEdit ? 'Editar Marca' : 'Criar Nova Marca'}</DialogTitle>
          <DialogDescription>
            {brandToEdit ? 'Altere as informações da sua marca.' : 'Preencha os campos abaixo para adicionar uma nova marca.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-6 -mr-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
          {/* Coluna 1 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="Escreva o nome da sua Marca" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="values">Valores</Label>
              <Textarea id="values" value={formData.values} onChange={handleInputChange} placeholder="Escreva os valores da sua marca" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">Quais as metas do negócio?</Label>
              <Textarea id="goals" value={formData.goals} onChange={handleInputChange} placeholder="Ex: Vendas diretas, geração de leads" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="successMetrics">Quais indicadores de sucesso?</Label>
              <Textarea id="successMetrics" value={formData.successMetrics} onChange={handleInputChange} placeholder="Ex: engajamento, conversões" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialDates">Quais datas especiais no ano?</Label>
              <Textarea id="specialDates" value={formData.specialDates} onChange={handleInputChange} placeholder="Ex: natal, black friday" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promise">Qual promessa você faz e ninguém entrega igual?</Label>
              <Textarea id="promise" value={formData.promise} onChange={handleInputChange} placeholder="Escreva a sua promessa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestones">Descreva marcos ou cases que reforçam autoridade e autenticidade da marca</Label>
              <Textarea id="milestones" value={formData.milestones} onChange={handleInputChange} placeholder="Escreva seus marcos e cases" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restrictions">Restrições</Label>
              <Textarea id="restrictions" value={formData.restrictions} onChange={handleInputChange} placeholder="Escreva as restrições necessárias para a sua marca" />
            </div>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável da Marca</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, responsible: value }))} value={formData.responsible}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.email} value={m.email}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment">Segmento</Label>
              <Input id="segment" value={formData.segment} onChange={handleInputChange} placeholder="Escreva o segmento da sua marca" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Palavras-Chave</Label>
              <Input id="keywords" value={formData.keywords} onChange={handleInputChange} placeholder="Ex: Tecnologia, Inovação, Eco-Friendly" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspirations">Quais perfis ou marcas inspiram a sua marca e por quê?</Label>
              <Textarea id="inspirations" value={formData.inspirations} onChange={handleInputChange} placeholder="Escreva os perfis e marcas, explique" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="references">Quais conteúdos são referência para sua marca?</Label>
              <Textarea id="references" value={formData.references} onChange={handleInputChange} placeholder="Cole o link do conteúdo. Ex: Youtube, Instagram" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectorRestrictions">Restrições de setor</Label>
              <Textarea id="sectorRestrictions" value={formData.sectorRestrictions} onChange={handleInputChange} placeholder="Escreva as restrições do setor" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crisisInfo">Existe alguma crise de marca? Ou pode existir?</Label>
              <Textarea id="crisisInfo" value={formData.crisisInfo} onChange={handleInputChange} placeholder="Se sim, explique" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collaborations">Existem ações com influenciadores, comunidades ou colaboradores?</Label>
              <Textarea id="collaborations" value={formData.collaborations} onChange={handleInputChange} placeholder="Se sim, cite-as" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moodboard">Existem moodboard, referências visuais e identidade visual?</Label>
              {/* **ATUALIZADO:** Aceita imagens e PDF */}
              <Input id="moodboard" type="file" onChange={handleFileChange} accept="image/*,application/pdf" className="pt-2" />
            </div>
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