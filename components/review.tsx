'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader, Image as ImageIcon, Sparkles, ArrowLeft, CheckCircle, ThumbsUp, Zap } from 'lucide-react';
import type { Brand } from '@/types/brand';
import type { StrategicTheme } from '@/types/theme';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/types/team';
import { toast } from 'sonner';

// Tipos para os dados leves do formulário
type LightBrand = Pick<Brand, 'id' | 'name'>;
type LightTheme = Pick<StrategicTheme, 'id' | 'title' | 'brandId'>;

export default function Revisar() {
  const { user } = useAuth();
  const [brand, setBrand] = useState('');
  const [theme, setTheme] = useState('');
  const [adjustmentsPrompt, setAdjustmentsPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [revisedText, setRevisedText] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isResultView, setIsResultView] = useState<boolean>(false);

  const [brands, setBrands] = useState<LightBrand[]>([]);
  const [themes, setThemes] = useState<LightTheme[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [filteredThemes, setFilteredThemes] = useState<LightTheme[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.teamId || !user.id) {
        if (user) setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      try {
        const res = await fetch(`/api/review-form-data?teamId=${user.teamId}&userId=${user.id}`);
        if (!res.ok) throw new Error('Failed to load form data');

        const data = await res.json();
        setTeam(data.team);
        setBrands(data.brands);
        setThemes(data.themes);

        // Fetch team data with subscription-based credits
        const teamResponse = await fetch(`/api/teams/${user.teamId}?summary=true`);
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setTeamData(teamData);
        }
      } catch (error) {
        toast.error('Erro ao carregar dados');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (brand) {
      const selectedBrand = brands.find(b => b.name === brand);
      setFilteredThemes(selectedBrand ? themes.filter(t => t.brandId === selectedBrand.id) : []);
    } else {
      setFilteredThemes([]);
    }
  }, [brand, brands, themes]);

  const handleBrandChange = (value: string) => {
    setBrand(value);
    setTheme('');
  };

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
    if (!imageFile || !adjustmentsPrompt) return setError('Por favor, envie uma imagem e descreva os ajustes.');
    if (!team) return;
    
    // Check credits from teamData instead of team.credits
    const availableCredits = teamData?.credits?.contentReviews || 0;
    if (availableCredits <= 0) return setError('Seus créditos para revisões de conteúdo acabaram.');

    setLoading(true);
    setError(null);
    setRevisedText(null);
    setIsResultView(true);

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', adjustmentsPrompt);
    formData.append('brand', brand);
    formData.append('theme', theme);

    if (user?.teamId && user?.id) {
      formData.append('teamId', user.teamId);
      formData.append('userId', user.id);
      const selectedBrand = brands.find(b => b.name === brand);
      if (selectedBrand) formData.append('brandId', selectedBrand.id);
    }

    try {
      const response = await fetch('/api/revisar-imagem', { method: 'POST', body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao revisar a imagem.');
      }

      const data = await response.json();
      setRevisedText(data.feedback);
      toast.success('Revisão gerada e salva no histórico!');

      // Refresh team data with updated credits after action
      if (team && user?.teamId) {
        const teamResponse = await fetch(`/api/teams/${user.teamId}?summary=true`);
        if (teamResponse.ok) {
          const updatedTeamData = await teamResponse.json();
          setTeamData(updatedTeamData);
        }
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
      <div className="min-h-full w-full">
        <div className="max-w-7xl mx-auto space-y-8">
          <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Revisar Conteúdo</h1>
                    <p className="text-muted-foreground text-base">Receba sugestões da IA para aprimorar sua imagem</p>
                  </div>
                </div>
                {isLoadingData ? (
                  <Skeleton className="h-14 w-full sm:w-40 rounded-xl" />
                ) : team && (
                  <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 flex-shrink-0">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-sm opacity-40"></div>
                          <div className="relative bg-gradient-to-r from-primary to-secondary text-white rounded-full p-2">
                            <Zap className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="text-left gap-4 flex justify-center items-center">
                          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            {teamData?.credits?.contentReviews || 0}
                          </span>
                          <p className="text-md text-muted-foreground font-medium leading-tight">
                            Revisões Restantes
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardHeader>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Configuração Básica
                </h2>
                <p className="text-muted-foreground text-sm">Defina marca e tema para contextualizar a IA</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="brand" className="text-sm font-semibold text-foreground">Marca (Opcional)</Label>
                    {isLoadingData ? <Skeleton className="h-11 w-full rounded-xl" /> : (
                      <Select onValueChange={handleBrandChange} value={brand}>
                        <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50">
                          <SelectValue placeholder="Selecione a marca" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/20">
                          {brands.map((b) => <SelectItem key={b.id} value={b.name} className="rounded-lg">{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="theme" className="text-sm font-semibold text-foreground">Tema Estratégico (Opcional)</Label>
                    {isLoadingData ? <Skeleton className="h-11 w-full rounded-xl" /> : (
                      <Select onValueChange={setTheme} value={theme} disabled={!brand || filteredThemes.length === 0}>
                        <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 disabled:opacity-50">
                          <SelectValue placeholder={!brand ? "Primeiro, escolha a marca" : "Selecione o tema"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/20">
                          {filteredThemes.map((t) => <SelectItem key={t.id} value={t.title} className="rounded-lg">{t.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl">
              <CardHeader className="pb-4 bg-gradient-to-r from-secondary/5 to-accent/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  Análise da Imagem
                </h2>
                <p className="text-muted-foreground text-sm">Envie a imagem e descreva o que precisa melhorar</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="file-upload" className="text-sm font-semibold text-foreground">Sua Imagem *</Label>
                    <div className="relative mt-2 flex justify-center rounded-xl border-2 border-dashed border-border/50 p-8 h-64 items-center">
                      <div className="text-center">
                        {previewUrl ? (
                          <Image src={previewUrl} alt="Pré-visualização" width={200} height={192} className="mx-auto h-48 w-auto rounded-lg object-contain" />
                        ) : (
                          <>
                            <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground/50" />
                            <p className="mt-4 text-base text-muted-foreground">Arraste e solte ou clique para enviar</p>
                          </>
                        )}
                        <input id="file-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/png, image/jpeg" onChange={handleImageChange} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="adjustmentsPrompt" className="text-sm font-semibold text-foreground">O que você gostaria de ajustar? *</Label>
                    <Textarea id="adjustmentsPrompt" placeholder="Descreva o objetivo e o que você espera da imagem. Ex: 'Quero que a imagem transmita mais energia e seja mais vibrante'" value={adjustmentsPrompt} onChange={(e) => setAdjustmentsPrompt(e.target.value)} className="h-64 rounded-xl border-2 border-border/50 bg-background/50 resize-none" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border border-border/20 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <Button onClick={handleGenerateReview} disabled={loading || !imageFile || !adjustmentsPrompt} className="w-full max-w-lg h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-secondary hover:from-primary/90 shadow-xl transition-all duration-500 disabled:opacity-50">
                    {loading ? <><Loader className="animate-spin mr-3 h-5 w-5" /><span>Analisando...</span></> : <><Sparkles className="mr-3 h-5 w-5" /><span>Analisar Imagem</span></>}
                  </Button>
                  {(!imageFile || !adjustmentsPrompt) && (
                    <div className="text-center bg-muted/30 p-3 rounded-xl border border-border/30">
                      <p className="text-sm text-muted-foreground">Preencha todos os campos obrigatórios (*) para continuar</p>
                    </div>
                  )}
                  {error && <p className="text-destructive mt-4 text-center text-base">{error}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Análise Completa</h1>
                  <p className="text-muted-foreground text-base">Veja as sugestões da IA para sua imagem</p>
                </div>
              </div>
              <Button onClick={handleGoBackToForm} variant="outline" className="rounded-xl px-6 py-3 border-2 border-primary/30">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Analisar Outra Imagem
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-secondary/5 to-accent/5">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                Sua Imagem
              </h2>
              <p className="text-muted-foreground text-sm">Imagem enviada para análise</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="w-full aspect-square bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-secondary relative overflow-hidden shadow-lg">
                {previewUrl && <Image src={previewUrl} alt="Imagem original" fill className="rounded-2xl object-cover" />}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Sugestões da IA
              </h2>
              <p className="text-muted-foreground text-sm">Análise e recomendações</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="min-h-[400px] bg-card rounded-2xl p-6 shadow-lg border-2 border-primary/20 flex flex-col overflow-hidden">
                {loading && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="animate-pulse">
                      <Sparkles size={64} className="text-primary" />
                    </div>
                    <p className="mt-4 text-muted-foreground text-lg">Analisando sua imagem...</p>
                  </div>
                )}
                {revisedText && !loading && (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-left overflow-y-auto">
                    <p className="whitespace-pre-line text-base leading-relaxed">{revisedText}</p>
                  </div>
                )}
                {error && !loading && <p className="text-destructive p-4 text-center text-base">{error}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {revisedText && !loading && (
          <div className="mt-8">
            <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border border-border/20 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <Button onClick={handleGoBackToForm} className="w-full max-w-lg h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 text-white shadow-xl">
                    <ThumbsUp className="mr-3 h-5 w-5" />
                    <span>Concluir Revisão</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}