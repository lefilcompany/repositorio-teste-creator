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

const saveActionToHistory = (actionData: any) => {
    const history = JSON.parse(localStorage.getItem('creator-action-history') || '[]');
    const newAction = {
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
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

  const [brands, setBrands] = useState<Brand[]>([]);
  const [themes, setThemes] = useState<StrategicTheme[]>([]);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isResultView, setIsResultView] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedBrands = localStorage.getItem('creator-brands');
      if (storedBrands) {
        setBrands(JSON.parse(storedBrands));
      }
      const storedThemes = localStorage.getItem('creator-themes');
      if (storedThemes) {
        setThemes(JSON.parse(storedThemes));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleBrandChange = (value: string) => {
    setFormData((prev) => ({ ...prev, brand: value }));
  };

  const handleThemeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, theme: value }));
  };

  const handlePlatformChange = (value: string) => {
    setFormData((prev) => ({ ...prev, platform: value }));
  };

  const handleGenerateContent = async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);
    setGeneratedContent(null);
    setIsResultView(true);

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
      setImageUrl(data.imageUrl);
      setGeneratedContent({
        title: data.title,
        body: data.body,
        hashtags: data.hashtags,
      });

      saveActionToHistory({
        type: 'Criar conteúdo',
        brand: formData.brand,
        details: {
          theme: formData.theme,
          objective: formData.objective,
          platform: formData.platform,
          description: formData.description,
          audience: formData.audience,
          tone: formData.tone,
        },
        result: {
          imageUrl: data.imageUrl,
          title: data.title,
          body: data.body,
          hashtags: data.hashtags,
        },
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBackToForm = () => {
    setIsResultView(false);
    setImageUrl(null);
    setGeneratedContent(null);
    setError(null);
  }

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
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isResultView) {
    return (
      <div className="w-full max-w-4xl h-full mx-auto p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl bg-card border-2 border-primary/20 flex flex-col">
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
                <Select onValueChange={handleThemeChange} value={formData.theme}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tema" /></SelectTrigger>
                  <SelectContent>
                    {themes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.name}>{theme.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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

        <div className="mt-8 flex-shrink-0">
          <Button onClick={handleGenerateContent} className="w-full rounded-full text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105">
            {loading ? <><Loader className="animate-spin mr-2" /> Gerando...</> : <><Sparkles className="mr-2" />Gerar Conteúdo</>}
          </Button>
          {error && <p className="text-destructive mt-4 text-center">{error}</p>}
        </div>
      </div >
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl mx-auto h-full">
      <div className="w-full aspect-square bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-secondary relative overflow-hidden shadow-lg self-center group">
        {loading && <div className="flex flex-col items-center text-center"><div className="animate-pulse"><ImageIcon size={64} className="text-primary" /></div><p className="mt-4 text-muted-foreground">Criando algo incrível...</p></div>}
        {imageUrl && !loading && (
          <>
            <img src={imageUrl} alt="Imagem gerada pela IA" className="rounded-2xl object-cover w-full h-full" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button onClick={handleDownloadImage} disabled={isDownloading} className="rounded-full text-lg px-8 py-6">
                {isDownloading ? (
                  <><Loader className="animate-spin mr-2" /> Baixando...</>
                ) : (
                  <><Download className="mr-2" /> Baixar Imagem</>
                )}
              </Button>
            </div>
          </>
        )}
        {error && !loading && <p className="text-destructive p-4">{error}</p>}
      </div>

      <div className="w-full bg-card rounded-2xl shadow-lg border-2 border-secondary/20 flex flex-col overflow-hidden">
        <div className="p-6 text-left space-y-4 overflow-y-auto flex-grow">
          {loading && <div className="flex flex-col items-center justify-center h-full"><p className="text-muted-foreground animate-pulse">Gerando legenda e hashtags...</p></div>}
          {generatedContent && (
            <>
              <h2 className="text-2xl font-bold text-primary">{generatedContent.title}</h2>
              <p className="text-foreground whitespace-pre-line">{generatedContent.body}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {generatedContent.hashtags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">#{tag}</span>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="p-6 border-t flex-shrink-0">
          <Button onClick={handleGoBackToForm} variant="outline" className="w-full rounded-full text-lg px-8 py-6">
            <ArrowLeft className="mr-2" />
            Criar Novo Post
          </Button>
        </div>
      </div>
    </div>
  )
}