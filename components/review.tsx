// components/review.tsx
'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, Image as ImageIcon, Sparkles, ArrowLeft, CheckCircle, MessageSquareQuote, ThumbsUp, Zap } from 'lucide-react';
import type { Brand } from '@/types/brand';
import type { StrategicTheme } from '@/types/theme';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/types/team';
import { toast } from 'sonner';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

// Função auxiliar para salvar no histórico via API
const saveActionToHistory = async (actionData: any, teamId: string, userId: string, brandName: string, brands: Brand[]) => {
  try {
    const brandData = brands.find(b => b.name === brandName);
    if (brandData) {
      await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'REVISAR_CONTEUDO',
          teamId,
          userId,
          brandId: brandData.id,
          details: actionData.details,
          result: actionData.result,
        }),
      });
    }
  } catch (error) {
    // Error saving action - handle silently or with proper error handling
  }
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
  const [filteredThemes, setFilteredThemes] = useState<StrategicTheme[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.teamId || !user.id) return;

      try {
        const [brandsRes, themesRes, teamsRes] = await Promise.all([
          fetch(`/api/brands?teamId=${user.teamId}`),
          fetch(`/api/themes?teamId=${user.teamId}`),
          fetch(`/api/teams?userId=${user.id}`)
        ]);

        if (brandsRes.ok) {
          const brandsData: Brand[] = await brandsRes.json();
          setBrands(brandsData);
        }

        if (themesRes.ok) {
          const themesData: StrategicTheme[] = await themesRes.json();
          setThemes(themesData);
        }

        if (teamsRes.ok) {
          const teamsData: Team[] = await teamsRes.json();
          const currentTeam = teamsData.find(t => t.id === user.teamId);
          if (currentTeam) setTeam(currentTeam);
        }
      } catch (error) {
        // Error loading data - handle silently or with proper error handling
      }
    };

    loadData();
  }, [user]);

  // Filtrar temas quando a marca for selecionada
  useEffect(() => {
    if (brand && brands.length > 0 && themes.length > 0) {
      const selectedBrand = brands.find(b => b.name === brand);
      if (selectedBrand) {
        const brandThemes = themes.filter(theme => theme.brandId === selectedBrand.id);
        setFilteredThemes(brandThemes);
      }
    } else {
      setFilteredThemes([]);
      setTheme(''); // Limpar tema selecionado quando marca mudar
    }
  }, [brand, brands, themes]);

  const handleBrandChange = (value: string) => {
    setBrand(value);
    setTheme(''); // Resetar tema quando marca mudar
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
    if (!imageFile || !adjustmentsPrompt) {
      setError('Por favor, envie uma imagem e descreva os ajustes desejados.');
      return;
    }
    if (!team) return;
    if (team.credits.contentReviews <= 0) {
      setError('Seus créditos para revisões de conteúdo acabaram.');
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

      // NÃO salva automaticamente no histórico - será salvo apenas quando o usuário aprovar
      // await saveActionToHistory({
      //   details: {
      //     prompt: adjustmentsPrompt,
      //     theme: theme,
      //   },
      //   result: {
      //     feedback: data.feedback,
      //     originalImage: originalImageBase64,
      //   },
      // }, team.id, user?.id || '', brand, brands);

      // Atualizar créditos no banco de dados
      if (team && user?.id) {
        try {
          const updatedCredits = { ...team.credits, contentReviews: team.credits.contentReviews - 1 };
          const updateRes = await fetch('/api/teams', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: team.id, credits: updatedCredits }),
          });

          if (updateRes.ok) {
            const updatedTeam = await updateRes.json();
            setTeam(updatedTeam);
          }
        } catch (error) {
          // Error updating team credits - handle silently or with proper error handling
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

  const handleApproveReview = async () => {
    if (!revisedText || !previewUrl) return;

    try {
      const originalImageBase64 = await fileToBase64(imageFile!);
      await saveActionToHistory({
        details: {
          prompt: adjustmentsPrompt,
          brand: brand,
          theme: theme,
        },
        result: {
          feedback: revisedText,
          originalImage: originalImageBase64,
        },
      }, team!.id, user?.id || '', brand, brands);

      toast.success('Análise aprovada e salva no histórico!');
      handleGoBackToForm();
    } catch (error) {
      toast.error('Erro ao salvar no histórico');
    }
  };

  if (!isResultView) {
    return (
      <div className="min-h-full w-full">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Card */}
          <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">
                      Revisar Conteúdo
                    </h1>
                    <p className="text-muted-foreground text-base">
                      Receba sugestões da IA para aprimorar sua imagem
                    </p>
                  </div>
                </div>
                {team && (
                  <div className="flex items-center gap-3">
                    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 backdrop-blur-sm shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-sm opacity-40"></div>
                            <div className="relative bg-gradient-to-r from-primary to-secondary text-white rounded-full p-2">
                              <Zap className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                {team.credits?.contentReviews || 0}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">revisões restantes</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Main Content with proper padding */}
          <div className="flex flex-col gap-6">
            {/* Configuration Panel */}
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Configuração Básica
                </h2>
                <p className="text-muted-foreground text-sm">Defina marca e tema</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="brand" className="text-sm font-semibold text-foreground">Marca *</Label>
                    <Select onValueChange={handleBrandChange} value={brand}>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Selecione a marca" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/20">
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.name} className="rounded-lg">{brand.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="theme" className="text-sm font-semibold text-foreground">Tema Estratégico *</Label>
                    <Select onValueChange={setTheme} value={theme} disabled={!brand || filteredThemes.length === 0}>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 disabled:opacity-50 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder={!brand ? "Primeiro, escolha a marca" : filteredThemes.length === 0 ? "Nenhum tema disponível" : "Selecione o tema"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/20">
                        {filteredThemes.map((theme) => (
                          <SelectItem key={theme.id} value={theme.title} className="rounded-lg">{theme.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Analysis Panel */}
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-secondary/5 to-accent/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  Análise da Imagem
                </h2>
                <p className="text-muted-foreground text-sm">Upload e descrição dos ajustes</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="file-upload" className="text-sm font-semibold text-foreground">Sua Imagem *</Label>
                    <div className="relative mt-2 flex justify-center rounded-xl border-2 border-dashed border-border/50 p-8 h-64 items-center hover:border-primary/50 transition-all duration-300">
                      <div className="text-center">
                        {previewUrl ? (
                          <Image src={previewUrl} alt="Pré-visualização" width={200} height={192} className="mx-auto h-48 w-auto rounded-lg object-contain" />
                        ) : (
                          <>
                            <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground/50" />
                            <p className="mt-4 text-base text-muted-foreground">Arraste e solte a imagem aqui</p>
                          </>
                        )}
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept="image/png, image/jpeg"
                          onChange={handleImageChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="adjustmentsPrompt" className="text-sm font-semibold text-foreground">O que você gostaria de ajustar? *</Label>
                    <Textarea
                      id="adjustmentsPrompt"
                      placeholder="Descreva o objetivo e o que você espera da imagem. Ex: 'Quero que a imagem transmita mais energia e seja mais vibrante'"
                      value={adjustmentsPrompt}
                      onChange={(e) => setAdjustmentsPrompt(e.target.value)}
                      className="h-64 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 resize-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Button Section */}
          <div className="mt-8">
            <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border border-border/20 rounded-2xl shadow-lg backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <Button
                    onClick={handleGenerateReview}
                    disabled={loading || !imageFile || !adjustmentsPrompt}
                    className="w-full max-w-lg h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-secondary hover:from-primary/90 hover:via-purple-600/90 hover:to-secondary/90 shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] border-2 border-white/20"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin mr-3 h-5 w-5" />
                        <span>Analisando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-3 h-5 w-5" />
                        <span>Analisar Imagem</span>
                      </>
                    )}
                  </Button>

                  {/* Form validation indicator */}
                  {(!imageFile || !adjustmentsPrompt) && (
                    <div className="text-center bg-muted/30 p-3 rounded-xl border border-border/30">
                      <p className="text-sm text-muted-foreground">
                        Preencha todos os campos obrigatórios (*) para continuar
                      </p>
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
        {/* Header Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Análise Completa
                  </h1>
                  <p className="text-muted-foreground text-base">
                    Veja as sugestões da IA para sua imagem
                  </p>
                </div>
              </div>
              <Button
                onClick={handleGoBackToForm}
                variant="outline"
                className="rounded-xl px-6 py-3 border-2 border-primary/30 hover:bg-primary/5 transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Analisar Outra Imagem
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Content - Using grid layout like content.tsx */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Original Image */}
          <div className="space-y-6">
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
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
          </div>

          {/* Right Panel - AI Feedback */}
          <div className="space-y-6">
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
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
                      <div className="animate-pulse"><MessageSquareQuote size={64} className="text-primary" /></div>
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
        </div>

        {/* Action Button Section */}
        {revisedText && !loading && (
          <div className="mt-8">
            <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border border-border/20 rounded-2xl shadow-lg backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <Button
                    onClick={handleApproveReview}
                    className="w-full max-w-lg h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] border-2 border-white/20 text-white"
                  >
                    <ThumbsUp className="mr-3 h-5 w-5" />
                    <span>Aprovar e Salvar no Histórico</span>
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