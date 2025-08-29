'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { X } from 'lucide-react';
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
import type { StrategicTheme } from '@/types/theme';
import type { Brand } from '@/types/brand';
import { toast } from 'sonner';

type ThemeFormData = Omit<StrategicTheme, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userId'>;

interface ThemeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ThemeFormData) => void;
  themeToEdit: StrategicTheme | null;
  brands?: Brand[]; // Recebe a lista de marcas para o select
}

const initialFormData: ThemeFormData = {
  brandId: '',
  title: '',
  description: '',
  colorPalette: '',
  toneOfVoice: '',
  targetAudience: '',
  hashtags: '',
  objectives: '',
  contentFormat: '',
  macroThemes: '',
  bestFormats: '',
  platforms: '',
  expectedAction: '',
  additionalInfo: '',
};

export default function ThemeDialog({ isOpen, onOpenChange, onSave, themeToEdit, brands = [] }: ThemeDialogProps) {
  const [formData, setFormData] = useState<ThemeFormData>(initialFormData);
  // toneList stores multiple tones; we'll serialize to toneOfVoice string on save
  const [toneList, setToneList] = useState<string[]>([]);

  const toneOptions = [
    'inspirador', 'motivacional', 'profissional', 'casual', 'elegante',
    'moderno', 'tradicional', 'divertido', 'sério', 'informal', 'confiável'
  ];

  useEffect(() => {
    if (isOpen && themeToEdit) {
      setFormData({
        brandId: themeToEdit.brandId || '',
        title: themeToEdit.title || '',
        description: themeToEdit.description || '',
        colorPalette: themeToEdit.colorPalette || '',
        toneOfVoice: themeToEdit.toneOfVoice || '',
        targetAudience: themeToEdit.targetAudience || '',
        hashtags: themeToEdit.hashtags || '',
        objectives: themeToEdit.objectives || '',
        contentFormat: themeToEdit.contentFormat || '',
        macroThemes: themeToEdit.macroThemes || '',
        bestFormats: themeToEdit.bestFormats || '',
        platforms: themeToEdit.platforms || '',
        expectedAction: themeToEdit.expectedAction || '',
        additionalInfo: themeToEdit.additionalInfo || '',
      });
      // parse toneOfVoice into list (support comma/semicolon separated or already array-like)
      try {
        const raw = themeToEdit.toneOfVoice || '';
        if (Array.isArray((themeToEdit as any).toneOfVoice)) {
          setToneList((themeToEdit as any).toneOfVoice as string[]);
        } else if (typeof raw === 'string' && raw.trim()) {
          const parsed = raw.split(/[,;]\s*/).map(s => s.trim()).filter(Boolean);
          setToneList(parsed);
        } else {
          setToneList([]);
        }
      } catch (e) {
        setToneList([]);
      }
    } else {
      setFormData(initialFormData);
      setToneList([]);
    }
  }, [themeToEdit, isOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, brandId: value }));
  };

  const handleToneSelect = (value: string) => {
    if (!value) return;
    setToneList(prev => prev.includes(value) ? prev : [...prev, value]);
  };

  const handleToneRemove = (tone: string) => {
    setToneList(prev => prev.filter(t => t !== tone));
  };

  const handleSaveClick = () => {
    // Serialize toneList into toneOfVoice string for storage compatibility
    const payload: ThemeFormData = { ...formData, toneOfVoice: toneList.join(', ') } as ThemeFormData;
    onSave(payload);
    onOpenChange(false);
  };

  const isFormValid =
    formData.title.trim() !== '' &&
    formData.brandId.trim() !== '' &&
    formData.objectives.trim() !== '' &&
    toneList.length > 0 &&
    formData.contentFormat.trim() !== '' &&
    formData.expectedAction.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{themeToEdit ? 'Editar Tema Estratégico' : 'Criar Novo Tema Estratégico'}</DialogTitle>
          <DialogDescription>
            {themeToEdit ? 'Altere as informações do seu tema.' : 'Preencha os campos abaixo para adicionar um novo tema.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-6 -mr-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
          {/* Coluna 1 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brandId">Marca *</Label>
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
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={handleInputChange} placeholder="Ex: Novo Produto" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colorPalette">Paleta de Cores</Label>
              <Input id="colorPalette" value={formData.colorPalette} onChange={handleInputChange} placeholder="Pode ser escrita ou em RGB" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Universo-Alvo</Label>
              <Textarea id="targetAudience" value={formData.targetAudience} onChange={handleInputChange} placeholder="Ex: Homens, entre 25 e 35 anos..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objectives">Objetivos *</Label>
              <Textarea id="objectives" value={formData.objectives} onChange={handleInputChange} placeholder="Escreva o objetivo desse tema" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="macroThemes">Quais macro-temas ou categorias sustentam a promessa de valor da marca?</Label>
              <Textarea id="macroThemes" value={formData.macroThemes} onChange={handleInputChange} placeholder="Escreva os macro-temas e categorias de valor" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platforms">Quais as plataformas atuais e desejadas?</Label>
              <Textarea id="platforms" value={formData.platforms} onChange={handleInputChange} placeholder="Ex: Instagram, Youtube" />
            </div>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="Escreva a descrição do tema" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toneOfVoice">Tom de Voz * (escolha um ou mais)</Label>
              <Select onValueChange={handleToneSelect} value="">
                <SelectTrigger><SelectValue placeholder="Adicionar tom de voz..." /></SelectTrigger>
                <SelectContent>
                  {toneOptions.map(option => (
                    <SelectItem key={option} value={option} disabled={toneList.includes(option)}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-wrap gap-2 min-h-[50px] p-3 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 mt-3">
                {toneList.length === 0 ? (
                  <span className="text-sm text-muted-foreground italic self-center">Nenhum tom selecionado</span>
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
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input id="hashtags" value={formData.hashtags} onChange={handleInputChange} placeholder="Escreva as hastags desejadas. use o #" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentFormat">Formato dos Conteúdos *</Label>
              <Textarea id="contentFormat" value={formData.contentFormat} onChange={handleInputChange} placeholder="Ex: Cards de promoção, Feedback" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bestFormats">Quais formatos funcionam melhor até agora?</Label>
              <Textarea id="bestFormats" value={formData.bestFormats} onChange={handleInputChange} placeholder="Ex: Vídeo curto, Live, Reels" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedAction">Qual ação você espera após cada peça de conteúdo publicada? *</Label>
              <Textarea id="expectedAction" value={formData.expectedAction} onChange={handleInputChange} placeholder="Escreva as ações esperadas" />
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="additionalInfo">Informações Adicionais</Label>
            <Textarea id="additionalInfo" value={formData.additionalInfo} onChange={handleInputChange} placeholder="Informações úteis para aprimorar a criação do seu tema estratégico." />
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