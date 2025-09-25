'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader, Calendar, ArrowLeft, MessageSquareQuote, Zap, Clipboard, Check, X, Download } from 'lucide-react';
import type { Brand } from '@/types/brand';
import type { StrategicTheme } from '@/types/theme';
import type { Team } from '@/types/team';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';


// Interfaces e Tipos (mantidos como no original)
interface FormData {
  brand: string;
  theme: string[];
  platform: string;
  quantity: number | '';
  objective: string;
  additionalInfo: string;
}
type LightBrand = {
  id: string;
  name: string;
  moodboard?: any;
};
type LightTheme = Pick<StrategicTheme, 'id' | 'title' | 'brandId'>;

export default function Plan() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    brand: '',
    theme: [],
    platform: '',
    quantity: 1,
    objective: '',
    additionalInfo: '',
  });

  const [team, setTeam] = useState<Team | null>(null);
  const [brands, setBrands] = useState<LightBrand[]>([]);
  const [themes, setThemes] = useState<LightTheme[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [filteredThemes, setFilteredThemes] = useState<LightTheme[]>([]);
  const [plannedContent, setPlannedContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isResultView, setIsResultView] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  // Novo estado para armazenar o moodboard da marca selecionada
  const [selectedMoodboard, setSelectedMoodboard] = useState<any>(null);

  // Efeitos e Handlers (mantidos como no original, pois a lógica estava correta)
  useEffect(() => {
    const loadData = async () => {
      console.log('🔍 [Plan] loadData - user:', user);
      console.log('🔍 [Plan] user?.teamId:', user?.teamId);
      console.log('🔍 [Plan] user?.id:', user?.id);
      
      if (!user?.teamId || !user.id) {
        console.log('❌ [Plan] Dados do usuário incompletos, parando loadData');
        if (user) {
          console.log('✅ [Plan] User existe, setando isLoadingData(false)');
          setIsLoadingData(false);
        } else {
          console.log('❌ [Plan] User não existe ainda');
        }
        return;
      }
      console.log('🚀 [Plan] Iniciando carregamento de dados...');
      setIsLoadingData(true);
      try {
        console.log('📡 [Plan] Fazendo fetch para plan-form-data');
        // Fetch form data
        const res = await fetch(`/api/plan-form-data?teamId=${user.teamId}&userId=${user.id}`);
        console.log('📡 [Plan] Resposta da API plan-form-data:', res.status);
        if (!res.ok) throw new Error('Failed to load form data');
        const data = await res.json();
        console.log('📋 [Plan] Dados recebidos:', data);
        setTeam(data.team);
        setBrands(data.brands);
        setThemes(data.themes);
      } catch (error) {
        console.error('❌ [Plan] Erro no loadData:', error);
        toast.error('Erro ao carregar dados do formulário');
      } finally {
        console.log('✅ [Plan] LoadData finalizado, setIsLoadingData(false)');
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (formData.brand) {
      const selectedBrand = brands.find(b => b.name === formData.brand);
      setFilteredThemes(selectedBrand ? themes.filter(t => t.brandId === selectedBrand.id) : []);
      // Atualiza o moodboard da marca selecionada
      setSelectedMoodboard(selectedBrand?.moodboard || null);
    } else {
      setFilteredThemes([]);
      setSelectedMoodboard(null);
    }
  }, [formData.brand, brands, themes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  const handleBrandChange = (value: string) => setFormData((prev) => ({ ...prev, brand: value, theme: [] }));

  const handleThemeSelect = (value: string) => setFormData((prev) => !value || prev.theme.includes(value) ? prev : { ...prev, theme: [...prev.theme, value] });

  const handleThemeRemove = (themeToRemove: string) => setFormData((prev) => ({ ...prev, theme: prev.theme.filter(t => t !== themeToRemove) }));

  const handlePlatformChange = (value: string) => setFormData((prev) => ({ ...prev, platform: value }));

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setFormData(prev => ({ ...prev, quantity: '' }));
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num <= 7) {
      setFormData(prev => ({ ...prev, quantity: num }));
    } else if (!isNaN(num) && num > 7) {
      setFormData(prev => ({ ...prev, quantity: 7 }));
    }
  };

  const handleQuantityBlur = () => {
    if (formData.quantity === '' || formData.quantity < 1) {
      setFormData(prev => ({ ...prev, quantity: 1 }));
    }
  };

  const handleGoBackToForm = () => {
    setIsResultView(false);
    setPlannedContent(null);
    setError(null);
  };

  const handleCopy = () => {
    if (!plannedContent) return;
    navigator.clipboard.writeText(plannedContent).then(() => {
      setIsCopied(true);
      toast.success('Conteúdo copiado!');
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => toast.error('Falha ao copiar.'));
  };

  const handleDownloadPdf = async () => {
    const contentElement = document.getElementById('pdf-content');
    if (!contentElement) {
      toast.error("Não foi possível encontrar o conteúdo para gerar o PDF.");
      return;
    }
    setIsDownloadingPdf(true);
    toast.info("Gerando seu PDF, por favor aguarde...");
    try {
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      await pdf.html(contentElement, {
        callback: (doc) => doc.save(`Planejamento - ${formData.brand}.pdf`),
        margin: [40, 40, 40, 40],
        autoPaging: 'text',
        width: 515,
        windowWidth: contentElement.scrollWidth,
      });
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar o PDF:", error);
      toast.error("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!team) return toast.error('Dados da equipe não encontrados');
    
    // Check credits from team.credits
    const availableCredits = team?.credits?.contentPlans || 0;
    if (availableCredits <= 0) return toast.error('Créditos insuficientes');
    
    if (!formData.brand || formData.theme.length === 0 || !formData.objective || !formData.platform) {
      return toast.error('Por favor, preencha todos os campos obrigatórios (*)');
    }
    setLoading(true);
    setError(null);
    setPlannedContent(null);
    setIsResultView(true);
    try {
      const selectedBrand = brands.find(b => b.name === formData.brand);
      if (!selectedBrand) throw new Error('Marca selecionada não encontrada');
      // Inclui o moodboard da marca selecionada, se existir
      const requestBody = { ...formData, teamId: user.teamId, brandId: selectedBrand.id, userId: user.id, moodboard: selectedMoodboard };
      const response = await fetch('/api/plan-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o planejamento.');
      }
      const data = await response.json();
      setPlannedContent(data.plan);
      toast.success('Planejamento gerado com sucesso!');
      
      // Refresh team data with updated credits after action
      if (team && user?.teamId) {
        const teamResponse = await fetch(`/api/teams/${user.teamId}?summary=true`);
        if (teamResponse.ok) {
          const updatedTeam = await teamResponse.json();
          setTeam(updatedTeam);
        }
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Erro ao gerar planejamento');
    } finally {
      setLoading(false);
    }
  };

  if (!isResultView) {
    return (
      <div className="min-h-full w-full">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Card do Cabeçalho */}
          <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-xl lg:text-3xl font-bold">Planejar Conteúdo</h1>
                    <p className="text-muted-foreground text-xs lg:text-base">Preencha os campos para gerar seu planejamento de posts</p>
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
                            {team?.credits?.contentPlans || 0}
                          </span>
                          <p className="text-md text-muted-foreground font-medium leading-tight">
                            Planejamentos Restantes
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Seção dos Formulários */}
          <div className="flex flex-col gap-6">
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Configuração Básica
                </h2>
                <p className="text-muted-foreground text-sm">Defina marca, tema e plataforma</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* ... conteúdo do formulário ... */}
                  <div className="space-y-3">
                    <Label htmlFor="brand" className="text-sm font-semibold text-foreground">Marca *</Label>
                    {isLoadingData ? <Skeleton className="h-11 w-full rounded-xl" /> : (
                      <Select onValueChange={handleBrandChange} value={formData.brand}>
                        <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50">
                          <SelectValue placeholder="Selecione a marca" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/20">
                          {brands.map((brand) => <SelectItem key={brand.id} value={brand.name} className="rounded-lg">{brand.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="theme" className="text-sm font-semibold text-foreground">Tema Estratégico *</Label>
                    {isLoadingData ? <Skeleton className="h-11 w-full rounded-xl" /> : (
                      <>
                        <Select onValueChange={handleThemeSelect} value="" disabled={!formData.brand || filteredThemes.length === 0}>
                          <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 disabled:opacity-50">
                            <SelectValue placeholder={!formData.brand ? "Primeiro, escolha a marca" : "Adicionar tema"} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/20">
                            {filteredThemes.map((t) => <SelectItem key={t.id} value={t.title} disabled={formData.theme.includes(t.title)} className="rounded-lg">{t.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 min-h-[50px] p-3 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 mt-3">
                          {formData.theme.length === 0 ? <span className="text-sm text-muted-foreground italic self-center">Nenhum tema</span> : (
                            formData.theme.map((t) => (
                              <div key={t} className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 border-2 border-primary/30 text-primary text-sm font-semibold px-3 py-1.5 rounded-xl">
                                {t}
                                <button onClick={() => handleThemeRemove(t)} className="ml-1 text-primary hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-destructive/10" aria-label={`Remover tema ${t}`}>
                                  <X size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="platform" className="text-sm font-semibold text-foreground">Plataforma *</Label>
                    <Select onValueChange={handlePlatformChange} value={formData.platform}>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50">
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/20">
                        <SelectItem value="instagram" className="rounded-lg">Instagram</SelectItem>
                        <SelectItem value="facebook" className="rounded-lg">Facebook</SelectItem>
                        <SelectItem value="linkedin" className="rounded-lg">LinkedIn</SelectItem>
                        <SelectItem value="twitter" className="rounded-lg">Twitter (X)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="quantity" className="text-sm font-semibold text-foreground">Quantidade de Posts (1-7) *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="7"
                      placeholder="Ex: 5"
                      value={formData.quantity}
                      onChange={handleQuantityChange}
                      onBlur={handleQuantityBlur}
                      className="h-11 rounded-xl border-2 border-border/50 bg-background/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-secondary/5 to-accent/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  Detalhes do Planejamento
                </h2>
                <p className="text-muted-foreground text-sm">Descreva os objetivos e informações adicionais</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="objective" className="text-sm font-semibold text-foreground">Objetivo dos Posts *</Label>
                    <Textarea id="objective" placeholder="Ex: Gerar engajamento, educar o público, aumentar vendas..." value={formData.objective} onChange={handleInputChange} className="h-64 rounded-xl border-2 border-border/50 bg-background/50 resize-none" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="additionalInfo" className="text-sm font-semibold text-foreground">Informações Adicionais</Label>
                    <Textarea id="additionalInfo" placeholder="Ex: Usar cores da marca, focar em jovens de 18-25 anos..." value={formData.additionalInfo} onChange={handleInputChange} className="h-64 rounded-xl border-2 border-border/50 bg-background/50 resize-none" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botão de Ação */}
          <div className="mt-8">
            <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border border-border/20 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <Button onClick={handleGeneratePlan} disabled={loading || !formData.brand || formData.theme.length === 0 || !formData.platform || !formData.objective} className="w-full max-w-lg h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-secondary hover:from-primary/90 shadow-xl transition-all duration-500 disabled:opacity-50">
                    {loading ? <><Loader className="animate-spin mr-3 h-5 w-5" /><span>Gerando...</span></> : <><Calendar className="mr-3 h-5 w-5" /><span>Gerar Planejamento</span></>}
                  </Button>
                  {(!formData.brand || formData.theme.length === 0 || !formData.platform || !formData.objective) && (
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

  // Se estiver na tela de resultado, renderiza a visualização do conteúdo.
  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Card do Cabeçalho da Tela de Resultado */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-secondary/10 text-secondary rounded-lg p-3">
                  <MessageSquareQuote className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Planejar Conteúdo</h1>
                  <p className="text-muted-foreground text-sm md:text-base">Gere seu calendário de posts com IA</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleDownloadPdf} disabled={isDownloadingPdf} variant="outline" size="sm" className="rounded-lg">
                  {isDownloadingPdf ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  {isDownloadingPdf ? 'Baixando...' : 'Baixar PDF'}
                </Button>
                <Button onClick={handleGoBackToForm} variant="outline" className="rounded-xl px-4 py-2 border-2 border-primary/30">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Criar Novo
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5 flex flex-row items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Resultado do Planejamento
                </h2>
                <p className="text-muted-foreground text-sm">Conteúdo gerado com base nos seus parâmetros</p>
              </div>
              {plannedContent && !loading && (
                <Button onClick={handleCopy} variant="outline" size="sm" className="rounded-lg">
                  {isCopied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Clipboard className="h-4 w-4 mr-2" />}
                  {isCopied ? 'Copiado!' : 'Copiar Texto'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="w-full min-h-[500px] bg-card rounded-2xl p-6 shadow-inner border border-border/20 flex flex-col overflow-hidden">
                {loading && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="animate-pulse"><MessageSquareQuote size={64} className="text-primary" /></div>
                    <p className="mt-4 text-muted-foreground text-lg">Gerando seu planejamento...</p>
                  </div>
                )}
                {plannedContent && !loading && (
                  <div
                    id="pdf-content"
                    className="prose prose-sm dark:prose-invert max-w-none text-left overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: plannedContent }}
                  />
                )}
                {error && !loading && <p className="text-destructive p-4 text-center text-base">{error}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}