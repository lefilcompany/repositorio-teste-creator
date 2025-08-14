// components/content/content.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader, Sparkles, Zap, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Brand } from '@/types/brand';
import type { StrategicTheme } from '@/types/theme';
import type { Persona } from '@/types/persona';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/types/team';

// Interfaces
interface FormData {
  brand: string;
  theme: string;
  persona: string;
  objective: string;
  platform: string;
  description: string;
  audience: string;
  tone: string[]; // Alterado para array de strings
  additionalInfo: string;
}

// Opções para o Tom de Voz
const toneOptions = [
  'inspirador', 'motivacional', 'profissional', 'casual', 'elegante',
  'moderno', 'tradicional', 'divertido', 'sério'
];

// Função para gerar ID único baseado em timestamp e aleatoriedade
const generateUniqueId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2);
  return `gen-${timestamp}-${random}`;
};

// Função de histórico melhorada para usar API
const saveActionToHistory = async (actionData: any, teamId: string | undefined, userId: string | undefined, brandName: string, brands: Brand[]) => {
  if (!teamId || !userId) {
    console.warn('TeamId ou userId não fornecidos para salvar no histórico');
    return;
  }

  try {
    const brandData = brands.find(b => b.name === brandName);
    if (brandData) {
      await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CRIAR_CONTEUDO',
          teamId,
          userId,
          brandId: brandData.id,
          details: actionData.details,
          result: actionData.result,
        }),
      });
      console.log('Ação salva no histórico via API');
    }
  } catch (error) {
    console.error("Erro ao salvar ação no histórico:", error);
    toast.error("Erro ao salvar no histórico. O conteúdo será criado, mas pode não aparecer no histórico.");
  }
};

export default function Creator() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    brand: '', theme: '', persona: '', objective: '', platform: '',
    description: '', audience: '', tone: [], additionalInfo: '',
  });

  const [team, setTeam] = useState<Team | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<StrategicTheme[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.teamId || !user.id) return;
      
      try {
        const [brandsRes, themesRes, personasRes, teamsRes] = await Promise.all([
          fetch(`/api/brands?teamId=${user.teamId}`),
          fetch(`/api/themes?teamId=${user.teamId}`),
          fetch(`/api/personas?teamId=${user.teamId}`),
          fetch(`/api/teams?userId=${user.id}`)
        ]);
        
        if (brandsRes.ok) {
          const brandsData: Brand[] = await brandsRes.json();
          setBrands(brandsData);
        } else {
          toast.error('Erro ao carregar marcas');
        }
        
        if (themesRes.ok) {
          const themesData: StrategicTheme[] = await themesRes.json();
          setThemes(themesData);
        } else {
          toast.error('Erro ao carregar temas estratégicos');
        }
        
        if (personasRes.ok) {
          const personasData: Persona[] = await personasRes.json();
          setPersonas(personasData);
        } else {
          toast.error('Erro ao carregar personas');
        }
        
        if (teamsRes.ok) {
          const teamsData: Team[] = await teamsRes.json();
          const currentTeam = teamsData.find(t => t.id === user.teamId);
          if (currentTeam) setTeam(currentTeam);
        } else {
          toast.error('Erro ao carregar dados da equipe');
        }
      } catch (e) {
        console.error('Falha ao carregar dados da API', e);
        toast.error('Houve um problema ao carregar seus dados. Tente recarregar a página.');
      }
    };
    
    loadData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (field: keyof Omit<FormData, 'tone'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'brand') {
      const selectedBrand = brands.find(b => b.name === value);
      setFilteredThemes(selectedBrand ? themes.filter(t => t.brandId === selectedBrand.id) : []);
      setFormData(prev => ({ ...prev, theme: '', persona: '' }));
    }
  };

  const handleToneSelect = (tone: string) => {
    if (!formData.tone.includes(tone)) {
      if (formData.tone.length >= 4) {
        toast.error("Limite atingido", {
          description: "Você pode selecionar no máximo 4 tons de voz."
        });
        return;
      }
      setFormData(prev => ({ ...prev, tone: [...prev.tone, tone] }));
    }
  };

  const handleToneRemove = (toneToRemove: string) => {
    setFormData(prev => ({ ...prev, tone: prev.tone.filter(t => t !== toneToRemove) }));
  };

  const isFormValid = () => {
    return formData.brand && formData.theme && formData.objective && formData.platform && formData.description && formData.audience && formData.tone.length > 0 && referenceImage;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const updateTeamCredits = async () => {
    if (!team || !user?.teamId) return;

    try {
      const updatedCredits = { ...team.credits, contentSuggestions: team.credits.contentSuggestions - 1 };
      const updateRes = await fetch('/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: team.id, credits: updatedCredits }),
      });
      
      if (updateRes.ok) {
        const updatedTeam = await updateRes.json();
        setTeam(updatedTeam);
      }
    } catch (error) {
      console.error('Erro ao atualizar créditos da equipe:', error);
    }
  };

  const handleGenerateContent = async () => {
    if (!team) {
      toast.error('Equipe não encontrada.');
      return;
    }
    if (team.credits.contentSuggestions <= 0) {
      toast.error('Seus créditos para sugestões de conteúdo acabaram.');
      return;
    }
    if (!isFormValid() || !referenceImage) {
      toast.error('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }
    if (!user?.teamId || !user?.id) {
      toast.error('Dados do usuário não encontrados. Faça login novamente.');
      return;
    }

    setLoading(true);

    try {
      const base64Image = await fileToBase64(referenceImage);

      // Busca o brandId baseado no nome da marca selecionada
      const selectedBrand = brands.find(b => b.name === formData.brand);
      if (!selectedBrand) {
        toast.error('Marca selecionada não encontrada.');
        return;
      }

      const requestData = {
        prompt: formData.description,
        ...formData,
        referenceImage: base64Image,
        teamId: user?.teamId,
        brandId: selectedBrand.id,
        userId: user?.id,
      };

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o conteúdo.');
      }

      const data = await response.json();

      // Gera um ID único para esta ação/conteúdo
      const actionId = generateUniqueId();

      const resultData = {
        id: actionId,
        imageUrl: data.imageUrl,
        title: data.title,
        body: data.body,
        hashtags: data.hashtags,
        revisions: 0,
        brand: formData.brand,
        theme: formData.theme,
        originalId: actionId // Mantém referência ao ID original
      };

      // Salva o conteúdo temporariamente no banco de dados para a página de resultados
      try {
        await fetch('/api/temporary-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            teamId: user?.teamId,
            actionId: actionId,
            imageUrl: data.imageUrl,
            title: data.title,
            body: data.body,
            hashtags: data.hashtags,
            brand: formData.brand,
            theme: formData.theme,
            originalId: actionId,
            revisions: 0
          })
        });
      } catch (error) {
        console.error('Erro ao salvar conteúdo temporário:', error);
        // Fallback para localStorage se a API falhar
        localStorage.setItem('generatedContent', JSON.stringify(resultData));
      }

      // NÃO salva no histórico aqui - apenas quando aprovado na página de resultados

      // Atualiza os créditos da equipe
      await updateTeamCredits();

      toast.success('Conteúdo gerado com sucesso!');
      router.push('/content/result');

    } catch (err: any) {
      console.error('Erro ao gerar conteúdo:', err);
      toast.error(err.message || 'Erro ao gerar o conteúdo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header Card */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/20 shadow-lg shadow-black/5 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-2xl blur-md opacity-30"></div>
                <div className="relative bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-3">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Criar Conteúdo Estratégico
                </h1>
                <p className="text-muted-foreground text-base mt-1">
                  Preencha os campos para gerar um post completo com IA
                </p>
              </div>
            </div>
            {team && (
              <div className="flex items-center gap-3">
                <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 backdrop-blur-sm shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-sm opacity-40"></div>
                        <div className="relative bg-gradient-to-r from-primary to-secondary text-white rounded-full p-2">
                          <Zap className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            {team.credits.contentSuggestions}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">créditos restantes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Main Content with proper padding */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 xl:col-span-2 space-y-6">
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Configuração Básica
                </h2>
                <p className="text-muted-foreground text-sm">Defina marca, tema e público</p>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="space-y-3">
                  <Label htmlFor="brand" className="text-sm font-semibold text-foreground">Marca *</Label>
                  <Select onValueChange={(value) => handleSelectChange('brand', value)} value={formData.brand}>
                    <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Selecione a marca" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/20">
                      {brands.map(b => <SelectItem key={b.id} value={b.name} className="rounded-lg">{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="theme" className="text-sm font-semibold text-foreground">Tema Estratégico *</Label>
                  <Select onValueChange={(value) => handleSelectChange('theme', value)} value={formData.theme} disabled={!formData.brand}>
                    <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 disabled:opacity-50 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder={!formData.brand ? "Primeiro, escolha a marca" : "Selecione o tema"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/20">
                      {filteredThemes.map(t => <SelectItem key={t.id} value={t.title} className="rounded-lg">{t.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="persona" className="text-sm font-semibold text-foreground">Persona (Opcional)</Label>
                  <Select onValueChange={(value) => handleSelectChange('persona', value)} value={formData.persona} disabled={!formData.brand}>
                    <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 disabled:opacity-50 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder={!formData.brand ? "Primeiro, escolha a marca" : "Selecione uma persona"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/20">
                      {personas.filter(p => p.brandId === brands.find(b => b.name === formData.brand)?.id).map(p => 
                        <SelectItem key={p.id} value={p.name} className="rounded-lg">{p.name}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="platform" className="text-sm font-semibold text-foreground">Plataforma *</Label>
                  <Select onValueChange={(value) => handleSelectChange('platform', value)} value={formData.platform}>
                    <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Onde será postado?" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/20">
                      <SelectItem value="Instagram" className="rounded-lg">Instagram</SelectItem>
                      <SelectItem value="Facebook" className="rounded-lg">Facebook</SelectItem>
                      <SelectItem value="LinkedIn" className="rounded-lg">LinkedIn</SelectItem>
                      <SelectItem value="Twitter" className="rounded-lg">Twitter (X)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="audience" className="text-sm font-semibold text-foreground">Público-Alvo *</Label>
                  <Input 
                    id="audience" 
                    placeholder="Ex: Jovens de 18-25 anos" 
                    value={formData.audience} 
                    onChange={handleInputChange} 
                    className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20" 
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="referenceImage" className="text-sm font-semibold text-foreground">Imagem de Referência *</Label>
                  <div className="relative">
                    <Input
                      id="referenceImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReferenceImage(e.target.files?.[0] || null)}
                      className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>
                  {referenceImage && (
                    <div className="text-sm text-green-600 flex items-center gap-2 mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      ✓ Arquivo selecionado: {referenceImage.name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Content Details */}
          <div className="lg:col-span-1 xl:col-span-3 space-y-6">
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-secondary/5 to-accent/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  Detalhes do Conteúdo
                </h2>
                <p className="text-muted-foreground text-sm">Descreva o objetivo e características do post</p>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-3">
                  <Label htmlFor="objective" className="text-sm font-semibold text-foreground">Objetivo do Post *</Label>
                  <Textarea 
                    id="objective" 
                    placeholder="Ex: Gerar engajamento, anunciar um novo produto, educar o público..." 
                    value={formData.objective} 
                    onChange={handleInputChange} 
                    className="min-h-[120px] rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 resize-none focus:ring-2 focus:ring-primary/20" 
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold text-foreground">Descrição Visual da Imagem *</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descreva detalhadamente o que você quer ver na imagem. Seja específico sobre cores, elementos, estilo, composição..." 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    className="min-h-[140px] rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 resize-none focus:ring-2 focus:ring-primary/20" 
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tone" className="text-sm font-semibold text-foreground">Tom de Voz * (máximo 4)</Label>
                  <Select onValueChange={handleToneSelect} value="">
                    <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Adicionar tom de voz..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/20">
                      {toneOptions.map(option => (
                        <SelectItem key={option} value={option} disabled={formData.tone.includes(option)} className="rounded-lg">
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex flex-wrap gap-2 min-h-[50px] p-3 rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
                    {formData.tone.length === 0 ? (
                      <span className="text-sm text-muted-foreground italic self-center">Nenhum tom selecionado</span>
                    ) : (
                      formData.tone.map(tone => (
                        <div key={tone} className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 border-2 border-primary/30 text-primary text-sm font-semibold px-3 py-1.5 rounded-xl transition-all duration-300 hover:scale-105">
                          {tone.charAt(0).toUpperCase() + tone.slice(1)}
                          <button 
                            onClick={() => handleToneRemove(tone)} 
                            className="ml-1 text-primary hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-destructive/10"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="additionalInfo" className="text-sm font-semibold text-foreground">Informações Extras</Label>
                  <Textarea 
                    id="additionalInfo" 
                    placeholder="Cores específicas, elementos obrigatórios, estilo preferido, referências..." 
                    value={formData.additionalInfo} 
                    onChange={handleInputChange} 
                    className="min-h-[100px] rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 resize-none focus:ring-2 focus:ring-primary/20" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Action Button Section */}
        <div className="mt-8">
          <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border border-border/20 rounded-2xl shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Button 
                  onClick={handleGenerateContent} 
                  disabled={loading || !isFormValid()} 
                  className="w-full max-w-lg h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-secondary hover:from-primary/90 hover:via-purple-600/90 hover:to-secondary/90 shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] border-2 border-white/20"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin mr-3 h-5 w-5" /> 
                      <span>Gerando conteúdo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" /> 
                      <span>Gerar Conteúdo</span>
                    </>
                  )}
                </Button>

                {/* Form validation indicator */}
                {!isFormValid() && (
                  <div className="text-center bg-muted/30 p-3 rounded-xl border border-border/30">
                    <p className="text-muted-foreground text-sm">
                      Complete todos os campos obrigatórios (*) para gerar o conteúdo
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}