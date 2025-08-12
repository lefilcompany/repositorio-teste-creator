// components/content.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader, Sparkles, Zap, Copy, Check, Download, ArrowLeft, X } from 'lucide-react';
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

interface GeneratedContent {
  imageUrl: string;
  title: string;
  body: string;
  hashtags: string[];
}

// Opções para o Tom de Voz
const toneOptions = [
  'inspirador', 'motivacional', 'profissional', 'casual', 'elegante',
  'moderno', 'tradicional', 'divertido', 'sério'
];

// Função de histórico
const saveActionToHistory = (actionData: any, teamId: string | undefined, userEmail: string | undefined) => {
  if (!teamId || !userEmail) return;
  try {
    const history = JSON.parse(localStorage.getItem('creator-action-history') || '[]');
    const newAction = {
      id: actionData.id || new Date().toISOString() + Math.random(),
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
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    brand: '', theme: '', persona: '', objective: '', platform: '',
    description: '', audience: '', tone: [], additionalInfo: '', // Valor inicial como array vazio
  });

  const [team, setTeam] = useState<Team | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<StrategicTheme[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);

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

        const storedPersonas = JSON.parse(localStorage.getItem('creator-personas') || '[]') as Persona[];
        setPersonas(storedPersonas.filter(p => p.teamId === user.teamId));

        const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
        const currentTeam = teams.find(tm => tm.id === user.teamId);
        if (currentTeam) setTeam(currentTeam);
      }
    } catch (e) {
      console.error('Falha ao carregar dados do localStorage', e);
      toast.error('Houve um problema ao carregar seus dados. Tente recarregar a página.');
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (field: keyof FormData, value: string) => {
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
      const contentType = response.headers.get('Content-Type') || 'image/png';
      const extension = contentType.includes('jpeg') ? 'jpeg' : 'png';
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `creator-ai-${Date.now()}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar a imagem:", err);
      toast.error("Não foi possível baixar a imagem.");
    } finally {
      setIsDownloading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
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

    setLoading(true);
    setShowResults(false);

    try {
      const base64Image = await fileToBase64(referenceImage);
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: formData.description,
          ...formData,
          referenceImage: base64Image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o conteúdo.');
      }

      const data = await response.json();

      const actionId = `gen-${Date.now()}`;
      const resultData = {
        imageUrl: data.imageUrl,
        title: data.title,
        body: data.body,
        hashtags: data.hashtags,
        revisions: 0,
        brand: formData.brand,
        theme: formData.theme,
        originalActionId: actionId
      };

      localStorage.setItem('generatedContent', JSON.stringify(resultData));

      saveActionToHistory({
        id: actionId,
        type: 'Criar conteúdo',
        brand: formData.brand,
        theme: formData.theme,
        platform: formData.platform,
        details: { ...formData },
        result: { ...data },
        status: 'Em revisão'
      }, user?.teamId, user?.email);

      const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
      const teamIndex = teams.findIndex(t => t.id === team.id);
      if (teamIndex > -1) {
        teams[teamIndex].credits.contentSuggestions -= 1;
        localStorage.setItem('creator-teams', JSON.stringify(teams));
        setTeam(teams[teamIndex]);
      }

      router.push('/content/result');

    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar o conteúdo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setShowResults(false);
    setGeneratedContent(null);
    setFormData({
      brand: '', theme: '', persona: '', objective: '', platform: '',
      description: '', audience: '', tone: [], additionalInfo: '',
    });
    setFilteredThemes([]);
    setReferenceImage(null);
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
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {generatedContent.title}
                </h2>
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
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 h-full flex flex-col">
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

        <CardContent className="flex-grow p-6 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="brand" className="font-semibold">Marca *</Label>
                <Select onValueChange={(value) => handleSelectChange('brand', value)} value={formData.brand}>
                  <SelectTrigger className="h-12 rounded-lg border-2"><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                  <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme" className="font-semibold">Tema Estratégico *</Label>
                <Select onValueChange={(value) => handleSelectChange('theme', value)} value={formData.theme} disabled={!formData.brand}>
                  <SelectTrigger className="h-12 rounded-lg border-2"><SelectValue placeholder={!formData.brand ? "Primeiro, escolha a marca" : "Selecione o tema"} /></SelectTrigger>
                  <SelectContent>{filteredThemes.map(t => <SelectItem key={t.id} value={t.title}>{t.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="persona" className="font-semibold">Persona (Opcional)</Label>
              <Select onValueChange={(value) => handleSelectChange('persona', value)} value={formData.persona} disabled={!formData.brand}>
                <SelectTrigger className="h-12 rounded-lg border-2"><SelectValue placeholder={!formData.brand ? "Primeiro, escolha a marca" : "Selecione uma persona"} /></SelectTrigger>
                <SelectContent>{personas.filter(p => p.brandId === brands.find(b => b.name === formData.brand)?.id).map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="objective" className="font-semibold">Objetivo do Post *</Label>
              <Textarea id="objective" placeholder="Ex: Gerar engajamento, anunciar um novo produto..." value={formData.objective} onChange={handleInputChange} className="min-h-[100px] rounded-lg border-2" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform" className="font-semibold">Plataforma *</Label>
              <Select onValueChange={(value) => handleSelectChange('platform', value)} value={formData.platform}>
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

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description" className="font-semibold">Descrição Visual da Imagem *</Label>
              <Textarea id="description" placeholder="Descreva o que você quer ver na imagem. Seja detalhista!" value={formData.description} onChange={handleInputChange} className="min-h-[120px] rounded-lg border-2" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="referenceImage" className="font-semibold">Imagem Exemplo *</Label>
              <Input id="referenceImage" type="file" accept="image/*" onChange={(e) => setReferenceImage(e.target.files?.[0] || null)} className="h-12 rounded-lg border-2" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="tone" className="font-semibold">Tom de Voz * (máx. 4)</Label>
              <Select onValueChange={handleToneSelect} value="">
                <SelectTrigger className="h-12 rounded-lg border-2 text-muted-foreground">
                  <SelectValue placeholder="Adicionar tom de voz..." />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map(option => (
                    <SelectItem key={option} value={option} disabled={formData.tone.includes(option)}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.tone.map(tone => (
                  <div key={tone} className="flex items-center gap-1 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    <button onClick={() => handleToneRemove(tone)} className="ml-1 text-primary hover:text-destructive">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="additionalInfo" className="font-semibold">Informações Extras</Label>
              <Textarea id="additionalInfo" placeholder="Cores, elementos obrigatórios, etc." value={formData.additionalInfo} onChange={handleInputChange} className="min-h-[120px] rounded-lg border-2" />
            </div>
          </div>
        </CardContent>

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