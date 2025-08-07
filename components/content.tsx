// components/content.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, Sparkles, Zap, Target, Users, Palette, MessageCircle, Copy, Check, Download, ArrowLeft } from 'lucide-react';
import type { Brand } from '@/types/brand';
import type { StrategicTheme } from '@/types/theme';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/types/team';

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
  imageUrl: string;
  title: string;
  body: string;
  hashtags: string[];
  formData?: FormData;
}

// Função de histórico
const saveActionToHistory = (actionData: any, teamId: string, userEmail: string) => {
  try {
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
  } catch (error) {
    console.error("Erro ao salvar ação no histórico:", error);
  }
};

export default function Creator() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    brand: '', theme: '', objective: '', platform: '',
    description: '', audience: '', tone: '', additionalInfo: '',
  });

  const [team, setTeam] = useState<Team | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<StrategicTheme[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para a visualização dos resultados
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    try {
      if (user?.teamId) {
        const storedBrands = JSON.parse(localStorage.getItem('creator-brands') || '[]') as Brand[];
        setBrands(storedBrands.filter(b => b.teamId === user.teamId));
        const storedThemes = JSON.parse(localStorage.getItem('creator-themes') || '[]') as StrategicTheme[];
        setThemes(storedThemes.filter(t => t.teamId === user.teamId));
        const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
        const currentTeam = teams.find(tm => tm.id === user.teamId);
        if (currentTeam) setTeam(currentTeam);
      }
    } catch (e) {
      console.error('Falha ao carregar dados do localStorage', e);
      setError("Houve um problema ao carregar seus dados. Tente recarregar a página.");
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleBrandChange = (brandName: string) => {
    setFormData(prev => ({ ...prev, brand: brandName, theme: '' }));
    const selectedBrand = brands.find(b => b.name === brandName);
    setFilteredThemes(selectedBrand ? themes.filter(t => t.brandId === selectedBrand.id) : []);
  };

  const handleThemeChange = (themeTitle: string) => {
    setFormData(prev => ({ ...prev, theme: themeTitle }));
  };

  const handlePlatformChange = (value: string) => {
    setFormData(prev => ({ ...prev, platform: value }));
  };

  const isFormValid = () => {
    return formData.brand && formData.theme && formData.objective && formData.platform && formData.description && formData.audience && formData.tone;
  };

  const handleCopyToClipboard = () => {
    if (!generatedContent) return;
    const fullText = `${generatedContent.title}\n\n${generatedContent.body}\n\n${generatedContent.hashtags.map(h => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!generatedContent?.imageUrl) return;
    setIsDownloading(true);
    try {
      const proxyUrl = `/api/download-image?url=${encodeURIComponent(generatedContent.imageUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `creator-ai-${Date.now()}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar a imagem:", err);
      setError("Não foi possível baixar a imagem. Tente clicar com o botão direito e 'Salvar como'.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!team) {
      setError("Equipe não encontrada.");
      return;
    }
    if (team.credits.contentSuggestions <= 0) {
      setError('Seus créditos para sugestões de conteúdo acabaram.');
      return;
    }
    if (!isFormValid()) {
      setError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setLoading(true);
    setError(null);
    setShowResults(false);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: formData.description,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o conteúdo.');
      }

      const data = await response.json();
      const contentWithFormData: GeneratedContent = { ...data, formData: formData };
      setGeneratedContent(contentWithFormData);
      setShowResults(true);

      saveActionToHistory({
        type: 'Criar conteúdo',
        brand: formData.brand,
        theme: formData.theme,
        platform: formData.platform,
        details: { ...formData },
        result: { ...data },
      }, team.id, user?.email || '');

      const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
      const teamIndex = teams.findIndex(t => t.id === team.id);
      if (teamIndex > -1) {
        teams[teamIndex].credits.contentSuggestions -= 1;
        localStorage.setItem('creator-teams', JSON.stringify(teams));
        setTeam(teams[teamIndex]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setShowResults(false);
    setGeneratedContent(null);
    setFormData({
      brand: '', theme: '', objective: '', platform: '',
      description: '', audience: '', tone: '', additionalInfo: '',
    });
    setFilteredThemes([]);
  };

  if (showResults && generatedContent) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Coluna da Imagem */}
          <div className="flex flex-col gap-6 h-full">
            <Card className="flex-grow aspect-square bg-gradient-to-br from-muted/20 to-muted/40 rounded-3xl shadow-2xl border-2 border-primary/20 overflow-hidden relative group">
              <img src={generatedContent.imageUrl} alt="Conteúdo Gerado" className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
            </Card>
            <div className="flex gap-4">
              <Button onClick={handleCreateAnother} variant="outline" className="flex-1 rounded-full text-base py-6 border-2">
                <ArrowLeft className="mr-2" /> Criar Outro
              </Button>
              <Button onClick={handleDownloadImage} disabled={isDownloading} className="flex-1 rounded-full text-base py-6">
                {isDownloading ? <Loader className="animate-spin mr-2" /> : <Download className="mr-2" />}
                {isDownloading ? 'Baixando...' : 'Baixar Imagem'}
              </Button>
            </div>
          </div>
          {/* Coluna do Conteúdo Textual */}
          <Card className="rounded-3xl border-2 border-primary/20 bg-card shadow-2xl flex flex-col h-full">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start gap-4">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {generatedContent.title}
                </CardTitle>
                <Button onClick={handleCopyToClipboard} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full">
                  {copied ? <Check className="text-green-500" /> : <Copy />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto space-y-6">
              <div>
                <Label className="font-semibold text-base">Legenda</Label>
                <p className="whitespace-pre-line text-muted-foreground mt-2">{generatedContent.body}</p>
              </div>
              <div>
                <Label className="font-semibold text-base">Hashtags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {generatedContent.hashtags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">#{tag}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  return (
    // Container principal que centraliza e define o tamanho máximo
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 h-full flex flex-col">
      {/* O Card agora ocupa toda a altura disponível e é um container flex column */}
      <Card className="w-full h-full flex flex-col rounded-3xl shadow-2xl bg-gradient-to-br from-card to-card/90 border-2 border-primary/20 overflow-hidden">
        <CardHeader className="flex-shrink-0 p-6 border-b border-primary/10">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/10 text-primary rounded-2xl p-3 border border-primary/20">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Criar Conteúdo Estratégico</h1>
              <p className="text-muted-foreground">Preencha os campos para gerar um post completo com IA.</p>
            </div>
          </div>
          {team && (
            <div className="mt-4 flex items-center gap-2 text-sm text-accent font-medium">
              <Zap className="h-4 w-4" />
              <span>{team.credits.contentSuggestions} créditos de criação restantes</span>
            </div>
          )}
        </CardHeader>

        {/* O CardContent é a área que vai ter scroll, se necessário */}
        <CardContent className="flex-grow p-6 overflow-y-auto space-y-8">
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campos do formulário */}
            {/* Marca e Tema */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="brand" className="font-semibold">Marca *</Label>
                <Select onValueChange={handleBrandChange} value={formData.brand}>
                  <SelectTrigger className="h-12 rounded-lg border-2"><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                  <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme" className="font-semibold">Tema Estratégico *</Label>
                <Select onValueChange={handleThemeChange} value={formData.theme} disabled={!formData.brand}>
                  <SelectTrigger className="h-12 rounded-lg border-2"><SelectValue placeholder={!formData.brand ? "Primeiro, escolha a marca" : "Selecione o tema"} /></SelectTrigger>
                  <SelectContent>{filteredThemes.map(t => <SelectItem key={t.id} value={t.title}>{t.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Objetivo */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="objective" className="font-semibold">Objetivo do Post *</Label>
              <Textarea id="objective" placeholder="Ex: Gerar engajamento, anunciar um novo produto..." value={formData.objective} onChange={handleInputChange} className="min-h-[100px] rounded-lg border-2" />
            </div>

            {/* Plataforma e Público */}
            <div className="space-y-2">
              <Label htmlFor="platform" className="font-semibold">Plataforma *</Label>
              <Select onValueChange={handlePlatformChange} value={formData.platform}>
                <SelectTrigger className="h-12 rounded-lg border-2"><SelectValue placeholder="Onde será postado?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Twitter">Twitter (X)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience" className="font-semibold">Público-Alvo *</Label>
              <Input id="audience" placeholder="Ex: Jovens de 18-25 anos" value={formData.audience} onChange={handleInputChange} className="h-12 rounded-lg border-2" />
            </div>

            {/* Descrição e Tom */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description" className="font-semibold">Descrição Visual da Imagem *</Label>
              <Textarea id="description" placeholder="Descreva o que você quer ver na imagem. Seja detalhista!" value={formData.description} onChange={handleInputChange} className="min-h-[120px] rounded-lg border-2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone" className="font-semibold">Tom de Voz *</Label>
              <Input id="tone" placeholder="Ex: Profissional, divertido, elegante" value={formData.tone} onChange={handleInputChange} className="h-12 rounded-lg border-2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalInfo" className="font-semibold">Informações Extras</Label>
              <Input id="additionalInfo" placeholder="Cores, elementos obrigatórios, etc." value={formData.additionalInfo} onChange={handleInputChange} className="h-12 rounded-lg border-2" />
            </div>
          </div>
        </CardContent>

        {/* Footer fixo do card */}
        <div className="p-6 border-t border-primary/10 flex-shrink-0">
          <Button onClick={handleGenerateContent} disabled={loading || !isFormValid()} className="w-full h-14 rounded-xl text-lg font-semibold">
            {loading ? (
              <><Loader className="animate-spin mr-3" /> Gerando...</>
            ) : (
              <><Sparkles className="mr-3" /> Gerar Conteúdo</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}