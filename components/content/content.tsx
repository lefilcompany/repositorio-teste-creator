// components/content/content.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader, Sparkles, Zap, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { Brand } from '@/types/brand';
import type { StrategicTheme } from '@/types/theme';
import type { Persona } from '@/types/persona';
import type { Team } from '@/types/team';
import { useAuth } from '@/hooks/useAuth';

// Interfaces
interface FormData {
  brand: string;
  theme: string;
  persona: string;
  objective: string;
  platform: string;
  description: string;
  audience: string;
  tone: string[];
  additionalInfo: string;
}

// Opções para o Tom de Voz
const toneOptions = [
  'inspirador', 'motivacional', 'profissional', 'casual', 'elegante',
  'moderno', 'tradicional', 'divertido', 'sério'
];

export default function Creator() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    brand: '', theme: '', persona: '', objective: '', platform: '',
    description: '', audience: '', tone: [], additionalInfo: '',
  });

  const [team, setTeam] = useState<Team | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [filteredThemes, setFilteredThemes] = useState<StrategicTheme[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [isVideoMode, setIsVideoMode] = useState<boolean>(false);
  const [transformationType, setTransformationType] = useState<'image_to_video' | 'video_to_video'>('image_to_video');
  const [ratio, setRatio] = useState<string>('1280:720');
  const [duration, setDuration] = useState<string>('10');

  useEffect(() => {
    const loadData = async () => {
      if (!user?.teamId) return;

      try {
        const teamRes = await fetch(`/api/teams?userId=${user.id}`);
        if (teamRes.ok) {
          const teamsData: Team[] = await teamRes.json();
          const currentTeam = teamsData.find(t => t.id === user.teamId);
          if (currentTeam) setTeam(currentTeam);
        }

        const brandsRes = await fetch(`/api/brands?teamId=${user.teamId}`);
        if (brandsRes.ok) {
          const brandsData: Brand[] = await brandsRes.json();
          setBrands(brandsData);
        }

        const themesRes = await fetch(`/api/themes?teamId=${user.teamId}`);
        if (themesRes.ok) {
          const themesData: StrategicTheme[] = await themesRes.json();
          setThemes(themesData);
        }

        const personasRes = await fetch(`/api/personas?teamId=${user.teamId}`);
        if (personasRes.ok) {
          const personasData: Persona[] = await personasRes.json();
          setPersonas(personasData);
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
    const selectedBrand = brands.find(b => b.name === formData.brand);
    setFilteredThemes(selectedBrand ? themes.filter(t => t.brandId === selectedBrand.id) : []);
  }, [brands, themes, formData.brand]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (field: keyof Omit<FormData, 'tone'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'brand') {
      const selectedBrand = brands.find(b => b.name === value);
      setFilteredThemes(selectedBrand ? themes.filter(t => t.brandId === selectedBrand.id) : []);
      setFormData(prev => ({ ...prev, theme: '', persona: '' }));
    }
  };

  const handleToneSelect = (tone: string) => {
    if (!formData.tone.includes(tone)) {
      if (formData.tone.length >= 4) {
        toast.error("Limite atingido", {
          description: "Você pode selecionar no máximo 4 tons de voz."
        });
        return;
      }
      setFormData(prev => ({ ...prev, tone: [...prev.tone, tone] }));
    }
  };

  const handleToneRemove = (toneToRemove: string) => {
    setFormData(prev => ({ ...prev, tone: prev.tone.filter(t => t !== toneToRemove) }));
  };

  const handleVideoModeChange = (checked: boolean) => {
    setIsVideoMode(checked);
    if (checked) {
      toast.info("Geração de Vídeo (Beta) Ativada", {
        description: "Este recurso está em desenvolvimento e a geração pode levar mais tempo que o normal. Agradecemos seu feedback!",
        duration: 6000,
        icon: <Info className="h-5 w-5 text-accent" />,
        style: {
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--accent))",
          borderLeft: "4px solid hsl(var(--accent))",
          color: "hsl(var(--foreground))",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        className: "group toast-info-beta",
      });
    }
  };

  const isFormValid = () => {
    if (isVideoMode) {
      return (
        formData.brand &&
        formData.theme &&
        formData.objective &&
        formData.platform &&
        formData.description &&
        formData.audience &&
        formData.tone.length > 0 &&
        referenceFile &&
        ratio &&
        (transformationType !== 'image_to_video' || duration)
      );
    }
    return (
      formData.brand &&
      formData.theme &&
      formData.objective &&
      formData.platform &&
      formData.description &&
      formData.audience &&
      formData.tone.length > 0 &&
      referenceFile
    );
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const updateTeamCredits = async () => {
    if (!team || !user?.teamId) return;

    try {
      const updatedCredits = { ...team.credits, contentSuggestions: team.credits.contentSuggestions - 1 };
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
    }
  };

  const handleGenerateContent = async () => {
    if (!team) {
      toast.error('Equipe não encontrada.');
      return;
    }
    if (team.credits.contentSuggestions <= 0) {
      toast.error('Seus créditos para criação de conteúdo acabaram.');
      return;
    }
    if (!isFormValid()) {
      toast.error('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }
    if (!user?.teamId || !user?.id) {
      toast.error('Dados do usuário não encontrados. Faça login novamente.');
      return;
    }

    setLoading(true);

    try {
      const base64File = referenceFile ? await fileToBase64(referenceFile) : undefined;
      const selectedBrand = brands.find(b => b.name === formData.brand);
      if (!selectedBrand) {
        toast.error('Marca selecionada não encontrada.');
        return;
      }

      const requestData: any = {
        prompt: formData.description,
        ...formData,
        transformationType,
        teamId: user?.teamId,
        brandId: selectedBrand.id,
        userId: user?.id,
      };

      if (isVideoMode) {
        requestData.ratio = ratio;
        if (transformationType === 'image_to_video') {
          requestData.duration = Number(duration);
        }
      }

      if (base64File) {
        if (isVideoMode) {
          requestData.referenceFile = base64File;
        } else {
          requestData.referenceImage = base64File;
        }
      }

      const endpoint = isVideoMode ? '/api/generate-video' : '/api/generate-image';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.shouldRedirectToHistory) {
          toast.error('Erro crítico no sistema. Redirecionando para o histórico.');
          router.push('/historico');
          return;
        }
        throw new Error(errorData.error || 'Falha ao gerar o conteúdo.');
      }

      await response.json();
      await updateTeamCredits();
      toast.success('Conteúdo gerado com sucesso!');
      router.push('/content/result');

    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar o conteúdo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Criar Conteúdo Estratégico
                  </h1>
                  <p className="text-muted-foreground text-base">
                    Preencha os campos para gerar um post completo com IA
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-1 rounded-full bg-muted p-1 border">
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => setIsVideoMode(false)}
                    className={`w-28 rounded-full font-semibold transition-all duration-200 ease-in-out ${!isVideoMode
                      ? 'bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                  >
                    Imagem
                  </Button>
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => handleVideoModeChange(true)}
                    className={`w-28 rounded-full font-semibold transition-all duration-200 ease-in-out ${isVideoMode
                      ? 'bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Vídeo
                      <span className="border border-accent/50 bg-accent/20 text-accent text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        BETA
                      </span>
                    </div>
                  </Button>
                </div>
                {team && !isLoadingData ? (
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
                              {team.credits?.contentSuggestions || 0}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground font-medium">criações restantes</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : isLoadingData && (
                  <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 backdrop-blur-sm shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="text-center space-y-1">
                          <Skeleton className="w-12 h-8" />
                          <Skeleton className="w-24 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6">
          <div className="lg:col-span-1 xl:col-span-2 space-y-6">
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Configuração Básica
                </h2>
                <p className="text-muted-foreground text-sm">Defina marca, tema e público</p>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="space-y-3">
                  <Label htmlFor="brand" className="text-sm font-semibold text-foreground">Marca *</Label>
                  {isLoadingData ? (
                    <Skeleton className="h-11 w-full rounded-xl" />
                  ) : (
                    <Select onValueChange={(value) => handleSelectChange('brand', value)} value={formData.brand}>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Selecione a marca" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/20">
                        {brands.map(b => <SelectItem key={b.id} value={b.name} className="rounded-lg">{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="theme" className="text-sm font-semibold text-foreground">Tema Estratégico *</Label>
                  {isLoadingData ? (
                    <Skeleton className="h-11 w-full rounded-xl" />
                  ) : (
                    <Select onValueChange={(value) => handleSelectChange('theme', value)} value={formData.theme} disabled={!formData.brand}>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 disabled:opacity-50 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder={!formData.brand ? "Primeiro, escolha a marca" : "Selecione o tema"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/20">
                        {filteredThemes.map(t => <SelectItem key={t.id} value={t.title} className="rounded-lg">{t.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="persona" className="text-sm font-semibold text-foreground">Persona (Opcional)</Label>
                  {isLoadingData ? (
                    <Skeleton className="h-11 w-full rounded-xl" />
                  ) : (
                    <Select onValueChange={(value) => handleSelectChange('persona', value)} value={formData.persona} disabled={!formData.brand}>
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 disabled:opacity-50 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder={!formData.brand ? "Primeiro, escolha a marca" : "Selecione uma persona"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/20">
                        {personas.filter(p => p.brandId === brands.find(b => b.name === formData.brand)?.id).map(p =>
                          <SelectItem key={p.id} value={p.name} className="rounded-lg">{p.name}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="platform" className="text-sm font-semibold text-foreground">Plataforma *</Label>
                  <Select onValueChange={(value) => handleSelectChange('platform', value)} value={formData.platform}>
                    <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Onde será postado?" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/20">
                      <SelectItem value="Instagram" className="rounded-lg">Instagram</SelectItem>
                      <SelectItem value="Facebook" className="rounded-lg">Facebook</SelectItem>
                      <SelectItem value="LinkedIn" className="rounded-lg">LinkedIn</SelectItem>
                      <SelectItem value="Twitter" className="rounded-lg">Twitter (X)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="audience" className="text-sm font-semibold text-foreground">Público-Alvo *</Label>
                  <Input
                    id="audience"
                    placeholder="Descreva o perfil do seu público ideal (idade, interesses, dores, etc.)"
                    value={formData.audience}
                    onChange={handleInputChange}
                    className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {isVideoMode ? (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="transformation" className="text-sm font-semibold text-foreground">Tipo de Transformação *</Label>
                      <Select value={transformationType} onValueChange={(value) => setTransformationType(value as 'image_to_video' | 'video_to_video')}>
                        <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/20">
                          <SelectItem value="image_to_video" className="rounded-lg">Imagem para Vídeo</SelectItem>
                          <SelectItem value="video_to_video" className="rounded-lg">Vídeo para Vídeo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="referenceFile" className="text-sm font-semibold text-foreground">{transformationType === 'image_to_video' ? 'Imagem de Referência *' : 'Vídeo de Referência *'}</Label>
                      <div className="relative">
                        <Input
                          id="referenceFile"
                          type="file"
                          accept={transformationType === 'image_to_video' ? 'image/*' : 'video/*'}
                          onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
                          className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                      </div>
                      {referenceFile && (
                        <div className="text-sm text-green-600 flex items-center gap-2 mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          ✓ Arquivo selecionado: {referenceFile.name}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="ratio" className="text-sm font-semibold text-foreground">Proporção *</Label>
                      <Select value={ratio} onValueChange={setRatio}>
                        <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Selecione a proporção" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/20">
                          {['1280:768', '768:1280'].map((opt) => (
                            <SelectItem key={opt} value={opt} className="rounded-lg">{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {transformationType === 'image_to_video' && (
                      <div className="space-y-3">
                        <Label htmlFor="duration" className="text-sm font-semibold text-foreground">Duração (s) *</Label>
                        <Select value={duration} onValueChange={setDuration}>
                          <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Selecione a duração" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/20">
                            <SelectItem value="5" className="rounded-lg">5</SelectItem>
                            <SelectItem value="10" className="rounded-lg">10</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="referenceFile" className="text-sm font-semibold text-foreground">Imagem de Referência *</Label>
                    <div className="relative">
                      <Input
                        id="referenceFile"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
                        className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                    {referenceFile && (
                      <div className="text-sm text-green-600 flex items-center gap-2 mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        ✓ Arquivo selecionado: {referenceFile.name}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 xl:col-span-3 space-y-6">
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-secondary/5 to-accent/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  Detalhes do Conteúdo
                </h2>
                <p className="text-muted-foreground text-sm">Descreva o objetivo e características do post</p>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-3">
                  <Label htmlFor="objective" className="text-sm font-semibold text-foreground">Objetivo do Post *</Label>
                  <Textarea
                    id="objective"
                    placeholder="Qual a principal meta deste post? (ex: gerar engajamento, anunciar um produto, educar sobre um tema específico)"
                    value={formData.objective}
                    onChange={handleInputChange}
                    className="min-h-[120px] rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 resize-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold text-foreground">
                    {isVideoMode ? 'Descrição Visual do Vídeo *' : 'Descrição Visual da Imagem *'}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={
                      isVideoMode
                        ? "Como um roteirista: descreva a ação, o movimento da câmera e a atmosfera (ex: drone voando sobre uma praia ao pôr do sol, pessoas caminhando lentamente, clima tranquilo)."
                        : "Seja um diretor de arte: descreva a cena, iluminação, cores e emoção (ex: uma mulher sorrindo em um café com luz do sol, estilo cinematográfico, cores quentes)."
                    }
                    value={formData.description}
                    onChange={handleInputChange}
                    className="min-h-[140px] rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 resize-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tone" className="text-sm font-semibold text-foreground">Tom de Voz * (máximo 4)</Label>
                  <Select onValueChange={handleToneSelect} value="">
                    <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Adicionar tom de voz..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/20">
                      {toneOptions.map(option => (
                        <SelectItem key={option} value={option} disabled={formData.tone.includes(option)} className="rounded-lg">
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-2 min-h-[50px] p-3 rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
                    {formData.tone.length === 0 ? (
                      <span className="text-sm text-muted-foreground italic self-center">Nenhum tom selecionado</span>
                    ) : (
                      formData.tone.map(tone => (
                        <div key={tone} className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 border-2 border-primary/30 text-primary text-sm font-semibold px-3 py-1.5 rounded-xl transition-all duration-300 hover:scale-105">
                          {tone.charAt(0).toUpperCase() + tone.slice(1)}
                          <button
                            onClick={() => handleToneRemove(tone)}
                            className="ml-1 text-primary hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-destructive/10"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="additionalInfo" className="text-sm font-semibold text-foreground">Informações Extras</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Adicione detalhes cruciais para a IA (ex: usar a cor #FF5733, incluir nosso logo, não mostrar rostos, link de referência: bit.ly/exemplo)"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    className="min-h-[100px] rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 focus:border-primary transition-all duration-300 resize-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border border-border/20 rounded-2xl shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={handleGenerateContent}
                  disabled={loading || !isFormValid()}
                  className="w-full max-w-lg h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-secondary hover:from-primary/90 hover:via-purple-600/90 hover:to-secondary/90 shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] border-2 border-white/20"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin mr-3 h-5 w-5" />
                      <span>Gerando conteúdo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      <span>Gerar Conteúdo</span>
                    </>
                  )}
                </Button>

                {!isFormValid() && (
                  <div className="text-center bg-muted/30 p-3 rounded-xl border border-border/30">
                    <p className="text-muted-foreground text-sm">
                      Complete todos os campos obrigatórios (*) para gerar o conteúdo
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}