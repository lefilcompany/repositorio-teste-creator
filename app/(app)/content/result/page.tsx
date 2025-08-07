// app/(app)/content/result/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, Download, ArrowLeft, Copy, Check } from 'lucide-react';

interface GeneratedContent {
  imageUrl: string;
  title: string;
  body: string;
  hashtags: string[];
}

export default function ResultPage() {
  const router = useRouter();
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const storedContent = localStorage.getItem('generatedContent');
      if (storedContent) {
        setContent(JSON.parse(storedContent));
        // Opcional: Limpar o localStorage após o uso para não mostrar o mesmo resultado ao recarregar a página
        // localStorage.removeItem('generatedContent');
      } else {
        throw new Error("Nenhum conteúdo gerado encontrado. Por favor, tente novamente.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDownloadImage = async () => {
    if (!content?.imageUrl) return;
    setIsDownloading(true);
    try {
      // Usando um proxy para evitar problemas com CORS
      const response = await fetch(`/api/download-image?url=${encodeURIComponent(content.imageUrl)}`);
      if (!response.ok) throw new Error("Falha ao buscar a imagem.");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'creator-ai-image.png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar a imagem:", err);
      setError("Não foi possível baixar a imagem. Tente abrir em uma nova aba e salvar manualmente.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!content) return;
    const fullText = `${content.title}\n\n${content.body}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Resetar o estado após 2 segundos
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !content) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-bold text-destructive mb-4">Ocorreu um Erro</h2>
        <p className="text-muted-foreground mb-6">{error || "Não foi possível carregar o conteúdo."}</p>
        <Button onClick={() => router.push('/content')}>
          <ArrowLeft className="mr-2" />
          Voltar e Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl mx-auto h-full">
        
        {/* Coluna da Imagem */}
        <div className="flex flex-col gap-4 h-full">
          <Card className="flex-grow w-full aspect-square bg-muted/30 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg border-2 border-primary/10">
            {content.imageUrl ? (
              <img src={content.imageUrl} alt="Imagem Gerada pela IA" className="object-contain w-full h-full" />
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Nenhuma imagem gerada</p>
              </div>
            )}
          </Card>
          <div className="flex gap-4">
             <Button onClick={() => router.push('/content')} variant="outline" className="w-full rounded-full text-base py-6">
              <ArrowLeft className="mr-2" />
              Criar Outro
            </Button>
            <Button onClick={handleDownloadImage} disabled={isDownloading} className="w-full rounded-full text-base py-6">
              {isDownloading ? <Loader className="animate-spin mr-2" /> : <Download className="mr-2" />}
              {isDownloading ? 'Baixando...' : 'Baixar Imagem'}
            </Button>
          </div>
        </div>

        {/* Coluna do Texto */}
        <div className="flex flex-col h-full">
          <Card className="w-full h-full bg-card rounded-2xl p-6 shadow-lg border-2 border-primary/10 flex flex-col">
            <CardHeader className="p-0 pb-4 flex-row justify-between items-center">
              <CardTitle className="text-2xl font-bold text-foreground">{content.title}</CardTitle>
              <Button onClick={handleCopyToClipboard} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                {copied ? <Check className="text-green-500" /> : <Copy />}
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-grow overflow-y-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none text-left">
                <p className="whitespace-pre-line text-base text-muted-foreground">{content.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {content.hashtags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}