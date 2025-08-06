// components/content.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, Image as ImageIcon, Sparkles, ArrowLeft, Download } from 'lucide-react';
import type { Brand } from '@/types/brand';
import type { StrategicTheme } from '@/types/theme';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/types/team';
import { toast } from 'sonner';

// Interfaces
interface FormData {
  brand: string;
  theme: string;
  objective: string;
  platform: string;
  description: string;
  audience: string;
  tone: string;
  additionalInfo: string;
}
interface GeneratedContent {
  title: string;
  body: string;
  hashtags: string[];
}

// Função de histórico (sem alteração)
const saveActionToHistory = (actionData: any, teamId: string, userEmail: string) => {
  const history = JSON.parse(localStorage.getItem('creator-action-history') || '[]');
  const newAction = {
    id: new Date().toISOString() + Math.random(),
    createdAt: new Date().toISOString(),
    teamId,
    userEmail,
    ...actionData,
  };
  history.unshift(newAction);
  localStorage.setItem('creator-action-history', JSON.stringify(history));
};


export default function Creator() {
  const [formData, setFormData] = useState<FormData>({
    brand: '',
    theme: '',
    objective: '',
    platform: '',
    description: '',
    audience: '',
    tone: '',
    additionalInfo: '',
  });

  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<StrategicTheme[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isResultView, setIsResultView] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (user?.teamId) {
        const storedBrands = JSON.parse(localStorage.getItem('creator-brands') || '[]') as Brand[];
        setBrands(storedBrands.filter(b => b.teamId === user.teamId));
        const storedThemes = JSON.parse(localStorage.getItem('creator-themes') || '[]') as StrategicTheme[];
        setThemes(storedThemes.filter(t => t.teamId === user.teamId));
        const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
        const t = teams.find(tm => tm.id === user.teamId);
        if (t) setTeam(t);
      }
    } catch (error) {
      console.error('Falha ao carregar dados do localStorage', error);
      toast.error('Falha ao carregar dados locais.');
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleBrandChange = (brandName: string) => {
    setFormData((prev) => ({ ...prev, brand: brandName, theme: '' }));
    const selectedBrand = brands.find(b => b.name === brandName);
    if (selectedBrand) {
      setFilteredThemes(themes.filter(t => t.brandId === selectedBrand.id));
    } else {
      setFilteredThemes([]);
    }
  };

  const handleThemeChange = (themeTitle: string) => {
    setFormData((prev) => ({ ...prev, theme: themeTitle }));
  };

  const handlePlatformChange = (value: string) => {
    setFormData((prev) => ({ ...prev, platform: value }));
  };

  const handleGenerateContent = async () => {
    if (!team) return;
    if (team.credits.contentSuggestions <= 0) {
      toast.error('Seus créditos para sugestões de conteúdo acabaram.');
      return;
    }

    setLoading(true);
    setImageUrl(null);
    setGeneratedContent(null);

    const imagePrompt = `Crie uma imagem profissional para um post na plataforma "${formData.platform}". - Marca: ${formData.brand}. - Tema: ${formData.theme}. - Objetivo do post: ${formData.objective}. - Descrição visual da imagem: ${formData.description}. - Público-alvo: ${formData.audience}. - Tom de voz visual: ${formData.tone}. - Informações adicionais importantes: ${formData.additionalInfo}. A imagem deve ser de alta qualidade, atraente e seguir um estilo de arte digital moderna.`;

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, prompt: imagePrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar o conteúdo. Tente novamente.');
      }

      setImageUrl(data.imageUrl);
      setGeneratedContent({
        title: data.title,
        body: data.body,
        hashtags: data.hashtags,
      });
      setIsResultView(true);

      saveActionToHistory({
        type: 'Criar conteúdo',
        brand: formData.brand,
        details: { ...formData },
        result: {
          imageUrl: data.imageUrl,
          title: data.title,
          body: data.body,
          hashtags: data.hashtags,
        },
      }, team.id, user?.email || '');

      const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
      const idx = teams.findIndex(t => t.id === team.id);
      if (idx > -1) {
        teams[idx].credits.contentSuggestions -= 1;
        localStorage.setItem('creator-teams', JSON.stringify(teams));
        setTeam(teams[idx]);
      }

    } catch (err: any) {
      console.error("Ocorreu um erro:", err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBackToForm = () => {
    setIsResultView(false);
    setFormData(prev => ({
      ...prev,
      objective: '',
      description: '',
      audience: '',
      tone: '',
      additionalInfo: '',
    }));
    setImageUrl(null);
    setGeneratedContent(null);
  };

  const handleDownloadImage = () => {
    if (!imageUrl) return;
    setIsDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `creator-ai-${formData.brand.replace(/\s+/g, '-')}-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar a imagem:', error);
      toast.error('Não foi possível iniciar o download da imagem.');
    } finally {
      setIsDownloading(false);
    }
  };

  // --- INÍCIO DA CORREÇÃO ---
  // Seção de visualização do resultado que estava faltando.
  if (isResultView) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h1 className="text-2xl font-bold">Seu Conteúdo está Pronto! ✨</h1>
          <Button onClick={handleGoBackToForm} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Criar Novo Post
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow overflow-hidden">
          {/* Coluna da Imagem */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full bg-card rounded-xl border p-2 flex-grow">
              {!imageUrl ? (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center flex-col text-muted-foreground">
                  <Loader className="h-8 w-8 animate-spin mb-4" />
                  <span>Carregando imagem...</span>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt={`Imagem gerada por IA sobre ${formData.theme}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
            </div>
            <Button onClick={handleDownloadImage} disabled={!imageUrl || isDownloading} className="w-full flex-shrink-0">
              {isDownloading ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
              Baixar Imagem
            </Button>
          </div>

          {/* Coluna do Conteúdo */}
          <div className="bg-card rounded-xl border p-6 flex flex-col overflow-hidden">
            {!generatedContent ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 w-3/4 bg-muted rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded"></div>
                  <div className="h-4 w-full bg-muted rounded"></div>
                  <div className="h-4 w-5/6 bg-muted rounded"></div>
                </div>
                <div className="flex flex-wrap gap-2 pt-4">
                  <div className="h-6 w-20 bg-muted rounded-full"></div>
                  <div className="h-6 w-24 bg-muted rounded-full"></div>
                  <div className="h-6 w-16 bg-muted rounded-full"></div>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold tracking-tight flex-shrink-0">{generatedContent.title}</h2>
                <div className="mt-4 text-muted-foreground whitespace-pre-wrap flex-grow overflow-y-auto pr-2">
                  {generatedContent.body}
                </div>
                <div className="mt-6 flex flex-wrap gap-2 border-t pt-4 flex-shrink-0">
                  {generatedContent.hashtags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  // --- FIM DA CORREÇÃO ---


  // O formulário de criação (sem alterações)
  return (
    <div className="w-full max-w-4xl h-full mx-auto p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl bg-card border-2 border-primary/20 flex flex-col">
      <div className="flex items-start gap-4 mb-8">
        <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
          <Sparkles className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Criar Conteúdo</h1>
          <p className="text-muted-foreground">Preencha os campos abaixo para gerar seu post.</p>
        </div>
      </div>

      <div className="overflow-y-auto flex-grow pr-4 -mr-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className='flex justify-between items-center md:col-span-2 gap-8'>
            <div className="w-full space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Select onValueChange={handleBrandChange} value={formData.brand}>
                <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="theme">Tema Estratégico</Label>
              <Select onValueChange={handleThemeChange} value={formData.theme} disabled={!formData.brand}>
                <SelectTrigger><SelectValue placeholder={formData.brand ? "Selecione o tema" : "Selecione a marca primeiro"} /></SelectTrigger>
                <SelectContent>
                  {filteredThemes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.title}>{theme.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="objective">Objetivo do Post</Label>
            <Textarea id="objective" placeholder="Ex: Gerar engajamento sobre o novo produto, educar sobre um tema..." value={formData.objective} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma Digital</Label>
            <Select onValueChange={handlePlatformChange} value={formData.platform}>
              <SelectTrigger><SelectValue placeholder="Selecione a plataforma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Twitter">Twitter (X)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">Público Alvo</Label>
            <Input id="audience" placeholder="Ex: Jovens atletas, 18-25 anos" value={formData.audience} onChange={handleInputChange} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">Descrição da Ideia (para o texto)</Label>
            <Textarea id="description" placeholder="Ex: Mencionar a importância da hidratação, benefícios do produto X..." value={formData.description} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tone">Tom de Voz</Label>
            <Input id="tone" placeholder="Ex: Inspirador, motivacional, divertido, formal..." value={formData.tone} onChange={handleInputChange} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="additionalInfo">Instruções Visuais (para a imagem)</Label>
            <Textarea id="additionalInfo" placeholder="Ex: Usar as cores da marca, estilo minimalista, foto de uma pessoa correndo..." value={formData.additionalInfo} onChange={handleInputChange} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex-shrink-0">
        <Button onClick={handleGenerateContent} disabled={loading} className="w-full rounded-full text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <><Loader className="animate-spin mr-2" /> Gerando...</> : <><Sparkles className="mr-2" />Gerar Conteúdo</>}
        </Button>
      </div>
    </div>
  );
}