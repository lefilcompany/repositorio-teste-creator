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

// Interfaces (sem alteração)
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
  const [error, setError] = useState<string | null>(null);
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
    console.log("1. Clicou em Gerar Conteúdo. Iniciando processo..."); // Ponto de verificação 1

    if (!team) return;
    if (team.credits.contentSuggestions <= 0) {
      setError('Seus créditos para sugestões de conteúdo acabaram.');
      setIsResultView(false);
      return;
    }
    setLoading(true);
    setError(null);
    setImageUrl(null);
    setGeneratedContent(null);
    setIsResultView(true); // << ESTA É A LINHA QUE MUDA A TELA

    console.log("2. Estado 'isResultView' definido para true. A tela deveria mudar agora."); // Ponto de verificação 2

    const imagePrompt = `Crie uma imagem profissional para um post na plataforma "${formData.platform}". - Marca: ${formData.brand}. - Tema: ${formData.theme}. - Objetivo do post: ${formData.objective}. - Descrição visual da imagem: ${formData.description}. - Público-alvo: ${formData.audience}. - Tom de voz visual: ${formData.tone}. - Informações adicionais importantes: ${formData.additionalInfo}. A imagem deve ser de alta qualidade, atraente e seguir um estilo de arte digital moderna.`;

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, prompt: imagePrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o conteúdo. Tente novamente.');
      }

      const data = await response.json();
      console.log("3. API respondeu com sucesso:", data); // Ponto de verificação 3
      setImageUrl(data.imageUrl);
      setGeneratedContent({
        title: data.title,
        body: data.body,
        hashtags: data.hashtags,
      });

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
      console.error("4. Ocorreu um erro:", err.message); // Ponto de verificação de erro
      setError(err.message);
    } finally {
      setLoading(false);
      console.log("5. Processo finalizado. Loading definido como false."); // Ponto de verificação final
    }
  };

  const handleGoBackToForm = () => {
    setIsResultView(false);
    // Limpa os dados para uma nova geração
    setFormData(prev => ({
      ...prev,
      objective: '',
      description: '',
      audience: '',
      tone: '',
      additionalInfo: '',
    }));
    setError(null);
    setImageUrl(null);
    setGeneratedContent(null);
  };

  const handleDownloadImage = async () => {
    if (!imageUrl) return;

    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'creator-ai-image.png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar a imagem:", error);
      setError("Não foi possível baixar a imagem.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isResultView) {
    return (
      <div className="w-full max-w-4xl h-full mx-auto p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl bg-card border-2 border-primary/20 flex flex-col">
        {/* Header (sem alterações) */}
        <div className="flex items-start gap-4 mb-8">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Criar Conteúdo
            </h1>
            <p className="text-muted-foreground">
              Preencha os campos abaixo para gerar seu post.
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow pr-2 -mr-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className='flex justify-between items-center md:col-span-2 gap-8'>
              <div className="w-full md:col-span-2 space-y-2">
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
              <div className="w-full md:col-span-2 space-y-2">
                <Label htmlFor="theme">Tema Estratégico</Label>
                {/* ** SELECT ATUALIZADO ** */}
                <Select onValueChange={handleThemeChange} value={formData.theme} disabled={!formData.brand}>
                  <SelectTrigger><SelectValue placeholder="Selecione a marca primeiro" /></SelectTrigger>
                  <SelectContent>
                    {filteredThemes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.title}>{theme.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* ... restante do formulário sem alterações ... */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="objective">Objetivo da Imagem</Label>
              <Textarea id="objective" placeholder="Ex: Gerar engajamento sobre o novo produto..." value={formData.objective} onChange={handleInputChange} />
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
              <Label htmlFor="description">Descrição do Post (O que deve conter?)</Label>
              <Textarea id="description" placeholder="Ex: Mencionar a importância da hidratação..." value={formData.description} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tom de Voz</Label>
              <Input id="tone" placeholder="Ex: Inspirador, motivacional" value={formData.tone} onChange={handleInputChange} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="additionalInfo">Informações Adicionais para a imagem</Label>
              <Textarea id="additionalInfo" placeholder="Ex: Usar as cores da marca, estilo minimalista..." value={formData.additionalInfo} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        {/* Botão de gerar (sem alterações) */}
        <div className="mt-8 flex-shrink-0">
          <Button onClick={handleGenerateContent} className="w-full rounded-full text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105">
            {loading ? <><Loader className="animate-spin mr-2" /> Gerando...</> : <><Sparkles className="mr-2" />Gerar Conteúdo</>}
          </Button>
          {error && <p className="text-destructive mt-4 text-center">{error}</p>}
        </div>
      </div >
    );
  }

  // ... (retorno da tela de resultado continua igual)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl mx-auto h-full">
      {/* ... código da tela de resultado ... */}
    </div>
  )
}