// components/review.tsx
'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, Image as ImageIcon, Sparkles, ArrowLeft, CheckCircle, MessageSquareQuote } from 'lucide-react';
import type { Brand } from '@/types/brand';
import type { StrategicTheme } from '@/types/theme';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/types/team';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

// Função auxiliar para salvar no histórico
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

export default function Revisar() {
  const [brand, setBrand] = useState('');
  const [theme, setTheme] = useState('');
  const [adjustmentsPrompt, setAdjustmentsPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [revisedText, setRevisedText] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isResultView, setIsResultView] = useState<boolean>(false);
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [themes, setThemes] = useState<StrategicTheme[]>([]);

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
      console.error('Failed to load data from localStorage', error);
    }
  }, [user]);

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
    if (!team) return;
    if (team.credits.contentReviews <= 0) {
      setError('Seus créditos para revisões acabaram.');
      setIsResultView(false);
      return;
    }
    setLoading(true);
    setError(null);
    setRevisedText(null);
    setIsResultView(true);

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', adjustmentsPrompt);
    formData.append('brand', brand);
    formData.append('theme', theme);

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
      setRevisedText(data.feedback);

      // ADICIONAR ESTA PARTE: Salvar no histórico
      const originalImageBase64 = await fileToBase64(imageFile);
      saveActionToHistory({
        type: 'Revisar conteúdo',
        brand: brand,
        details: {
          prompt: adjustmentsPrompt,
          theme: theme,
        },
        result: {
          feedback: data.feedback,
          originalImage: originalImageBase64,
        },
      }, team.id, user?.email || '');

      const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
      const idx = teams.findIndex(t => t.id === team.id);
      if (idx > -1) {
        teams[idx].credits.contentReviews -= 1;
        localStorage.setItem('creator-teams', JSON.stringify(teams));
        setTeam(teams[idx]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBackToForm = () => {
    setIsResultView(false);
    setImageFile(null);
    setPreviewUrl(null);
    setRevisedText(null);
    setError(null);
    setBrand('');
    setTheme('');
    setAdjustmentsPrompt('');
  };

  if (!isResultView) {
    return (
      <div className="w-full max-w-4xl p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl bg-card border-2 border-primary/20 flex flex-col">
        <div className="flex items-start gap-4 mb-8">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Revisar Conteúdo</h1>
            <p className="text-muted-foreground">
              Receba sugestões da IA para aprimorar sua imagem.
            </p>
          </div>
        </div>

        {/* Corpo do Formulário */}
        <div className="overflow-y-auto flex-grow pr-2 -mr-2 space-y-6">
          <div className='flex flex-col md:flex-row justify-between items-center md:col-span-2 gap-6'>
            <div className="w-full space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Select onValueChange={setBrand} value={brand}>
                <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="theme">Tema Estratégico</Label>
              <Select onValueChange={setTheme} value={theme}>
                <SelectTrigger><SelectValue placeholder="Selecione o tema" /></SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.title}>{theme.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2 flex flex-col">
              <Label htmlFor="file-upload">Sua Imagem</Label>
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
              <Label htmlFor="adjustmentsPrompt">O que você gostaria de ajustar?</Label>
              <Textarea
                id="adjustmentsPrompt"
                placeholder="Descreva o objetivo e o que você espera da imagem. Ex: 'Quero que a imagem transmita mais energia e seja mais vibrante'"
                value={adjustmentsPrompt}
                onChange={(e) => setAdjustmentsPrompt(e.target.value)}
                className="flex-grow min-h-[220px] resize-none"
              />
            </div>
          </div>
        </div>
        <div className="mt-8 flex-shrink-0">
          <Button onClick={handleGenerateReview} disabled={loading || !imageFile || !adjustmentsPrompt} className="w-full rounded-full text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105">
            {loading ? <><Loader className="animate-spin mr-2" /> Analisando...</> : <><Sparkles className="mr-2" />Analisar Imagem</>}
          </Button>
          {error && <p className="text-destructive mt-4 text-center">{error}</p>}
        </div>
      </div>
    );
  }

  // Tela de Resultados com o Feedback em Texto
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl mx-auto h-full">
      {/* Coluna da Imagem Original */}
      <div className="space-y-4 flex flex-col h-full">
        <h3 className="text-center text-lg font-semibold text-muted-foreground">Sua Imagem</h3>
        <div className="w-full aspect-square bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-secondary relative overflow-hidden shadow-lg">
          {previewUrl && <img src={previewUrl} alt="Imagem original" className="rounded-2xl object-cover w-full h-full" />}
        </div>
      </div>
      {/* Coluna do Feedback da IA */}
      <div className="space-y-4 flex flex-col h-full">
        <h3 className="text-center text-lg font-semibold text-primary">Sugestões da IA</h3>
        <div className="w-full h-full bg-card rounded-2xl p-6 shadow-lg border-2 border-primary/20 flex flex-col">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="animate-pulse"><MessageSquareQuote size={64} className="text-primary" /></div>
              <p className="mt-4 text-muted-foreground">Analisando sua imagem...</p>
            </div>
          )}
          {revisedText && !loading && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-left overflow-y-auto h-full">
              {/* Usamos 'whitespace-pre-line' para respeitar as quebras de linha (\n) */}
              <p className="whitespace-pre-line">{revisedText}</p>
            </div>
          )}
          {error && !loading && <p className="text-destructive p-4 text-center">{error}</p>}
        </div>
      </div>
      {/* Botão de Voltar */}
      <div className="col-span-1 lg:col-span-2">
        <Button onClick={handleGoBackToForm} variant="outline" className="w-full rounded-full text-lg px-8 py-6">
          <ArrowLeft className="mr-2" />
          Analisar Outra Imagem
        </Button>
      </div>
    </div>
  );
}