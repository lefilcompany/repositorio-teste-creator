// components/plan.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, Calendar, ArrowLeft, MessageSquareQuote, Zap } from 'lucide-react';
import type { Brand } from '@/types/brand';
import type { StrategicTheme } from '@/types/theme';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/types/team';
import { toast } from 'sonner';

interface FormData {
  brand: string;
  theme: string;
  platform: string;
  quantity: number;
  objective: string;
  additionalInfo: string;
}

export default function Plan() {
  const [formData, setFormData] = useState<FormData>({
    brand: '',
    theme: '',
    platform: '',
    quantity: 1,
    objective: '',
    additionalInfo: '',
  });

  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<StrategicTheme[]>([]);
  const [plannedContent, setPlannedContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isResultView, setIsResultView] = useState<boolean>(false);

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
        } else {
          toast.error('Erro ao carregar marcas');
        }
        
        if (themesRes.ok) {
          const themesData: StrategicTheme[] = await themesRes.json();
          setThemes(themesData);
        } else {
          toast.error('Erro ao carregar temas estratégicos');
        }
        
        if (teamsRes.ok) {
          const teamsData: Team[] = await teamsRes.json();
          const currentTeam = teamsData.find(t => t.id === user.teamId);
          if (currentTeam) setTeam(currentTeam);
        } else {
          toast.error('Erro ao carregar dados da equipe');
        }
      } catch (error) {
        console.error('Failed to load data from API', error);
        toast.error('Erro de conexão ao carregar dados para planejamento');
      }
    };
    
    loadData();
  }, [user]);

  // Filtrar temas baseado na marca selecionada
  useEffect(() => {
    if (!formData.brand || !brands.length) {
      setFilteredThemes([]);
      return;
    }

    const selectedBrand = brands.find(brand => brand.name === formData.brand);
    if (selectedBrand) {
      const filtered = themes.filter(theme => theme.brandId === selectedBrand.id);
      setFilteredThemes(filtered);
    } else {
      setFilteredThemes([]);
    }
  }, [formData.brand, brands, themes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleBrandChange = (value: string) => {
    setFormData((prev) => ({ ...prev, brand: value, theme: '' })); // Reset theme when brand changes
  };

  const handleThemeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, theme: value }));
  };

  const handlePlatformChange = (value: string) => {
    setFormData((prev) => ({ ...prev, platform: value }));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, quantity: isNaN(quantity) ? 1 : quantity }));
  };


  const handleGeneratePlan = async () => {
    if (!team) {
      toast.error('Dados da equipe não encontrados');
      return;
    }
    if (team.credits.contentPlans <= 0) {
      setError('Seus créditos para calendário de conteúdo acabaram.');
      setIsResultView(false);
      toast.error('Créditos insuficientes para gerar planejamento');
      return;
    }
    setLoading(true);
    setError(null);
    setPlannedContent(null);
    setIsResultView(true);

    try {
      const response = await fetch('/api/plan-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o planejamento. Tente novamente.');
      }

      const data = await response.json();
      setPlannedContent(data.plan);
      toast.success('Planejamento gerado com sucesso!');

      // Atualizar créditos no banco de dados
      if (team && user?.id) {
        try {
          const updatedCredits = { ...team.credits, contentPlans: team.credits.contentPlans - 1 };
          const updateRes = await fetch('/api/teams', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: team.id, credits: updatedCredits }),
          });
          
          if (updateRes.ok) {
            const updatedTeam = await updateRes.json();
            setTeam(updatedTeam);
          } else {
            toast.error('Erro ao atualizar créditos da equipe');
          }
        } catch (error) {
          console.error('Failed to update team credits', error);
          toast.error('Erro ao atualizar créditos da equipe');
        }
      }

      // Salvar no histórico via API
      if (user?.teamId && user.id && formData.brand) {
        try {
          const brandData = brands.find(b => b.name === formData.brand);
          if (brandData) {
            await fetch('/api/actions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'PLANEJAR_CONTEUDO',
                teamId: user.teamId,
                userId: user.id,
                brandId: brandData.id,
                details: { ...formData },
                result: { plan: data.plan },
              }),
            });
          }
        } catch (error) {
          console.error('Failed to save action', error);
          toast.error('Erro ao salvar no histórico');
        }
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Erro ao gerar planejamento');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBackToForm = () => {
    setIsResultView(false);
    setPlannedContent(null);
    setError(null);
  }

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
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">
                      Planejar Conteúdo
                    </h1>
                    <p className="text-muted-foreground text-base">
                      Preencha os campos para gerar seu planejamento de posts
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
                                {team.credits.contentPlans}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">créditos restantes</span>
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
            {/* Configuration Section */}
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
                  <div className="space-y-3">
                    <Label htmlFor="brand" className="text-sm font-semibold text-foreground">Marca *</Label>
                    <Select onValueChange={handleBrandChange} value={formData.brand}>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20">
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
                    <Select onValueChange={handleThemeChange} value={formData.theme} disabled={!formData.brand || filteredThemes.length === 0}>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        <SelectValue placeholder={!formData.brand ? "Primeiro, escolha a marca" : filteredThemes.length === 0 ? "Nenhum tema disponível" : "Selecione o tema"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/20">
                        {filteredThemes.map((theme) => (
                          <SelectItem key={theme.id} value={theme.title} className="rounded-lg">{theme.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="platform" className="text-sm font-semibold text-foreground">Plataforma *</Label>
                    <Select onValueChange={handlePlatformChange} value={formData.platform}>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20">
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
                    <Label htmlFor="quantity" className="text-sm font-semibold text-foreground">Quantidade de Posts *</Label>
                    <Input 
                      id="quantity" 
                      type="number" 
                      min="1" 
                      placeholder="Ex: 5" 
                      value={formData.quantity} 
                      onChange={handleQuantityChange}
                      className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Details Section */}
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
                    <Textarea 
                      id="objective" 
                      placeholder="Ex: Gerar engajamento sobre o novo produto, educar o público, aumentar vendas..." 
                      value={formData.objective} 
                      onChange={handleInputChange}
                      className="h-64 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 resize-none focus:ring-2 focus:ring-primary/20" 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="additionalInfo" className="text-sm font-semibold text-foreground">Informações Adicionais</Label>
                    <Textarea 
                      id="additionalInfo" 
                      placeholder="Ex: Usar as cores da marca, estilo minimalista, focar em jovens de 18-25 anos..." 
                      value={formData.additionalInfo} 
                      onChange={handleInputChange}
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
                    onClick={handleGeneratePlan} 
                    disabled={loading || !formData.brand || !formData.theme || !formData.platform || !formData.objective}
                    className="w-full max-w-lg h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-secondary hover:from-primary/90 hover:via-purple-600/90 hover:to-secondary/90 shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] border-2 border-white/20"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin mr-3 h-5 w-5" />
                        <span>Gerando...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-3 h-5 w-5" />
                        <span>Gerar Planejamento</span>
                      </>
                    )}
                  </Button>

                  {/* Form validation indicator */}
                  {(!formData.brand || !formData.theme || !formData.platform || !formData.objective) && (
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
        <Card className="shadow-lg border-0 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-secondary/10 text-secondary rounded-lg p-3">
                  <MessageSquareQuote className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Planejamento Gerado pela IA
                  </h1>
                  <p className="text-muted-foreground text-base">
                    Seu calendário de conteúdo estratégico está pronto
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleGoBackToForm} 
                variant="outline" 
                className="rounded-xl px-6 py-3 border-2 border-primary/30 hover:bg-primary/5 transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Criar Novo Planejamento
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Content - Planning Result */}
        <div className="space-y-6">
          <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Resultado do Planejamento
              </h2>
              <p className="text-muted-foreground text-sm">Conteúdo gerado com base nos seus parâmetros</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="w-full min-h-[500px] bg-card rounded-2xl p-6 shadow-lg border-2 border-primary/20 flex flex-col overflow-hidden">
                {loading && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="animate-pulse"><MessageSquareQuote size={64} className="text-primary" /></div>
                    <p className="mt-4 text-muted-foreground text-lg">Gerando seu planejamento...</p>
                  </div>
                )}
                {plannedContent && !loading && (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-left overflow-y-auto">
                    <p className="whitespace-pre-line text-base leading-relaxed">{plannedContent}</p>
                  </div>
                )}
                {error && !loading && <p className="text-destructive p-4 text-center text-base">{error}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}