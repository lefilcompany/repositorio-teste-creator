'use client';

import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Image as ImageIcon, Sparkles, ArrowLeft, UploadCloud, CheckCircle } from 'lucide-react';

export default function Revisar() {
  const [brandTheme, setBrandTheme] = useState('');
  const [adjustmentsPrompt, setAdjustmentsPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [revisedImageUrl, setRevisedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isResultView, setIsResultView] = useState<boolean>(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("O arquivo de imagem não pode exceder 4MB.");
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleGenerateReview = async () => {
    if (!imageFile || !adjustmentsPrompt) {
      setError('Por favor, envie uma imagem e descreva os ajustes desejados.');
      return;
    }
    setLoading(true);
    setError(null);
    setIsResultView(true);

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', adjustmentsPrompt);
    formData.append('brandTheme', brandTheme);

    try {
      const response = await fetch('/api/revisar-imagem', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao revisar a imagem.');
      }

      const data = await response.json();
      setRevisedImageUrl(data.imageUrl);
    } catch (err: any)      {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBackToForm = () => {
    setIsResultView(false);
    setImageFile(null);
    setPreviewUrl(null);
    setRevisedImageUrl(null);
    setError(null);
  };

  if (!isResultView) {
    return (
      <div className="w-full max-w-4xl p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl bg-card border-2 border-primary/20 flex flex-col">
        <div className="flex items-start gap-4 mb-8">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Revisar Conteúdo
            </h1>
            <p className="text-muted-foreground">
              Refine uma imagem existente com a ajuda da IA para um resultado perfeito.
            </p>
          </div>
        </div>

        {/* Corpo do Formulário */}
        <div className="overflow-y-auto flex-grow pr-2 -mr-2 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="brandTheme">Marca e Tema Estratégico</Label>
            <Input id="brandTheme" placeholder="Ex: Nike, campanha de verão" value={brandTheme} onChange={(e) => setBrandTheme(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2 flex flex-col">
              <Label htmlFor="file-upload">Arquivo</Label>
              <div className="relative mt-2 flex flex-grow justify-center rounded-lg border border-dashed border-border p-6 h-full items-center">
                <div className="text-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Pré-visualização" className="mx-auto h-40 w-auto rounded-lg object-contain" />
                  ) : (
                    <>
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">Arraste e solte a imagem aqui</p>
                    </>
                  )}
                  <input id="file-upload" name="file-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/png, image/jpeg" onChange={handleImageChange} />
                </div>
              </div>
            </div>

            <div className="space-y-2 flex flex-col">
              <Label htmlFor="adjustmentsPrompt">Texto (Ajustes Desejados)</Label>
              <Textarea
                id="adjustmentsPrompt"
                placeholder="Escreva mais informações relevantes para a revisão do conteúdo. Ex: 'Remova o logo no canto inferior', 'deixe o fundo mais vibrante'..."
                value={adjustmentsPrompt}
                onChange={(e) => setAdjustmentsPrompt(e.target.value)}
                className="flex-grow min-h-[220px] resize-none" // Altura mínima garantida
              />
            </div>
          </div>
        </div>
        <div className="mt-8 flex-shrink-0">
          <Button onClick={handleGenerateReview} disabled={loading || !imageFile || !adjustmentsPrompt} className="w-full rounded-full text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105">
            {loading ? <><Loader className="animate-spin mr-2" /> Revisando...</> : <><Sparkles className="mr-2" />Revisar Conteúdo</>}
          </Button>
          {error && <p className="text-destructive mt-4 text-center">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-7xl mx-auto h-full items-center">
      <div className="space-y-4">
        <h3 className="text-center text-lg font-semibold text-muted-foreground">Original</h3>
        <div className="w-full aspect-square bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-secondary relative overflow-hidden shadow-lg">
            {previewUrl && <img src={previewUrl} alt="Imagem original" className="rounded-2xl object-cover w-full h-full" />}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-center text-lg font-semibold text-primary">Imagem Revisada</h3>
        <div className="w-full aspect-square bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-primary relative overflow-hidden shadow-lg">
          {loading && <div className="flex flex-col items-center text-center"><div className="animate-pulse"><ImageIcon size={64} className="text-primary" /></div><p className="mt-4 text-muted-foreground">Refinando sua imagem...</p></div>}
          {revisedImageUrl && !loading && <img src={revisedImageUrl} alt="Imagem revisada pela IA" className="rounded-2xl object-cover w-full h-full" />}
          {error && !loading && <p className="text-destructive p-4 text-center">{error}</p>}
        </div>
      </div>
      <div className="col-span-1 md:col-span-2">
         <Button onClick={handleGoBackToForm} variant="outline" className="w-full rounded-full text-lg px-8 py-6">
            <ArrowLeft className="mr-2" />
            Revisar Outro Post
          </Button>
      </div>
    </div>
  );
}