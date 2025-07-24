// components/creator.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Importando o novo componente
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importando o novo componente
import { Loader, Image as ImageIcon, Sparkles } from 'lucide-react';

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

    // Constrói o prompt para a IA de imagem
    const imagePrompt = `
      Crie uma imagem profissional para um post na plataforma "${formData.platform}".
      - Marca/Tema: ${formData.brandTheme}.
      - Objetivo do post: ${formData.objective}.
      - Descrição visual da imagem: ${formData.description}.
      - Público-alvo: ${formData.audience}.
      - Tom de voz visual: ${formData.tone}.
      - Informações adicionais importantes: ${formData.additionalInfo}.
      A imagem deve ser de alta qualidade, atraente e seguir um estilo de arte digital moderna.
    `;
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, prompt: imagePrompt }), // Enviando todos os dados + o prompt construido
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

  return (
    <div className="flex flex-col xl:flex-row items-center justify-center min-h-screen bg-background text-foreground p-4 md:p-8 gap-8">
      {/* Formulário de Inputs */}
      <div className="w-full max-w-2xl text-left p-6 md:p-8 rounded-2xl shadow-2xl bg-card border-2 border-primary/20">
        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Creator
        </h1>
        <p className="text-lg text-muted-foreground mb-8">Preencha os campos abaixo para criar seu post.</p>

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
              <SelectTrigger>
                <SelectValue placeholder="Selecione a plataforma" />
              </SelectTrigger>
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
        <Button onClick={handleGenerateContent} disabled={loading} className="w-full mt-8 rounded-full text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105">
          {loading ? (
            <>
              <Loader className="animate-spin mr-2" />
              Gerando Conteúdo...
            </>
          ) : (
            <>
              <Sparkles className="mr-2" />
              Gerar Conteúdo
            </>
          )}
        </Button>
         {error && <p className="text-destructive mt-4 text-center">{error}</p>}
      </div>

      {/* Área de Resultados */}
      <div className="w-full max-w-2xl flex flex-col gap-8">
        {/* Imagem Gerada */}
        <div className="w-full aspect-square bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-secondary relative overflow-hidden shadow-lg">
          {loading && (
            <div className="flex flex-col items-center text-center">
              <div className="animate-pulse"><ImageIcon size={64} className="text-primary" /></div>
              <p className="mt-4 text-muted-foreground">Criando algo incrível...</p>
            </div>
          )}
          {imageUrl && !loading && (
            <img src={imageUrl} alt="Imagem gerada pela IA" className="rounded-2xl object-cover w-full h-full" />
          )}
          {!imageUrl && !loading && (
            <div className="flex flex-col items-center text-center">
              <ImageIcon size={64} className="text-muted-foreground/50" />
              <p className="text-muted-foreground mt-4">Sua imagem aparecerá aqui.</p>
            </div>
          )}
        </div>
        {/* Conteúdo Gerado */}
        <div className="w-full p-6 bg-card rounded-2xl shadow-lg border-2 border-secondary/20 min-h-[200px]">
            {generatedContent && !loading && (
              <div className="text-left space-y-4">
                <h2 className="text-2xl font-bold text-primary">{generatedContent.title}</h2>
                <p className="text-foreground whitespace-pre-line">{generatedContent.body}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {generatedContent.hashtags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!generatedContent && !loading && (
              <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-muted-foreground">O conteúdo do seu post aparecerá aqui.</p>
              </div>
            )}
             {loading && (
              <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-muted-foreground animate-pulse">Gerando legenda e hashtags...</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}