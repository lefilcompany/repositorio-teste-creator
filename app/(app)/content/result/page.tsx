/**
 * Página de Resultado de Conteúdo Gerado
 * 
 * Esta página exibe o conteúdo gerado pela IA e permite ao usuário:
 * - Visualizar o conteúdo (imagem + texto + hashtags)
 * - Fazer revisões (até 2 por conteúdo)
 * - Aprovar e salvar no histórico
 * - Fazer download da imagem
 * - Copiar o texto para clipboard
 * - Reverter para versões anteriores
 * 
 * O conteúdo é armazenado diretamente na tabela Actions, sem uso de TemporaryContent.
 */

// app/(app)/content/result/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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

// Interface para o conteúdo gerado baseada na Action do banco de dados
interface GeneratedContent {
  id: string;           // ID único do conteúdo
  videoUrl?: string;    // URL do vídeo gerado (opcional)
  imageUrl: string;     // URL da imagem gerada
  title: string;        // Título/legenda principal
  body: string;         // Corpo do texto/descrição
  hashtags: string[];   // Lista de hashtags
  revisions: number;    // Contador de revisões feitas
  brand?: string;       // Nome da marca (opcional)
  theme?: string;       // Tema estratégico usado (opcional)
  actionId: string;     // ID da Action no banco (para rastreamento)
}

// Interface para controle de versões do conteúdo
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

  useEffect(() => {
    const loadContent = async () => {
      if (!user?.id || !user?.teamId) {
        setLoading(false);
        return;
      }

      try {
        // Busca a Action mais recente não aprovada do usuário
        const response = await fetch(`/api/actions?userId=${user.id}&teamId=${user.teamId}&status=Em revisão&limit=1`);
        
        if (response.ok) {
          const actions = await response.json();

          // Adicione este log:
          console.log('[ResultPage] Dados retornados da API /api/actions:', actions);

          if (actions && actions.length > 0) {
            const action = actions[0];
            
            // Converte a Action para o formato esperado
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

            // Inicializa as versões com a versão original
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
          const loadTeam = async () => {
            try {
              const teamsRes = await fetch(`/api/teams?userId=${user.id}`);
              if (teamsRes.ok) {
                const teamsData: Team[] = await teamsRes.json();
                const currentTeam = teamsData.find(t => t.id === user.teamId);
                setTeam(currentTeam || null);
              }
            } catch (error) {
              // Error loading team data
            }
          };
          loadTeam();
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
    let isApproving = false; // Flag para evitar marcar como rejeitada durante aprovação
    
    const handleBeforeUnload = async () => {
      if (content && content.actionId && !isApproving) {
        // Marca como rejeitada se sair sem aprovar
        try {
          await fetch('/api/actions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: content.actionId,
              status: 'Rejeitada',
              approved: false,
              requesterUserId: user?.id
            })
          });
        } catch (error) {
          // Error marking action as rejected
        }
      }
    };

    const handleRouteChange = () => {
      if (content && content.actionId && !isApproving) {
        // Marca como rejeitada ao navegar para outra rota (usando fetch com keepalive)
        fetch('/api/actions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: content.actionId,
            status: 'Rejeitada',
            approved: false,
            requesterUserId: user?.id
          }),
          keepalive: true // Garante que a requisição seja enviada mesmo se a página fechar
        }).catch(() => {
          // Error in cleanup request
        });
      }
    };

    // Expõe função para sinalizar que a aprovação está em andamento
    (window as any).__setApprovingFlag = (value: boolean) => {
      isApproving = value;
    };

    // Listener para fechar aba/navegador
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup quando o componente desmontar (navegação)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!isApproving) {
        handleRouteChange(); // Marca como rejeitada ao desmontar apenas se não estiver aprovando
      }
    };
  }, [content, user?.id]);

  /**
   * Atualiza os créditos do time após usar recursos como revisões
   */
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
        const updatedTeam = await updateRes.json();
        setTeam(updatedTeam);
      }
    } catch (e) {
      }
  }, [user?.teamId, team]);

  /**
   * Atualiza o conteúdo atual na Action do banco de dados
   * Usado quando o usuário faz revisões
   */
  const updateCurrentContent = async (newContent: GeneratedContent) => {
    // Mantém o ID original para rastreamento
    const updatedContent = {
      ...newContent,
      actionId: content?.actionId || content?.id || newContent.id
    };

    // Atualiza o estado atual
    setContent(updatedContent);

    try {
      // Atualiza a Action no banco de dados
      if (user?.id && user?.teamId && updatedContent.actionId) {
        const response = await fetch(`/api/actions/${updatedContent.actionId}/review`, {
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
        
        if (response.ok) {
          } else {
          throw new Error('Falha ao atualizar na Action');
        }
      }
    } catch (error) {
      toast.error('Erro ao atualizar conteúdo');
    }

    };

  /**
   * Aprova o conteúdo final e redireciona para o histórico
   * Marca a Action como aprovada no banco de dados
   */
  const handleApprove = async () => {
    if (!content) {
      toast.error('Conteúdo não encontrado');
      return;
    }

    // Sinaliza que está aprovando para evitar marcação como rejeitada
    if ((window as any).__setApprovingFlag) {
      (window as any).__setApprovingFlag(true);
    }

    try {
      const currentVersion = versions[currentVersionIndex];
      const finalContent = currentVersion ? currentVersion.content : content;

      // Atualiza a Action existente para status "Aprovado"
      const actionId = finalContent.actionId;
      
      if (!actionId) {
        throw new Error('ID da ação não encontrado');
      }

      const updateRes = await fetch('/api/actions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: actionId,
          status: 'Aprovado',
          approved: true,
          requesterUserId: user?.id
        })
      });
      
      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        throw new Error(errorData.error || errorData.details || 'Erro ao aprovar ação');
      }
      
      const approvedAction = await updateRes.json();
      toast.success('Conteúdo aprovado e salvo no histórico!');

      // Limpa o conteúdo para evitar que seja marcado como rejeitado
      setContent(null);

      // Aguarda um pouco antes de redirecionar para garantir que a ação foi salva
      setTimeout(() => {
        router.push(`/historico?actionId=${approvedAction.id}`);
      }, 500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao aprovar o conteúdo';
      toast.error(errorMessage, {
        description: "Tente novamente ou entre em contato com o suporte se o problema persistir."
      });
      
      // Remove a flag de aprovação em caso de erro
      if ((window as any).__setApprovingFlag) {
        (window as any).__setApprovingFlag(false);
      }
    }
  };

  /**
   * Inicia o processo de revisão (imagem ou texto)
   * Verifica se o usuário tem créditos suficientes e se não excedeu o limite de revisões
   */
  const handleStartRevision = (type: 'image' | 'text') => {
    if (team && team.credits.contentReviews <= 0) {
      toast.error('Você não tem créditos de revisão suficientes.');
      return;
    }
    if (content && content.revisions >= 2) {
      toast.error('Limite de 2 revisões por conteúdo atingido.');
      return;
    }
    setRevisionType(type);
    setShowRevisionDialog(false);
    setShowRevisionForm(true);
  };

  /**
   * Processa o resultado de uma revisão
   * Cria uma nova versão do conteúdo e atualiza a Action
   */
  const handleRevisionComplete = async (updatedContent: GeneratedContent) => {
    try {
      updateTeamCredits('contentReviews');

      // Incrementa o contador de revisões
      const contentWithRevision = {
        ...updatedContent,
        revisions: (content?.revisions || 0) + 1,
        actionId: content?.actionId || content?.id || updatedContent.id
      };

      // Cria uma nova versão
      const newVersion: ContentVersion = {
        id: `version-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content: contentWithRevision,
        timestamp: new Date().toISOString(),
        type: revisionType === 'image' ? 'image_revision' : 'text_revision'
      };

      // Adiciona a nova versão à lista
      const updatedVersions = [...versions, newVersion];
      setVersions(updatedVersions);
      setCurrentVersionIndex(updatedVersions.length - 1);

      // Atualiza o conteúdo atual
      await updateCurrentContent(contentWithRevision);

      // NÃO salva revisões intermediárias no histórico
      // O histórico será atualizado apenas quando o conteúdo for aprovado
      
      setShowRevisionForm(false);
      setRevisionType(null);

      toast.success(`Revisão ${revisionType === 'image' ? 'da imagem' : 'do texto'} concluída!`);

    } catch (error) {
      toast.error('Erro ao processar a revisão');
    }
  };

  /**
   * Reverte para a versão anterior do conteúdo
   * Permite desfazer revisões feitas
   * IMPORTANTE: Mesmo revertendo, os créditos gastos nas revisões não retornam
   * e o contador de revisões é mantido
   */
  const handleRevert = async () => {
    if (currentVersionIndex <= 0) {
      toast.info("Você já está na versão original.");
      return;
    }

    try {
      const previousIndex = currentVersionIndex - 1;
      const previousVersion = versions[previousIndex];

      if (previousVersion) {
        // Atualiza apenas a visualização atual, mas mantém o contador de revisões
        // Os créditos gastos não retornam conforme solicitado
        setCurrentVersionIndex(previousIndex);
        
        // Atualiza o conteúdo visualmente mas preserva o contador de revisões original
        const revertedContent = {
          ...previousVersion.content,
          revisions: content?.revisions || 0, // Mantém o contador original
          actionId: content?.actionId || content?.id || previousVersion.content.id
        };
        
        // Atualiza a Action no banco com o conteúdo revertido mas mantendo o contador de revisões
        if (user?.id && user?.teamId && revertedContent.actionId) {
          const response = await fetch(`/api/actions/${revertedContent.actionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              result: {
                imageUrl: revertedContent.imageUrl,
                title: revertedContent.title,
                body: revertedContent.body,
                hashtags: revertedContent.hashtags
              },
              // NÃO diminui o contador de revisões - mantém os créditos gastos
              revisions: content?.revisions || 0
            })
          });
          
          if (response.ok) {
            // Conteúdo revertido na Action (créditos mantidos)
          } else {
            throw new Error('Falha ao reverter na Action');
          }
        }

        setContent(revertedContent);
        toast.info("Versão anterior restaurada. Os créditos utilizados foram mantidos.");
      }
    } catch (error) {
      toast.error('Erro ao reverter para versão anterior');
    }
  };

  /**
   * Faz o download da imagem gerada usando o utilitário de download
   */
  const handleDownloadImage = async () => {
    if (!content?.imageUrl) {
      toast.error('URL da imagem não encontrada.');
      return;
    }
    
    setIsDownloading(true);
    toast.info("Iniciando download da imagem...");
    
    try {
      // Determinar o nome do arquivo
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      const filename = `creator-ai-image-${timestamp}`;
      
      // Usar o utilitário de download
      await downloadImage(content.imageUrl, {
        filename,
        useProxy: true,
        timeout: 30000
      });
      
      toast.success('Download concluído com sucesso!');
      } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro desconhecido ao baixar a imagem';
        
      toast.error(`Falha no download: ${errorMessage}`, {
        description: 'Verifique sua conexão e tente novamente.'
      });
      
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Copia o conteúdo completo (título + corpo + hashtags) para o clipboard
   */
  const handleCopyToClipboard = () => {
    if (!content) return;
    const fullText = `${content.title}\n\n${content.body}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Conteúdo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (showRevisionForm && content && revisionType) {
    return (
      <RevisionForm
        content={content}
        revisionType={revisionType}
        onRevisionComplete={handleRevisionComplete}
        onCancel={() => {
          setShowRevisionForm(false);
          setRevisionType(null);
        }}
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
                      versions[currentVersionIndex]?.type === 'original' ? 'Original' :
                        versions[currentVersionIndex]?.type === 'image_revision' ? 'Imagem Revisada' :
                          'Texto Revisado'
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
            title={currentVersionIndex <= 0 ? "Você já está na versão original" : "Reverte para a versão anterior (créditos utilizados são mantidos)"}
          >
            <Undo2 className="mr-2" /> Reverter
          </Button>
          <Button
            onClick={() => setShowRevisionDialog(true)}
            variant="secondary"
            className="rounded-full"
            disabled={content.revisions >= 2 || (team && team.credits.contentReviews <= 0)}
            title={
              content.revisions >= 2 
                ? "Limite de 2 revisões atingido" 
                : team && team.credits.contentReviews <= 0
                  ? "Sem créditos de revisão disponíveis"
                  : "Fazer revisão do conteúdo"
            }
          >
            <Edit className="mr-2" /> Revisar ({2 - content.revisions} rest.)
          </Button>
          <Button
            onClick={handleApprove}
            className="rounded-full bg-green-600 hover:bg-green-700 text-white"
          >
            <ThumbsUp className="mr-2" /> Aprovar e Salvar
          </Button>
        </div>
      </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card
              className={cn(
                'w-full bg-muted/30 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/10 relative',
                content.videoUrl ? 'aspect-[5/3]' : 'aspect-square'
              )}
            >
              {content.videoUrl ? (
                <video
                  key={content.videoUrl}
                  src={content.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  crossOrigin="anonymous" 
                  poster={content.imageUrl}
                  onError={() => {
                    // Log e fallback
                    console.error('Erro ao carregar vídeo:', content.videoUrl);
                    toast.error('Erro ao carregar vídeo. Tente abrir em nova aba.');
                  }}
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
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="absolute bottom-4 right-4 rounded-full"
                  title="Abrir vídeo em nova aba"
                >
                  <a href={content.videoUrl} target="_blank" rel="noopener noreferrer">
                    Abrir vídeo
                  </a>
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

      {/* Dialog para escolher tipo de revisão (imagem ou texto) */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O que você deseja revisar?</DialogTitle>
            <DialogDescription>
              Você pode fazer até {2 - content.revisions} revisões. Cada revisão consome 1 crédito.
              Restam {team?.credits.contentReviews || 0} créditos de revisão.
              <br />
              <strong className="text-amber-600 dark:text-amber-400">
                ⚠️ Importante: Os créditos são consumidos mesmo se você reverter as alterações posteriormente.
              </strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            {!content.videoUrl && (
              <Button onClick={() => handleStartRevision('image')} className="flex-1" variant="secondary">
                Ajustar a Imagem
              </Button>
            )}
            <Button onClick={() => handleStartRevision('text')} className="flex-1" variant="secondary">
              Ajustar a Legenda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
