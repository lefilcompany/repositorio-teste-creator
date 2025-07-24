'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button'; // Importando o Button da shadcn
import { Input } from '@/components/ui/input';   // Importando o Input da shadcn
import { Label } from '@/components/ui/label';   // Importando o Label da shadcn

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState<string>(''); // Estado para o input do usuário
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt) {
      setError('Por favor, descreva a imagem que você quer gerar.');
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Adicionando o header correto
        },
        // Enviando o prompt no corpo da requisição
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar a imagem. Tente novamente.');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Gerador de Imagens com IA</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Descreva a imagem que você deseja criar e deixe a mágica acontecer.
        </p>

        {/* Formulário com os componentes da shadcn/ui */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="w-full text-left">
            <Label htmlFor="prompt-input" className="sr-only">
              Descrição da Imagem
            </Label>
            <Input
              id="prompt-input"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Um gato astronauta em marte, arte digital"
              className="flex-grow"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerateImage();
              }}
            />
          </div>
          <Button onClick={handleGenerateImage} disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Gerando...' : 'Gerar Imagem'}
          </Button>
        </div>

        {error && <p className="text-destructive mt-4">{error}</p>}

        <div className="mt-8 w-full aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
          {loading && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Criando algo incrível...</p>
            </div>
          )}
          {imageUrl && !loading && (
            <img
              src={imageUrl}
              alt={prompt} // Usando o prompt como alt text para acessibilidade
              className="rounded-lg object-cover w-full h-full"
            />
          )}
          {!imageUrl && !loading && (
            <p className="text-muted-foreground">Sua imagem aparecerá aqui.</p>
          )}
        </div>
      </div>
    </div>
  );
}