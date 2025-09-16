// app/(app)/content/result/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react'; // AJUSTE: Importado o useRef
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader, Download, ArrowLeft, Copy, Check, ThumbsUp, Edit, ShieldAlert, Undo2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import RevisionForm from '@/components/content/revisionForm';
import type { Team } from '@/types/team';
import { useAuth } from '@/hooks/useAuth';
import { downloadImage } from '@/lib/download-utils';
import { cn } from '@/lib/utils';

interface GeneratedContent {
  id: string;
  videoUrl?: string;
  imageUrl: string;
  title: string;
  body: string;
  hashtags: string[];
  revisions: number;
  brand?: string;
  theme?: string;
  actionId: string;
}

interface ContentVersion {
  id: string;
  content: GeneratedContent;
  timestamp: string;
  type: 'original' | 'image_revision' | 'text_revision';
}

export default function ResultPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionType, setRevisionType] = useState<'image' | 'text' | null>(null);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [brandId, setBrandId] = useState<string>('');

  // AJUSTE: Usando useRef para controlar o estado de aprovação de forma mais segura e contida no componente.
  const isApproving = useRef(false);

  useEffect(() => {
    const loadContent = async () => {
      if (!user?.id || !user?.teamId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/actions?userId=${user.id}&teamId=${user.teamId}&status=Em revisão&limit=1`);

        if (response.ok) {
          const actions = await response.json();
          console.log('[ResultPage] Dados retornados da API /api/actions:', actions);

          if (actions && actions.length > 0) {
            const action = actions[0];
            const parsedContent: GeneratedContent = {
              id: action.id,
              actionId: action.id,
              videoUrl: action.result?.videoUrl || "",
              imageUrl: action.result?.imageUrl || "",
              title: action.result?.title || "",
              body: action.result?.body || "",
              hashtags: Array.isArray(action.result?.hashtags) ? action.result.hashtags : [],
              revisions: action.revisions || 0,
              brand: action.brand?.name,
              theme: action.details?.theme
            };

            setContent(parsedContent);
            setBrandId(action.brandId);

            const initialVersion: ContentVersion = {
              id: `version-${Date.now()}`,
              content: parsedContent,
              timestamp: new Date().toISOString(),
              type: 'original'
            };

            setVersions([initialVersion]);
            setCurrentVersionIndex(0);
          } else {
            throw new Error('Nenhum conteúdo gerado encontrado.');
          }
        } else {
          throw new Error('Erro ao buscar conteúdo gerado.');
        }

        if (user?.teamId) {
          const teamsRes = await fetch(`/api/teams?userId=${user.id}`);
          if (teamsRes.ok) {
            const teamsData: Team[] = await teamsRes.json();
            const currentTeam = teamsData.find(t => t.id === user.teamId);
            setTeam(currentTeam || null);
          }
        }
      } catch (e: any) {
        toast.error(e.message, { description: "Você será redirecionado para criar novo conteúdo." });
        router.push('/content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [user, router]);

  /**
  * Hook para detectar quando o usuário sai da página sem aprovar
  * Marca a ação como "Rejeitada" se sair sem aprovar
  */
  useEffect(() => {
    // AJUSTE: Lógica de rejeição centralizada e corrigida
    const rejectAction = (useKeepAlive = false) => {
      if (content && content.actionId && !isApproving.current) {
        fetch(`/api/actions/${content.actionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Rejeitada',
            approved: false,
          }),
          keepalive: useKeepAlive,
        }).catch(() => {
          // Erro silencioso, pois é uma ação de limpeza
        });
      }
    };

    const handleBeforeUnload = () => rejectAction(true);
    const handleRouteChange = () => rejectAction();

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleRouteChange();
    };
  }, [content]);

  const updateTeamCredits = useCallback(async (creditType: 'contentReviews' | 'contentSuggestions', amount = 1) => {
    if (!user?.teamId || !team) return;
    try {
      const updatedCredits = { ...team.credits };
      if (creditType in updatedCredits) {
        (updatedCredits as any)[creditType] -= amount;
      }
      const updateRes = await fetch('/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: team.id, credits: updatedCredits }),
      });
      if (updateRes.ok) {
        setTeam(await updateRes.json());
      }
    } catch (e) {
      // Falha silenciosa na atualização de créditos
    }
  }, [user?.teamId, team]);

  const updateCurrentContent = async (newContent: GeneratedContent) => {
    const updatedContent = {
      ...newContent,
      actionId: content?.actionId || newContent.id
    };
    setContent(updatedContent);
    try {
      if (user?.id && updatedContent.actionId) {
        await fetch(`/api/actions/${updatedContent.actionId}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requesterUserId: user.id,
            newImageUrl: updatedContent.imageUrl,
            newTitle: updatedContent.title,
            newBody: updatedContent.body,
            newHashtags: updatedContent.hashtags
          })
        });
      }
    } catch (error) {
      toast.error('Erro ao atualizar conteúdo da revisão.');
    }
  };

  const handleApprove = async () => {
    if (!content) return toast.error('Conteúdo não encontrado');

    isApproving.current = true; // AJUSTE: Usando useRef

    try {
      const finalContent = versions[currentVersionIndex]?.content || content;
      const { actionId } = finalContent;

      if (!actionId) throw new Error('ID da ação não encontrado');

      const updateRes = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Aprovado',
          approved: true,
        })
      });

      // AJUSTE: Tratamento de erro robusto para evitar crash com respostas não-JSON
      if (!updateRes.ok) {
        const errorText = await updateRes.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.details || 'Erro ao aprovar ação');
        } catch (e) {
          throw new Error(errorText || `Erro ${updateRes.status} ao aprovar a ação`);
        }
      }

      const approvedAction = await updateRes.json();
      toast.success('Conteúdo aprovado e salvo no histórico!');
      setContent(null);

      setTimeout(() => {
        router.push(`/historico?actionId=${approvedAction.id}`);
      }, 500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao aprovar o conteúdo';
      toast.error(errorMessage, {
        description: "Tente novamente ou entre em contato com o suporte se o problema persistir."
      });
      isApproving.current = false; // AJUSTE: Reseta a flag em caso de erro
    }
  };

  const handleStartRevision = (type: 'image' | 'text') => {
    if (team && team.credits.contentReviews <= 0) {
      return toast.error('Você não tem créditos de revisão suficientes.');
    }
    if (content && content.revisions >= 2) {
      return toast.error('Limite de 2 revisões por conteúdo atingido.');
    }
    setRevisionType(type);
    setShowRevisionDialog(false);
    setShowRevisionForm(true);
  };

  const handleRevisionComplete = async (updatedContent: GeneratedContent) => {
    try {
      updateTeamCredits('contentReviews');
      const contentWithRevision = {
        ...updatedContent,
        revisions: (content?.revisions || 0) + 1,
        actionId: content?.actionId || updatedContent.id
      };
      const newVersion: ContentVersion = {
        id: `version-${Date.now()}`,
        content: contentWithRevision,
        timestamp: new Date().toISOString(),
        type: revisionType === 'image' ? 'image_revision' : 'text_revision'
      };
      const updatedVersions = [...versions, newVersion];
      setVersions(updatedVersions);
      setCurrentVersionIndex(updatedVersions.length - 1);
      await updateCurrentContent(contentWithRevision);
      setShowRevisionForm(false);
      setRevisionType(null);
      toast.success(`Revisão ${revisionType === 'image' ? 'da imagem' : 'do texto'} concluída!`);
    } catch (error) {
      toast.error('Erro ao processar a revisão');
    }
  };

  const handleRevert = async () => {
    if (currentVersionIndex <= 0) return toast.info("Você já está na versão original.");

    try {
      const previousIndex = currentVersionIndex - 1;
      const previousVersion = versions[previousIndex];

      if (previousVersion) {
        setCurrentVersionIndex(previousIndex);
        const revertedContent = {
          ...previousVersion.content,
          revisions: content?.revisions || 0,
          actionId: content?.actionId || previousVersion.content.id
        };
        if (revertedContent.actionId) {
          await fetch(`/api/actions/${revertedContent.actionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              result: {
                imageUrl: revertedContent.imageUrl,
                title: revertedContent.title,
                body: revertedContent.body,
                hashtags: revertedContent.hashtags
              },
              revisions: revertedContent.revisions
            })
          });
        }
        setContent(revertedContent);
        toast.info("Versão anterior restaurada. Créditos utilizados foram mantidos.");
      }
    } catch (error) {
      toast.error('Erro ao reverter para versão anterior');
    }
  };

  const handleDownloadImage = async () => {
    if (!content?.imageUrl) return toast.error('URL da imagem não encontrada.');
    setIsDownloading(true);
    toast.info("Iniciando download da imagem...");
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      const filename = `creator-ai-image-${timestamp}`;
      await downloadImage(content.imageUrl, { filename, useProxy: true, timeout: 30000 });
      toast.success('Download concluído com sucesso!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Falha no download: ${errorMessage}`, {
        description: 'Verifique sua conexão e tente novamente.'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!content) return;
    const fullText = `${content.title}\n\n${content.body}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Conteúdo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ----- RENDERIZAÇÃO -----
  if (showRevisionForm && content && revisionType) {
    return (
      <RevisionForm
        content={content}
        revisionType={revisionType}
        onRevisionComplete={handleRevisionComplete}
        onCancel={() => { setShowRevisionForm(false); setRevisionType(null); }}
        teamId={user?.teamId}
        brandId={brandId}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-4">Ocorreu um Erro</h2>
        <p className="text-muted-foreground mb-6">Não foi possível carregar o conteúdo.</p>
        <Button onClick={() => router.push('/content')}>
          <ArrowLeft className="mr-2" /> Voltar para Criação
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Conteúdo Gerado</h1>
              <p className="text-muted-foreground">
                Revise, edite, aprove ou baixe seus resultados.
                {versions.length > 1 && (
                  <span className="block text-sm text-primary mt-1">
                    Versão {currentVersionIndex + 1} de {versions.length} - {
                      versions[currentVersionIndex]?.type.replace('_', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase())
                    }
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0 flex-wrap">
            <Button
              onClick={handleRevert}
              variant="outline"
              className="rounded-full"
              disabled={currentVersionIndex <= 0}
              title={currentVersionIndex <= 0 ? "Você já está na versão original" : "Reverte para a versão anterior"}
            >
              <Undo2 className="mr-2" /> Reverter
            </Button>
            <Button
              onClick={() => setShowRevisionDialog(true)}
              variant="secondary"
              className="rounded-full"
              disabled={content.revisions >= 2 || (team && team.credits.contentReviews <= 0)}
              title={
                content.revisions >= 2 ? "Limite de 2 revisões atingido"
                  : team && team.credits.contentReviews <= 0 ? "Sem créditos de revisão"
                    : "Fazer revisão do conteúdo"
              }
            >
              <Edit className="mr-2" /> Revisar ({2 - content.revisions} rest.)
            </Button>
            <Button onClick={handleApprove} className="rounded-full bg-green-600 hover:bg-green-700 text-white">
              <ThumbsUp className="mr-2" /> Aprovar e Salvar
            </Button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card className={cn('w-full bg-muted/30 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/10 relative', content.videoUrl ? 'aspect-[5/3]' : 'aspect-square')}>
              {content.videoUrl ? (
                <video
                  key={content.videoUrl}
                  src={content.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  crossOrigin="anonymous"
                  poster={content.imageUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image src={content.imageUrl} alt="Imagem Gerada" fill className="object-cover" />
              )}
              {!content.videoUrl && (
                <Button onClick={handleDownloadImage} disabled={isDownloading} size="icon" className="absolute top-4 right-4 rounded-full w-12 h-12 shadow-lg">
                  {isDownloading ? <Loader className="animate-spin" /> : <Download />}
                </Button>
              )}
              {content.videoUrl && (
                <Button asChild variant="outline" size="sm" className="absolute bottom-4 right-4 rounded-full" title="Abrir vídeo em nova aba">
                  <a href={content.videoUrl} target="_blank" rel="noopener noreferrer">Abrir vídeo</a>
                </Button>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="w-full bg-card rounded-2xl p-1 shadow-lg border-2 border-primary/10">
              <CardHeader className="p-4 flex-row justify-between items-center border-b border-border/10">
                <CardTitle className="text-xl font-bold text-foreground">{content.title}</CardTitle>
                <Button onClick={handleCopyToClipboard} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  {copied ? <Check className="text-green-500" /> : <Copy />}
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none text-left">
                  <p className="whitespace-pre-line text-base text-muted-foreground">{content.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {content.hashtags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">#{tag}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>O que você deseja revisar?</DialogTitle>
              <DialogDescription>
                Você pode fazer até {2 - content.revisions} revisões. Cada uma consome 1 crédito.
                Restam {team?.credits.contentReviews || 0} créditos de revisão.
                <br />
                <strong className="text-amber-600 dark:text-amber-400">
                  ⚠️ Importante: Os créditos são consumidos mesmo se você reverter as alterações.
                </strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              {!content.videoUrl && (
                <Button onClick={() => handleStartRevision('image')} className="flex-1" variant="secondary">Ajustar a Imagem</Button>
              )}
              <Button onClick={() => handleStartRevision('text')} className="flex-1" variant="secondary">Ajustar a Legenda</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}