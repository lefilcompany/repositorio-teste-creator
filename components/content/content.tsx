"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader, Sparkles, Zap, X, Info } from "lucide-react";
import { toast } from "sonner";
import type { Brand } from "@/types/brand";
import type { StrategicTheme } from "@/types/theme";
import type { Persona } from "@/types/persona";
import type { Team } from "@/types/team";
import { useAuth } from "@/hooks/useAuth";

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

const toneOptions = [
  "inspirador",
  "motivacional",
  "profissional",
  "casual",
  "elegante",
  "moderno",
  "tradicional",
  "divertido",
  "sério",
];

// Tipos para os dados leves carregados para o formulário
type LightBrand = Pick<Brand, "id" | "name">;
type LightTheme = Pick<StrategicTheme, "id" | "title" | "brandId">;
type LightPersona = Pick<Persona, "id" | "name" | "brandId">;

export default function Creator() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    brand: "",
    theme: "",
    persona: "",
    objective: "",
    platform: "",
    description: "",
    audience: "",
    tone: [],
    additionalInfo: "",
  });

  const [team, setTeam] = useState<Team | null>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [brands, setBrands] = useState<LightBrand[]>([]);
  const [themes, setThemes] = useState<LightTheme[]>([]);
  const [personas, setPersonas] = useState<LightPersona[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [filteredThemes, setFilteredThemes] = useState<LightTheme[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [isVideoMode, setIsVideoMode] = useState<boolean>(false);
  const [transformationType, setTransformationType] = useState<
    "image_to_video" | "video_to_video"
  >("image_to_video");
  const [ratio, setRatio] = useState<string>("768:1280");
  const [duration, setDuration] = useState<string>("5");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const pasteAreaRef = useRef<HTMLInputElement>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      setReferenceFiles((prev) => [...prev, ...files].slice(0, 10));
    }
  };

  const handlePasteButton = () => {
    setShowPasteArea(true);
    setTimeout(() => {
      pasteAreaRef.current?.focus();
    }, 100);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setReferenceFiles((prev) => 
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // Função de retry para o frontend
  const retryFetch = async (
    url: string,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<Response> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) return response;

        // Se o status é 503 (service unavailable), tenta novamente
        if (response.status === 503 && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error: any) {
        lastError = error;
        console.warn(
          `Tentativa ${attempt}/${maxRetries} falhou:`,
          error.message
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError!;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.teamId || !user?.id) {
        if (user) setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      try {
        const res = await retryFetch(
          `/api/content-form-data?teamId=${user.teamId}&userId=${user.id}`
        );
        const data = await res.json();
        setTeam(data.team);
        setBrands(data.brands);
        setThemes(data.themes);
        setPersonas(data.personas);

        // Fetch team data with subscription-based credits
        const teamResponse = await fetch(`/api/teams/${user.teamId}?summary=true`);
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setTeamData(teamData);
        }
      } catch (error: any) {
        console.error("Erro ao carregar dados:", error);

        // Mensagem de erro mais específica
        if (
          error.message.includes("503") ||
          error.message.includes("DATABASE_CONNECTION_ERROR")
        ) {
          toast.error("Erro de conectividade", {
            description:
              "Problemas de conexão com o servidor. Tente recarregar a página.",
          });
        } else {
          toast.error("Erro ao carregar dados", {
            description:
              "Falha ao carregar dados do formulário. Tente novamente.",
          });
        }
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    const selectedBrand = brands.find((b) => b.name === formData.brand);
    setFilteredThemes(
      selectedBrand ? themes.filter((t) => t.brandId === selectedBrand.id) : []
    );
  }, [brands, themes, formData.brand]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (
    field: keyof Omit<FormData, "tone">,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "brand") {
      // Só limpa tema e persona se a marca mudou realmente
      const selectedBrand = brands.find((b) => b.name === value);
      const currentTheme = themes.find((t) => t.title === formData.theme);
      const currentPersona = personas.find((p) => p.name === formData.persona);
      
      setFormData((prev) => ({ 
        ...prev, 
        theme: (currentTheme && selectedBrand && currentTheme.brandId === selectedBrand.id) ? prev.theme : "",
        persona: (currentPersona && selectedBrand && currentPersona.brandId === selectedBrand.id) ? prev.persona : ""
      }));
    }
  };

  const handleToneSelect = (tone: string) => {
    if (!formData.tone.includes(tone)) {
      if (formData.tone.length >= 4) {
        toast.error("Limite atingido", {
          description: "Você pode selecionar no máximo 4 tons de voz.",
        });
        return;
      }
      setFormData((prev) => ({ ...prev, tone: [...prev.tone, tone] }));
    }
  };

  const handleToneRemove = (toneToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tone: prev.tone.filter((t) => t !== toneToRemove),
    }));
  };

  const handleVideoModeChange = (checked: boolean) => {
    setIsVideoMode(checked);
    if (checked) {
      toast.info("Geração de Vídeo (Beta) Ativada", {
        description:
          "Este recurso está em desenvolvimento e a geração pode levar mais tempo. Agradecemos seu feedback!",
        duration: 6000,
        icon: <Info className="h-5 w-5 text-accent" />,
      });
    }
  };

  const isFormValid = () => {
    const baseValid =
      formData.brand &&
      formData.objective &&
      formData.platform &&
      formData.description &&
      formData.audience &&
      formData.tone.length > 0 &&
      referenceFiles.length > 0;
    
    if (isVideoMode) {
      return (
        baseValid &&
        ratio &&
        (transformationType !== "image_to_video" || duration)
      );
    }
    return baseValid;
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
      // Refresh team data with updated credits after action
      const teamResponse = await fetch(`/api/teams/${user.teamId}?summary=true`);
      if (teamResponse.ok) {
        const updatedTeamData = await teamResponse.json();
        setTeamData(updatedTeamData);
      }
    } catch (error) {
      console.error("Failed to update credits:", error);
    }
  };

  const handleGenerateContent = async () => {
    if (!team) return toast.error("Equipe não encontrada.");
    
    // Check credits from teamData instead of team.credits
    const availableCredits = teamData?.credits?.contentSuggestions || 0;
    if (availableCredits <= 0)
      return toast.error("Seus créditos para criação de conteúdo acabaram.");
      
    if (!isFormValid())
      return toast.error(
        "Por favor, preencha todos os campos obrigatórios (*)."
      );
    if (!user?.teamId || !user?.id)
      return toast.error(
        "Dados do usuário não encontrados. Faça login novamente."
      );

    setLoading(true);
    const toastId = toast.loading("Gerando seu conteúdo...", {
      description: "A IA está trabalhando. Isso pode levar alguns instantes.",
    });

    try {
      const base64Files = await Promise.all(
        referenceFiles.map((file) => fileToBase64(file))
      );
      const selectedBrand = brands.find((b) => b.name === formData.brand);
      if (!selectedBrand) throw new Error("Marca selecionada não encontrada.");

      const requestData: any = {
        ...formData,
        prompt: formData.description,
        transformationType,
        teamId: user.teamId,
        brandId: selectedBrand.id,
        userId: user.id,
      };
      if (isVideoMode) {
        requestData.ratio = ratio;
        if (transformationType === "image_to_video")
          requestData.duration = Number(duration);
        requestData.referenceFile = base64Files[0];
      } else {
        requestData.referenceImage = base64Files[0];
      }

      const endpoint = isVideoMode
        ? "/api/generate-video"
        : "/api/generate-image";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Falha ao processar a resposta de erro." }));
        throw new Error(errorData.error || "Falha ao gerar o conteúdo.");
      }

      await updateTeamCredits();
      toast.success("Conteúdo gerado com sucesso!", {
        id: toastId,
        description: "Redirecionando para a página de resultado...",
      });
      router.push("/content/result");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar o conteúdo.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                  <Sparkles className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    Criar Conteúdo
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Preencha os campos para gerar um post com IA
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                <div className="flex items-center space-x-1 rounded-full bg-muted p-1 border flex-1">
                  <Button
                    variant={!isVideoMode ? "default" : "ghost"}
                    onClick={() => handleVideoModeChange(false)}
                    className="w-full rounded-full font-semibold transition-all duration-200 ease-in-out hover:bg-background/50 hover:text-muted-foreground"
                  >
                    Imagem
                  </Button>
                  <Button
                    variant={isVideoMode ? "default" : "ghost"}
                    onClick={() => handleVideoModeChange(true)}
                    className="w-full rounded-full font-semibold transition-all duration-200 ease-in-out hover:bg-background/50 hover:text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Vídeo
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none transition-colors duration-200 ${
                          isVideoMode
                            ? "bg-background text-primary"
                            : "border border-primary/50 bg-primary/20 text-primary"
                        }`}
                      >
                        BETA
                      </span>
                    </div>
                  </Button>
                </div>
                {isLoadingData ? (
                  <Skeleton className="h-14 w-full sm:w-40 rounded-xl" />
                ) : (
                  team && (
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
                              {teamData?.credits?.contentSuggestions || 0}
                            </span>
                            <p className="text-md text-muted-foreground font-medium leading-tight">
                              Criações Restantes
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          <div className="w-full lg:w-2/5 xl:w-1/3 flex-shrink-0 space-y-6">
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Configuração Básica
                </h2>
                <p className="text-muted-foreground text-sm">
                  Defina marca, tema e público
                </p>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="brand"
                    className="text-sm font-semibold text-foreground"
                  >
                    Marca <span className="text-red-600">*</span>
                  </Label>
                  {isLoadingData ? (
                    <Skeleton className="h-11 w-full rounded-xl" />
                  ) : (
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange("brand", value)
                      }
                      value={formData.brand}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50">
                        <SelectValue placeholder="Selecione a marca" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/20">
                        {brands.map((b) => (
                          <SelectItem
                            key={b.id}
                            value={b.name}
                            className="rounded-lg"
                          >
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="theme"
                    className="text-sm font-semibold text-foreground"
                  >
                    Tema Estratégico
                  </Label>
                  {isLoadingData ? (
                    <Skeleton className="h-11 w-full rounded-xl" />
                  ) : (
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange("theme", value)
                      }
                      value={formData.theme}
                      disabled={
                        !formData.brand ||
                        themes.filter(
                          (t) =>
                            t.brandId ===
                            brands.find((b) => b.name === formData.brand)?.id
                        ).length === 0
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 disabled:opacity-50">
                        <SelectValue
                          placeholder={
                            !formData.brand
                              ? "Primeiro, escolha a marca"
                              : filteredThemes.length === 0
                              ? "Nenhum tema disponível"
                              : "Selecione um tema (opcional)"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/20">
                        {filteredThemes.map((t) => (
                          <SelectItem
                            key={t.id}
                            value={t.title}
                            className="rounded-lg"
                          >
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="persona"
                    className="text-sm font-semibold text-foreground"
                  >
                    Persona
                  </Label>
                  {isLoadingData ? (
                    <Skeleton className="h-11 w-full rounded-xl" />
                  ) : (
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange("persona", value)
                      }
                      value={formData.persona}
                      disabled={
                        !formData.brand ||
                        personas.filter(
                          (p) =>
                            p.brandId ===
                            brands.find((b) => b.name === formData.brand)?.id
                        ).length === 0
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50 disabled:opacity-50">
                        <SelectValue
                          placeholder={
                            !formData.brand
                              ? "Primeiro, escolha a marca"
                              : "Adicionar persona"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/20">
                        {personas
                          .filter(
                            (p) =>
                              p.brandId ===
                              brands.find((b) => b.name === formData.brand)?.id
                          )
                          .map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.name}
                              className="rounded-lg"
                            >
                              {p.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="platform"
                    className="text-sm font-semibold text-foreground"
                  >
                    Plataforma <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("platform", value)
                    }
                    value={formData.platform}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50">
                      <SelectValue placeholder="Onde será postado?" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/20">
                      <SelectItem value="Instagram" className="rounded-lg">
                        Instagram
                      </SelectItem>
                      <SelectItem value="Facebook" className="rounded-lg">
                        Facebook
                      </SelectItem>
                      <SelectItem value="LinkedIn" className="rounded-lg">
                        LinkedIn
                      </SelectItem>
                      <SelectItem value="Twitter" className="rounded-lg">
                        Twitter (X)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="audience"
                    className="text-sm font-semibold text-foreground"
                  >
                    Público-Alvo <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="audience"
                    placeholder="Ex: Jovens de 18-25 anos"
                    value={formData.audience}
                    onChange={handleInputChange}
                    className="h-11 rounded-xl border-2 border-border/50 bg-background/50"
                  />
                </div>
                {isVideoMode && (
                  <>
                    <div className="space-y-3">
                      <Label
                        htmlFor="transformation"
                        className="text-sm font-semibold"
                      >
                        Tipo de Transformação <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={transformationType}
                        onValueChange={(value) =>
                          setTransformationType(value as any)
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image_to_video">
                            Imagem para Vídeo
                          </SelectItem>
                          <SelectItem value="video_to_video">
                            Vídeo para Vídeo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label
                          htmlFor="ratio"
                          className="text-sm font-semibold"
                        >
                          Proporção <span className="text-red-600">*</span>
                        </Label>
                        <Select value={ratio} onValueChange={setRatio}>
                          <SelectTrigger className="h-11 rounded-xl border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="768:1280">
                              Vertical (9:16)
                            </SelectItem>
                            <SelectItem value="1280:768">
                              Horizontal (16:9)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {transformationType === "image_to_video" && (
                        <div className="space-y-3">
                          <Label
                            htmlFor="duration"
                            className="text-sm font-semibold"
                          >
                            Duração (s) <span className="text-red-600">*</span>
                          </Label>
                          <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger className="h-11 rounded-xl border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5s</SelectItem>
                              <SelectItem value="10">10s</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </>
                )}
                  <div className="space-y-3">
                    <Label
                      htmlFor="referenceFile"
                      className="text-sm font-semibold text-foreground"
                    >
                      {isVideoMode
                        ? transformationType === "image_to_video"
                          ? "Imagem de Referência"
                          : "Vídeo de Referência"
                        : "Imagem de Referência"}
                    </Label> <span className="text-red-600">*</span>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Input
                        ref={pasteAreaRef}
                        id="referenceFiles"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setReferenceFiles((prev) =>
                            [...prev, ...files].slice(0, 10)
                          );
                        }}
                        onPaste={handlePaste}
                        style={{ flex: 1 }}
                        className="h-11 rounded-xl border-2 border-border/50 bg-background/50 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary"
                      />
                    </div>

                    <div
                      tabIndex={0}
                      suppressContentEditableWarning
                      onPaste={handlePaste}
                      style={{
                        border: "2px dashed #aaa",
                        borderRadius: 8,
                        padding: 16,
                        marginTop: 8,
                        minHeight: 40,
                        background: "#fafafa",
                        outline: "none",
                      }}
                    >
                      Cole sua imagem aqui (Ctrl+V)
                    </div>

                    {referenceFiles.length > 0 && (
                      <div className="text-sm text-green-600 flex flex-col gap-1 mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                        {referenceFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span>✓ {file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(idx)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 flex-shrink-0 rounded-full transition-all duration-200 relative z-20 ml-2"
                              title="Remover arquivo"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 space-y-6">
            <Card className="backdrop-blur-sm bg-card/60 border border-border/20 shadow-lg shadow-black/5 rounded-2xl h-full">
              <CardHeader className="pb-4 bg-gradient-to-r from-secondary/5 to-accent/5">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  Detalhes do Conteúdo
                </h2>
                <p className="text-muted-foreground text-sm">
                  Descreva o objetivo e características do post
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="objective"
                    className="text-sm font-semibold text-foreground"
                  >
                    Objetivo do Post <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    id="objective"
                    placeholder="Qual a principal meta? (ex: gerar engajamento, anunciar um produto, educar)"
                    value={formData.objective}
                    onChange={handleInputChange}
                    className="min-h-[100px] rounded-xl border-2 border-border/50 bg-background/50 resize-none"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold text-foreground"
                  >
                    {isVideoMode
                      ? "Descrição Visual do Vídeo"
                      : "Descrição Visual da Imagem"}
                  </Label> <span className="text-red-600">*</span>
                  <Textarea
                    id="description"
                    placeholder={
                      isVideoMode
                        ? "Como um roteirista: descreva a ação, câmera e atmosfera..."
                        : "Como um diretor de arte: descreva a cena, iluminação e emoção..."
                    }
                    value={formData.description}
                    onChange={handleInputChange}
                    className="min-h-[120px] rounded-xl border-2 border-border/50 bg-background/50 resize-none"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="tone"
                    className="text-sm font-semibold text-foreground"
                  >
                    Tom de Voz <span className="text-red-600">*</span> (máximo 4)
                  </Label>
                  <Select onValueChange={handleToneSelect} value="">
                    <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 bg-background/50">
                      <SelectValue placeholder="Adicionar tom de voz..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/20">
                      {toneOptions.map((option) => (
                        <SelectItem
                          key={option}
                          value={option}
                          disabled={formData.tone.includes(option)}
                          className="rounded-lg"
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
                    {formData.tone.length === 0 ? (
                      <span className="text-sm text-muted-foreground italic self-center">
                        Nenhum tom selecionado
                      </span>
                    ) : (
                      formData.tone.map((tone) => (
                        <div
                          key={tone}
                          className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 border-2 border-primary/30 text-primary text-sm font-semibold px-3 py-1.5 rounded-xl"
                        >
                          {tone.charAt(0).toUpperCase() + tone.slice(1)}
                          <button
                            onClick={() => handleToneRemove(tone)}
                            className="ml-1 text-primary hover:text-destructive p-0.5 rounded-full hover:bg-destructive/10"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="additionalInfo"
                    className="text-sm font-semibold text-foreground"
                  >
                    Informações Extras
                  </Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Detalhes cruciais (ex: usar a cor #FF5733, incluir nosso logo...)"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    className="min-h-[80px] rounded-xl border-2 border-border/50 bg-background/50 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="pt-4">
          <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border border-border/20 rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={handleGenerateContent}
                  disabled={loading || !isFormValid()}
                  className="w-full max-w-md h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-secondary hover:from-primary/90 hover:via-purple-600/90 hover:to-secondary/90 shadow-xl transition-all duration-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin mr-3 h-5 w-5" />
                      Gerando conteúdo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      Gerar Conteúdo
                    </>
                  )}
                </Button>
                {!isFormValid() && !loading && (
                  <div className="text-center bg-muted/30 p-3 rounded-xl border border-border/30 max-w-md">
                    <p className="text-muted-foreground text-sm">
                      Complete todos os campos obrigatórios (*) para gerar
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
