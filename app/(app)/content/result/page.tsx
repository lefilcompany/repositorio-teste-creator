// app/(app)/content/result/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react'; // AJUSTE: Importado o useRef
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader, Download, ArrowLeft, Copy, Check, ThumbsUp, Edit, ShieldAlert, Undo2, Sparkles, RefreshCw } from 'lucide-react';
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
  const [hasConnectivityError, setHasConnectivityError] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const loadContent = async (retryCount = 0) => {
      if (!user?.id || !user?.teamId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/actions?userId=${user.id}&teamId=${user.teamId}&status=Em revisão&limit=1`);

        if (!response.ok) {
          // Se for erro 500 (possivelmente conexão DB), tenta retry
          if (response.status >= 500 && retryCount < 3) {
            console.log(`[ResultPage] Erro ${response.status}, tentando novamente... (tentativa ${retryCount + 1}/3)`);
            toast.info('Problema de conexão detectado, tentando novamente...', {
              duration: 2000
            });
            setTimeout(() => loadContent(retryCount + 1), 2000 * (retryCount + 1)); // Delay progressivo
            return;
          }
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        const actions = Array.isArray(json) ? json : json?.data;
        console.log('[ResultPage] Dados retornados da API /api/actions:', json);

        if (Array.isArray(actions) && actions.length > 0) {
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

        // Carrega dados do time
        if (user?.teamId) {
          const teamsRes = await fetch(`/api/teams?userId=${user.id}`);
          if (teamsRes.ok) {
            const teamsData: Team[] = await teamsRes.json();
            const currentTeam = teamsData.find(t => t.id === user.teamId);
            setTeam(currentTeam || null);
          }
        }
      } catch (e: any) {
        console.error('[ResultPage] Erro ao carregar conteúdo:', e);
        
        // Tratamento específico para erros de conectividade
        if (e.message.includes('fetch') || e.message.includes('network') || e.message.includes('500') || e.message.includes('database') || e.message.includes('reach database server')) {
          setHasConnectivityError(true);
          toast.error('Problema de conectividade detectado', { 
            description: "Verifique sua conexão ou tente recarregar a página.",
            duration: 8000
          });
        } else {
          toast.error(e.message || 'Erro ao carregar conteúdo', { 
            description: "Você será redirecionado para criar novo conteúdo." 
          });
          setTimeout(() => router.push('/content'), 2000);
        }
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
      if (content && content.actionId && !isApproving) {
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
    
    // Removemos a chamada para /review que estava causando timeout
    // O conteúdo já foi atualizado diretamente pela API de refatoração
    // e será salvo quando o usuário aprovar o conteúdo final
  };

  const handleApprove = async () => {
    if (!content) return toast.error('Conteúdo não encontrado');

    setIsApproving(true); // Inicia o estado de aprovação
    
    // Toast de loading para aprovação
    const approvingToastId = toast.loading('Aprovando conteúdo...', {
      description: 'Salvando suas alterações e finalizando o processo...'
    });

    const attemptApprove = async (retryCount = 0): Promise<void> => {
      try {
        const finalContent = versions[currentVersionIndex]?.content || content;
        const { actionId } = finalContent;

        if (!actionId) throw new Error('ID da ação não encontrado');

        // Prepara o payload com o conteúdo atual (incluindo revisões)
        const updatePayload = {
          status: 'Aprovado',
          approved: true,
          result: {
            imageUrl: finalContent.imageUrl,
            videoUrl: finalContent.videoUrl,
            title: finalContent.title,
            body: finalContent.body,
            hashtags: finalContent.hashtags
          },
          revisions: finalContent.revisions
        };

        const updateRes = await fetch(`/api/actions/${actionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        // AJUSTE: Tratamento de erro robusto para evitar crash com respostas não-JSON
        if (!updateRes.ok) {
          // Retry para erros de conectividade (5xx)
          if (updateRes.status >= 500 && retryCount < 3) {
            console.log(`[handleApprove] Erro ${updateRes.status}, tentando novamente... (tentativa ${retryCount + 1}/3)`);
            toast.info('Problema de conexão ao aprovar, tentando novamente...', {
              duration: 2000
            });
            setTimeout(() => attemptApprove(retryCount + 1), 2000 * (retryCount + 1));
            return;
          }
          
          const errorText = await updateRes.text();
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || errorData.details || 'Erro ao aprovar ação');
          } catch (e) {
            throw new Error(errorText || `Erro ${updateRes.status} ao aprovar a ação`);
          }
        }

        const approvedAction = await updateRes.json();
        
        // Atualiza o toast de loading para sucesso
        toast.success('Conteúdo aprovado e salvo no histórico!', {
          id: approvingToastId,
          description: 'Todas as revisões foram salvas com sucesso. Redirecionando...'
        });

        // Só limpa o content após o redirecionamento para evitar erro de null
        setTimeout(() => {
          setContent(null); // Move para dentro do setTimeout
          router.push(`/historico?actionId=${approvedAction.id}`);
        }, 1500); // Aumenta o tempo para mostrar o toast de sucesso

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao aprovar o conteúdo';
        
        // Tratamento específico para erros de conectividade
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || retryCount >= 3) {
          toast.error('Erro de conectividade ao aprovar', {
            id: approvingToastId,
            description: "Verifique sua conexão e tente novamente. O conteúdo não foi perdido."
          });
        } else {
          toast.error(errorMessage, {
            id: approvingToastId,
            description: "Tente novamente ou entre em contato com o suporte se o problema persistir."
          });
        }
        setIsApproving(false); // Reseta o estado em caso de erro
      }
    };

    try {
      await attemptApprove();
    } finally {
      // Garante que o estado seja resetado mesmo em caso de erro não capturado
      setTimeout(() => setIsApproving(false), 2000);
    }
  };

  const handleStartRevision = (type: 'image' | 'text') => {
    if (team && team.credits.contentReviews <= 0) {
      return toast.error('Você não tem créditos de revisão suficientes.', {
        description: 'Entre em contato com seu administrador para obter mais créditos.'
      });
    }
    if (content && content.revisions >= 2) {
      return toast.error('Limite de 2 revisões por conteúdo atingido.', {
        description: 'Você já utilizou todas as revisões disponíveis para este conteúdo.'
      });
    }
    
    // Feedback informativo sobre o que vai acontecer
    toast.info(
      `Iniciando revisão ${type === 'image' ? 'da imagem' : 'da legenda'}`, 
      {
        description: 'Descreva detalhadamente os ajustes que você deseja fazer.',
        duration: 3000
      }
    );
    
    setRevisionType(type);
    setShowRevisionDialog(false);
    setShowRevisionForm(true);
  };

  const handleRevisionComplete = async (updatedContent: GeneratedContent) => {
    try {
      // Atualiza os créditos do time
      await updateTeamCredits('contentReviews');
      
      const contentWithRevision = {
        ...updatedContent,
        revisions: (content?.revisions || 0) + 1,
        actionId: content?.actionId || updatedContent.id
      };
      
      // Cria nova versão do conteúdo
      const newVersion: ContentVersion = {
        id: `version-${Date.now()}`,
        content: contentWithRevision,
        timestamp: new Date().toISOString(),
        type: revisionType === 'image' ? 'image_revision' : 'text_revision'
      };
      
      const updatedVersions = [...versions, newVersion];
      setVersions(updatedVersions);
      setCurrentVersionIndex(updatedVersions.length - 1);
      
      // Atualiza o conteúdo atual (sem fazer chamada para API problemática)
      updateCurrentContent(contentWithRevision);
      
      // Limpa o estado da revisão
      setShowRevisionForm(false);
      setRevisionType(null);
      
      // Toast de confirmação para o usuário
      toast.success(
        `Revisão ${revisionType === 'image' ? 'da imagem' : 'do texto'} aplicada!`,
        {
          description: 'As alterações serão salvas quando você aprovar o conteúdo final.'
        }
      );
      
    } catch (error) {
      console.error('Erro ao processar revisão:', error);
      toast.error('Erro ao processar a revisão', {
        description: 'Ocorreu um erro ao aplicar as alterações. Tente novamente.'
      });
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
        
        // Atualiza o conteúdo localmente (será salvo quando aprovar)
        setContent(revertedContent);
        toast.info("Versão anterior restaurada. Créditos utilizados foram mantidos.", {
          description: "As alterações serão salvas quando você aprovar o conteúdo."
        });
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

  const handleReloadPage = () => {
    toast.info('Recarregando página...', { duration: 1000 });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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
          <div className="grid grid-cols-2 md:flex md:items-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
            {hasConnectivityError && (
              <Button
                onClick={handleReloadPage}
                variant="outline"
                size="sm"
                className="rounded-full border-orange-500 text-orange-600 hover:bg-orange-50 text-xs md:text-sm px-2 md:px-4 h-8 md:h-10 col-span-2"
              >
                <RefreshCw className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> Recarregar
              </Button>
            )}
            <Button
              onClick={handleRevert}
              variant="outline"
              size="sm"
              className="rounded-full text-xs md:text-sm px-2 md:px-4 h-8 md:h-10"
              disabled={currentVersionIndex <= 0 || isApproving}
              title={
                isApproving ? "Aguarde a aprovação finalizar"
                  : currentVersionIndex <= 0 ? "Você já está na versão original" 
                    : "Reverte para a versão anterior"
              }
            >
              <Undo2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> 
              <span className="hidden sm:inline">Reverter</span>
              <span className="sm:hidden">Rev.</span>
            </Button>
            <Button
              onClick={() => setShowRevisionDialog(true)}
              variant="secondary"
              size="sm"
              className="rounded-full text-xs md:text-sm px-2 md:px-4 h-8 md:h-10"
              disabled={!content || content.revisions >= 2 || (team && team.credits.contentReviews <= 0) || isApproving}
              title={
                isApproving ? "Aguarde a aprovação finalizar"
                  : !content ? "Carregando..."
                    : content.revisions >= 2 ? "Limite de 2 revisões atingido"
                      : team && team.credits.contentReviews <= 0 ? "Sem créditos de revisão"
                        : "Fazer revisão do conteúdo"
              }
            >
              <Edit className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> 
              <span className="hidden sm:inline">Revisar ({content ? 2 - content.revisions : 0} rest.)</span>
              <span className="sm:hidden">Rev. ({content ? 2 - content.revisions : 0})</span>
            </Button>
            <Button 
              onClick={handleApprove} 
              size="sm"
              className="rounded-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm px-2 md:px-4 h-8 md:h-10 col-span-2"
              disabled={!content || isApproving}
            >
              {isApproving ? (
                <>
                  <Loader className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" /> 
                  <span className="hidden sm:inline">Aprovando...</span>
                  <span className="sm:hidden">Aprovando...</span>
                </>
              ) : (
                <>
                  <ThumbsUp className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> 
                  <span className="hidden sm:inline">Aprovar e Salvar</span>
                  <span className="sm:hidden">Aprovar e salvar</span>
                </>
              )}
            </Button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card className={cn('w-full bg-muted/30 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/10 relative', content?.videoUrl ? 'aspect-[5/3]' : 'aspect-square')}>
              {content?.videoUrl ? (
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
                <Image src={content?.imageUrl || ''} alt="Imagem Gerada" fill className="object-cover" />
              )}
              {!content?.videoUrl && (
                <Button 
                  onClick={handleDownloadImage} 
                  disabled={isDownloading || !content || isApproving} 
                  size="icon" 
                  className="absolute top-4 right-4 rounded-full w-12 h-12 shadow-lg"
                  title={isApproving ? "Aguarde a aprovação finalizar" : "Download da imagem"}
                >
                  {isDownloading ? <Loader className="animate-spin" /> : <Download />}
                </Button>
              )}
              {content?.videoUrl && (
                <Button asChild variant="outline" size="sm" className="absolute bottom-4 right-4 rounded-full" title="Abrir vídeo em nova aba">
                  <a href={content.videoUrl} target="_blank" rel="noopener noreferrer">Abrir vídeo</a>
                </Button>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="w-full bg-card rounded-2xl p-1 shadow-lg border-2 border-primary/10">
              <CardHeader className="p-4 flex-row justify-between items-center border-b border-border/10">
                <CardTitle className="text-xl font-bold text-foreground">{content?.title || 'Carregando...'}</CardTitle>
                <Button 
                  onClick={handleCopyToClipboard} 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-primary" 
                  disabled={!content || isApproving}
                  title={isApproving ? "Aguarde a aprovação finalizar" : "Copiar conteúdo"}
                >
                  {copied ? <Check className="text-green-500" /> : <Copy />}
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none text-left">
                  <p className="whitespace-pre-line text-base text-muted-foreground">{content?.body || 'Carregando conteúdo...'}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {content?.hashtags?.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">#{tag}</span>
                    )) || <span className="text-muted-foreground">Carregando hashtags...</span>}
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
                Você pode fazer até {content ? 2 - content.revisions : 0} revisões. Cada uma consome 1 crédito.
                Restam {team?.credits.contentReviews || 0} créditos de revisão.
                <br />
                <strong className="text-amber-600 dark:text-amber-400">
                  ⚠️ Importante: Os créditos são consumidos mesmo se você reverter as alterações.
                </strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              {!content?.videoUrl && (
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