'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
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
import type { ColorItem } from '@/types/brand';
import { toast } from 'sonner';
import { StrategicThemeColorPicker } from '../ui/strategic-theme-color-picker';

type ThemeFormData = Omit<StrategicTheme, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userId'> & {
  colorPalette: string;
};

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
  colorPalette: '[]',
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
  const [isLoading, setIsLoading] = useState(false);
  // toneList stores multiple tones; we'll serialize to toneOfVoice string on save
  const [toneList, setToneList] = useState<string[]>([]);
  const [hashtagList, setHashtagList] = useState<string[]>([]);

  const handleColorsChange = (colorsString: string) => {
    setFormData(prev => ({ ...prev, colorPalette: colorsString }));
  };

  const toneOptions = [
    'inspirador', 'motivacional', 'profissional', 'casual', 'elegante',
    'moderno', 'tradicional', 'divertido', 'sério', 'informal', 'confiável'
  ];

  useEffect(() => {
    if (isOpen && themeToEdit) {
      // Garante que a paleta de cores seja uma string JSON válida
      const colorPalette = themeToEdit.colorPalette || '[]';

      setFormData({
        brandId: themeToEdit.brandId || '',
        title: themeToEdit.title || '',
        description: themeToEdit.description || '',
        colorPalette,
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

      // Carrega as hashtags existentes
      const hashtags = themeToEdit.hashtags?.split(/\s+/).filter(Boolean) || [];
      setHashtagList(hashtags);
    } else {
      setFormData(initialFormData);
      setToneList([]);
      setHashtagList([]);
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

  const handleHashtagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) {
        // Adiciona # se não existir
        const hashtag = value.startsWith('#') ? value : `#${value}`;
        if (!hashtagList.includes(hashtag)) {
          setHashtagList(prev => [...prev, hashtag]);
          // Limpa o input
          e.currentTarget.value = '';
          // Atualiza o formData
          setFormData(prev => ({ ...prev, hashtags: [...hashtagList, hashtag].join(' ') }));
        }
      }
    }
  };

  const handleHashtagRemove = (hashtag: string) => {
    setHashtagList(prev => {
      const newList = prev.filter(h => h !== hashtag);
      setFormData(prev => ({ ...prev, hashtags: newList.join(' ') }));
      return newList;
    });
  };

  const handleSaveClick = async () => {
    setIsLoading(true);

    try {
      // Serialize toneList into toneOfVoice string for storage compatibility
      const payload: ThemeFormData = {
        ...formData,
        toneOfVoice: toneList.join(', '),
        // Garante que colorPalette seja uma string
        colorPalette: typeof formData.colorPalette === 'string' ? formData.colorPalette : '[]'
      } as ThemeFormData;

      await onSave(payload);
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
      toast.error(themeToEdit 
        ? 'Erro ao atualizar o tema. Por favor, tente novamente.' 
        : 'Erro ao criar o tema. Por favor, tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    const requiredFields = [
      { field: 'title', label: 'Título' },
      { field: 'brandId', label: 'Marca' },
      { field: 'objectives', label: 'Objetivos' },
      { field: 'contentFormat', label: 'Formato dos Conteúdos' },
      { field: 'expectedAction', label: 'Ação esperada' }
    ];

    const missingFields = requiredFields.filter(({ field }) => 
      !formData[field as keyof typeof formData]?.toString().trim()
    );

    if (missingFields.length > 0 || toneList.length === 0) {
      const fieldsList = missingFields.map(({ label }) => label).join(', ');
      const message = `Os seguintes campos são obrigatórios: ${fieldsList}${
        toneList.length === 0 ? (fieldsList ? ', Tom de Voz' : 'Tom de Voz') : ''
      }`;
      toast.error(message);
      return false;
    }

    return true;
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Limpa o formulário ao fechar
      setFormData(initialFormData);
      setToneList([]);
      setHashtagList([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{themeToEdit ? 'Editar Tema Estratégico' : 'Criar Novo Tema Estratégico'}</DialogTitle>
          <DialogDescription>
            {themeToEdit ? 'Altere as informações do seu tema.' : 'Preencha os campos abaixo para adicionar um novo tema.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-6">
            {/* Coluna 1 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandId">Marca <span className="text-red-500">*</span></Label>
                <Select onValueChange={handleSelectChange} value={formData.brandId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a marca para criar o tema" /></SelectTrigger>
                  <SelectContent>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="toneOfVoice">Tom de Voz <span className="text-red-500">*</span> (escolha um ou mais)</Label>
                <Select onValueChange={handleToneSelect} value="">
                  <SelectTrigger><SelectValue placeholder="Escolha como sua marca deve se comunicar"/></SelectTrigger>
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
                <Label htmlFor="targetAudience">Universo-Alvo</Label>
                <Textarea
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  placeholder="Descreva o público-alvo considerando: idade, gênero, interesses, comportamentos e características relevantes"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectives">Objetivos <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="objectives" 
                  value={formData.objectives} 
                  onChange={handleInputChange} 
                  placeholder="Liste os objetivos específicos e mensuráveis que deseja alcançar com este tema estratégico" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="macroThemes">Quais macro-temas ou categorias sustentam a promessa de valor da marca?</Label>
                <Textarea 
                  id="macroThemes" 
                  value={formData.macroThemes} 
                  onChange={handleInputChange} 
                  placeholder="Liste os principais temas que representam os valores da marca. Ex: inovação, sustentabilidade, bem-estar" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platforms">Quais as plataformas atuais e desejadas?</Label>
                <Textarea 
                  id="platforms" 
                  value={formData.platforms} 
                  onChange={handleInputChange} 
                  placeholder="Liste todas as redes sociais onde sua marca está ou planeja estar. Ex: Instagram, YouTube, LinkedIn" 
                />
              </div>
            </div>

            {/* Coluna 2 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título <span className="text-red-500">*</span></Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  placeholder="Nome descritivo que identifique facilmente este tema estratégico" 
                />
              </div>
              <div className="space-y-2 pt-1">
                <Label htmlFor="hashtags">Hashtags</Label>
                <Input 
                  id="hashtags" 
                  placeholder="Digite uma hashtag e pressione Enter ou vírgula"
                  onKeyDown={handleHashtagAdd}
                  className="h-10 mb-3"
                />
                <div className="flex flex-wrap gap-2 min-h-[50px] p-3 rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
                  {hashtagList.length === 0 ? (
                    <span className="text-sm text-muted-foreground italic self-center">
                      Nenhuma hashtag adicionada
                    </span>
                  ) : (
                    hashtagList.map(hashtag => (
                      <div 
                        key={hashtag} 
                        className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 border-2 border-primary/30 text-primary text-sm font-semibold px-3 py-1.5 rounded-xl"
                      >
                        {hashtag}
                        <button 
                          onClick={() => handleHashtagRemove(hashtag)}
                          className="ml-1 text-primary hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-destructive/10"
                          aria-label={`Remover hashtag ${hashtag}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>  
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descreva o propósito do tema e como ele se alinha aos objetivos da marca"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contentFormat">Formato dos Conteúdos <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="contentFormat" 
                  value={formData.contentFormat} 
                  onChange={handleInputChange} 
                  placeholder="Indique os tipos de conteúdo que serão criados. Ex: carrossel, vídeos curtos, reels, stories" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bestFormats">Quais formatos funcionam melhor até agora?</Label>
                <Textarea 
                  id="bestFormats" 
                  value={formData.bestFormats} 
                  onChange={handleInputChange} 
                  placeholder="Liste os formatos que geram mais engajamento. Ex: reels com tutoriais, carrossel educativo" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedAction">Qual ação você espera após cada peça de conteúdo publicada? <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="expectedAction" 
                  value={formData.expectedAction} 
                  onChange={handleInputChange} 
                  placeholder="Descreva as ações que deseja que seu público tome. Ex: visitar site, entrar em contato, compartilhar, comprar" 
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
                <Label htmlFor="additionalInfo">Informações Adicionais</Label>
                <Textarea
                  id="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder="Adicione outras informações relevantes como referências, dicas ou restrições importantes para este tema"
                />
              </div>
          </div>

          {/* Seletor de Paleta de Cores */}
          <div className="px-6 mb-2">
            <div className="w-full space-y-2">
              <StrategicThemeColorPicker
                colors={formData.colorPalette}
                onColorsChange={(colors) => setFormData(prev => ({ ...prev, colorPalette: colors }))}
                maxColors={8}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-center gap-4 pt-4 border-t border-border/40">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="min-w-[120px] h-11 px-8 font-medium transition-all duration-300 hover:bg-destructive hover:border-destructive dark:hover:bg-destructive"
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={() => {
              if (isFormValid()) {
                handleSaveClick();
              }
            }}
            disabled={isLoading}
            className="min-w-[120px] h-11 px-8 font-medium bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
                {themeToEdit ? 'Atualizando...' : 'Criando...'}
              </span>
            ) : (
              themeToEdit ? 'Atualizar' : 'Criar Tema'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}