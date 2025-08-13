// components/plan.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, Calendar, ArrowLeft, MessageSquareQuote } from 'lucide-react';
import type { Brand } from '@/types/brand';
import type { StrategicTheme } from '@/types/theme';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/types/team';

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
        console.error('Failed to load data from API', error);
      }
    };
    
    loadData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleBrandChange = (value: string) => {
    setFormData((prev) => ({ ...prev, brand: value }));
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
    if (!team) return;
    if (team.credits.contentPlans <= 0) {
      setError('Seus créditos para calendário de conteúdo acabaram.');
      setIsResultView(false);
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
          }
        } catch (error) {
          console.error('Failed to update team credits', error);
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
    setPlannedContent(null);
    setError(null);
  }

  if (!isResultView) {
    return (
      <div className="w-full max-w-4xl h-full mx-auto p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl bg-card border-2 border-primary/20 flex flex-col">
        <div className="flex items-start gap-4 mb-8">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <Calendar className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Planejar Conteúdo
            </h1>
            <p className="text-muted-foreground">
              Preencha os campos abaixo para gerar seu planejamento de posts.
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow pr-2 -mr-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full md:col-span-1 space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Select onValueChange={handleBrandChange} value={formData.brand}>
                <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:col-span-1 space-y-2">
              <Label htmlFor="theme">Tema Estratégico</Label>
              <Select onValueChange={handleThemeChange} value={formData.theme}>
                <SelectTrigger><SelectValue placeholder="Selecione o tema" /></SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.title}>{theme.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma Digital</Label>
              <Select onValueChange={handlePlatformChange} value={formData.platform}>
                <SelectTrigger><SelectValue placeholder="Selecione a plataforma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter (X)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade de Posts</Label>
              <Input id="quantity" type="number" min="1" placeholder="Ex: 5" value={formData.quantity} onChange={handleQuantityChange} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="objective">Objetivo dos Posts</Label>
              <Textarea id="objective" placeholder="Ex: Gerar engajamento sobre o novo produto..." value={formData.objective} onChange={handleInputChange} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="additionalInfo">Informações Adicionais</Label>
              <Textarea id="additionalInfo" placeholder="Ex: Usar as cores da marca, estilo minimalista..." value={formData.additionalInfo} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        <div className="mt-8 flex-shrink-0">
          <Button onClick={handleGeneratePlan} className="w-full rounded-full text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105">
            {loading ? <><Loader className="animate-spin mr-2" /> Gerando...</> : <><Calendar className="mr-2" />Gerar Planejamento</>}
          </Button>
          {error && <p className="text-destructive mt-4 text-center">{error}</p>}
        </div>
      </div >
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto h-full p-4 sm:p-6 md:p-8">
      <div className="space-y-4 flex flex-col h-full">
        <h3 className="text-center text-lg font-semibold text-primary">Planejamento Gerado pela IA</h3>
        <div className="w-full h-full bg-card rounded-2xl p-6 shadow-lg border-2 border-primary/20 flex flex-col">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="animate-pulse"><MessageSquareQuote size={64} className="text-primary" /></div>
              <p className="mt-4 text-muted-foreground">Gerando seu planejamento...</p>
            </div>
          )}
          {plannedContent && !loading && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-left overflow-y-auto h-full">
              <p className="whitespace-pre-line">{plannedContent}</p>
            </div>
          )}
          {error && !loading && <p className="text-destructive p-4 text-center">{error}</p>}
        </div>
      </div>
    </div>
  )
}