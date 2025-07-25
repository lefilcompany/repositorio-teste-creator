'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, Image as ImageIcon, Sparkles, ArrowLeft } from 'lucide-react';

// Tipagem para os dados do formulário
interface FormData {
  brandTheme: string;
  objective: string;
  platform: string;
  description: string;
  audience: string;
  tone: string;
  additionalInfo: string;
}

// Tipagem para o conteúdo gerado
interface GeneratedContent {
  title: string;
  body: string;
  hashtags: string[];
}

export default function Creator() {
  // CORREÇÃO APLICADA AQUI: Inicializando o estado com todos os campos.
  const [formData, setFormData] = useState<FormData>({
    brandTheme: '',
    objective: '',
    platform: '',
    description: '',
    audience: '',
    tone: '',
    additionalInfo: '',
  });
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isResultView, setIsResultView] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
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

    const imagePrompt = `Crie uma imagem profissional para um post na plataforma "${formData.platform}". - Marca/Tema: ${formData.brandTheme}. - Objetivo do post: ${formData.objective}. - Descrição visual da imagem: ${formData.description}. - Público-alvo: ${formData.audience}. - Tom de voz visual: ${formData.tone}. - Informações adicionais importantes: ${formData.additionalInfo}. A imagem deve ser de alta qualidade, atraente e seguir um estilo de arte digital moderna.`;
    
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

  // Visualização do Formulário
  if (!isResultView) {
    return (
      <div className="w-full max-w-2xl h-full">
        <div className="w-full h-full text-left p-6 md:p-8 rounded-2xl shadow-2xl bg-card border-2 border-primary/20 flex flex-col">
          <div className="mb-8 flex-shrink-0">
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Criar Conteúdo
            </h1>
            <p className="text-lg text-muted-foreground">Preencha os campos abaixo para gerar seu post.</p>
          </div>
          
          <div className="overflow-y-auto flex-grow pr-4 -mr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="brandTheme">Marca e Tema Estratégico</Label>
                <Input id="brandTheme" placeholder="Ex: Nike, campanha de superação" value={formData.brandTheme} onChange={handleInputChange} />
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
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter (X)</SelectItem>
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
              <Sparkles className="mr-2" />
              Gerar Conteúdo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Visualização de Resultados
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl mx-auto h-full">
      <div className="w-full aspect-square bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-secondary relative overflow-hidden shadow-lg self-center">
        {loading && <div className="flex flex-col items-center text-center"><div className="animate-pulse"><ImageIcon size={64} className="text-primary" /></div><p className="mt-4 text-muted-foreground">Criando algo incrível...</p></div>}
        {imageUrl && !loading && <img src={imageUrl} alt="Imagem gerada pela IA" className="rounded-2xl object-cover w-full h-full" />}
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