// components/content/revisionForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Wand2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface RevisionFormProps {
  content: {
    imageUrl: string;
    title: string;
    body: string;
    hashtags: string[];
    revisions: number;
    brand?: string;
    theme?: string;
  };
  revisionType: 'image' | 'text';
  onRevisionComplete: (updatedContent: any) => void;
  onCancel: () => void;
}

export default function RevisionForm({ content, revisionType, onRevisionComplete, onCancel }: RevisionFormProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!prompt) {
      toast.error('Por favor, descreva os ajustes desejados.');
      return;
    }
    setLoading(true);

    try {
      let updatedContent;
      if (revisionType === 'image') {
        const formData = new FormData();
        // Precisamos buscar a imagem original para enviar
        const imageResponse = await fetch(content.imageUrl);
        const imageBlob = await imageResponse.blob();
        formData.append('image', imageBlob, 'original-image.png');
        formData.append('prompt', prompt);
        formData.append('brand', content.brand || '');
        formData.append('theme', content.theme || '');

        const response = await fetch('/api/refatorar-image', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error((await response.json()).error || 'Falha ao revisar imagem.');
        
        const data = await response.json();
        updatedContent = { ...content, imageUrl: data.imageUrl, revisions: content.revisions + 1 };

      } else { // revisionType === 'text'
        const response = await fetch('/api/refatorar-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            originalTitle: content.title,
            originalBody: content.body,
            originalHashtags: content.hashtags,
            brand: content.brand,
            theme: content.theme,
          }),
        });

        if (!response.ok) throw new Error((await response.json()).error || 'Falha ao revisar legenda.');
        
        const data = await response.json();
        updatedContent = { ...content, ...data, revisions: content.revisions + 1 };
      }
      
      onRevisionComplete(updatedContent);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full flex items-center justify-center">
      <div className="w-full max-w-2xl bg-card p-8 rounded-2xl shadow-2xl border-2 border-primary/20 space-y-6">
        <h2 className="text-2xl font-bold">Revisar {revisionType === 'image' ? 'Imagem' : 'Legenda'}</h2>
        <p className="text-muted-foreground">
          Descreva detalhadamente os ajustes que você deseja fazer. A IA usará sua descrição e o conteúdo original como base.
        </p>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="prompt">Prompt de Ajuste</Label>
          <Textarea
            id="prompt"
            placeholder={revisionType === 'image' ? "Ex: Deixe o fundo mais escuro e adicione um brilho dourado ao produto." : "Ex: Faça a legenda mais curta e com um tom mais divertido."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[150px]"
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="w-full sm:flex-1">
            {loading ? <Loader className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
            {loading ? 'Revisando...' : 'Gerar Revisão'}
          </Button>
        </div>
      </div>
    </div>
  );
}