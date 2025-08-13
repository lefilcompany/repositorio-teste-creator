// app/(app)/content/result/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader, Download, ArrowLeft, Copy, Check, ThumbsUp, Edit, ShieldAlert, Undo2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import RevisionForm from '@/components/content/revisionForm';
import type { Team } from '@/types/team';
import { useAuth } from '@/hooks/useAuth';

interface GeneratedContent {
  id: string;
  imageUrl: string;
  title: string;
  body: string;
  hashtags: string[];
  revisions: number;
  brand?: string;
  theme?: string;
  originalId?: string; // ID da ação original para rastreamento
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

  useEffect(() => {
    const loadContent = async () => {
      if (!user?.id || !user?.teamId) {
        setLoading(false);
        return;
      }

      try {
        // Primeiro tenta buscar do banco de dados
        const response = await fetch(`/api/temporary-content?userId=${user.id}&teamId=${user.teamId}`);
        
        if (response.ok) {
          const tempContent = await response.json();
          
          if (tempContent) {
            // Converte o conteúdo temporário para o formato esperado
            const parsedContent: GeneratedContent = {
              id: tempContent.id,
              imageUrl: tempContent.imageUrl,
              title: tempContent.title,
              body: tempContent.body,
              hashtags: Array.isArray(tempContent.hashtags) ? tempContent.hashtags : [],
              revisions: tempContent.revisions,
              brand: tempContent.brand,
              theme: tempContent.theme,
              originalId: tempContent.originalId || tempContent.actionId
            };

            setContent(parsedContent);

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
            // Fallback para localStorage se não encontrar no banco
            const storedContent = localStorage.getItem('generatedContent');
            if (storedContent) {
              const parsedContent = JSON.parse(storedContent);

              // Garante que temos um ID único se não existir
              if (!parsedContent.id) {
                parsedContent.id = `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;
              }

              setContent(parsedContent);

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
          }
        } else {
          // Fallback para localStorage se a API falhar
          const storedContent = localStorage.getItem('generatedContent');
          if (storedContent) {
            const parsedContent = JSON.parse(storedContent);

            if (!parsedContent.id) {
              parsedContent.id = `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            }

            setContent(parsedContent);

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
              console.error('Erro ao carregar team:', error);
            }
          };
          loadTeam();
        }
      } catch (e: any) {
        toast.error(e.message, { description: "Você será redirecionado." });
        router.push('/content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [user, router]);

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
      console.error('Erro ao atualizar créditos:', e);
    }
  }, [user?.teamId, team]);

  const saveToHistory = async (finalContent: GeneratedContent, approved = false) => {
    if (!user?.teamId || !user?.email || !finalContent) return;

    try {
      // Busca a marca pelo nome para obter o ID
      const brandsRes = await fetch(`/api/brands?teamId=${user.teamId}`);
      if (!brandsRes.ok) {
        throw new Error('Erro ao buscar marcas');
      }
      
      const brands = await brandsRes.json();
      const brand = brands.find((b: any) => b.name === finalContent.brand);
      
      if (!brand) {
        throw new Error('Marca não encontrada');
      }

      // Usa o ID original se existir, senão cria um novo
      const actionId = finalContent.originalId || finalContent.id || `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Procura por uma ação existente com o mesmo ID
      const existingActionsRes = await fetch(`/api/actions?teamId=${user.teamId}`);
      let existingAction = null;
      
      if (existingActionsRes.ok) {
        const actions = await existingActionsRes.json();
        existingAction = actions.find((action: any) => 
          action.id === actionId || 
          (action.result && action.result.originalId === actionId)
        );
      }

      const actionData = {
        type: 'CRIAR_CONTEUDO',
        teamId: user.teamId,
        userId: user.id,
        brandId: brand.id,
        details: {
          brand: finalContent.brand,
          theme: finalContent.theme
        },
        result: {
          ...finalContent,
          approved,
          originalId: actionId
        },
        status: approved ? 'Aprovado' : 'Em revisão',
        approved,
        revisions: finalContent.revisions || 0
      };

      if (existingAction) {
        // Atualiza a ação existente
        const updateRes = await fetch(`/api/actions/${existingAction.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            result: actionData.result,
            status: actionData.status,
            approved: actionData.approved,
            revisions: actionData.revisions
          })
        });
        
        if (!updateRes.ok) {
          throw new Error('Erro ao atualizar ação no histórico');
        }
        
        console.log('Ação atualizada no histórico:', actionId);
      } else {
        // Cria uma nova ação
        const createRes = await fetch('/api/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(actionData)
        });
        
        if (!createRes.ok) {
          throw new Error('Erro ao criar ação no histórico');
        }
        
        console.log('Nova ação criada no histórico:', actionId);
      }

      console.log('Histórico salvo com sucesso');

    } catch (e) {
      console.error("Erro ao salvar no histórico:", e);
      toast.error("Erro ao salvar no histórico");
      
      // Fallback para localStorage
      try {
        const history = JSON.parse(localStorage.getItem('creator-action-history') || '[]');
        const actionId = finalContent.originalId || finalContent.id || `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        
        const existingIndex = history.findIndex((action: any) =>
          action.id === actionId || (action.result && action.result.originalId === actionId)
        );

        const updatedResult = {
          ...finalContent,
          approved,
          originalId: actionId
        };

        if (existingIndex > -1) {
          history[existingIndex].result = updatedResult;
          history[existingIndex].status = approved ? 'Aprovado' : 'Em revisão';
          history[existingIndex].updatedAt = new Date().toISOString();
        } else {
          const newHistoryEntry = {
            id: actionId,
            createdAt: new Date().toISOString(),
            teamId: user.teamId,
            userId: user.id,
            type: 'Criar conteúdo',
            brand: finalContent.brand || '',
            theme: finalContent.theme || '',
            details: {},
            result: updatedResult,
            status: approved ? 'Aprovado' : 'Em revisão'
          };

          history.unshift(newHistoryEntry);
        }

        localStorage.setItem('creator-action-history', JSON.stringify(history));
        console.log('Fallback: Histórico salvo no localStorage');
      } catch (fallbackError) {
        console.error('Erro no fallback do localStorage:', fallbackError);
      }
    }
  };

  const updateCurrentContent = async (newContent: GeneratedContent) => {
    // Mantém o ID original para rastreamento
    const updatedContent = {
      ...newContent,
      originalId: content?.originalId || content?.id || newContent.id
    };

    // Atualiza o estado atual
    setContent(updatedContent);

    try {
      // Tenta atualizar no banco de dados primeiro
      if (user?.id && user?.teamId && updatedContent.id) {
        const response = await fetch('/api/temporary-content', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: updatedContent.id,
            userId: user.id,
            teamId: user.teamId,
            imageUrl: updatedContent.imageUrl,
            title: updatedContent.title,
            body: updatedContent.body,
            hashtags: updatedContent.hashtags,
            revisions: updatedContent.revisions
          })
        });
        
        if (response.ok) {
          console.log('Conteúdo atual atualizado no banco de dados:', updatedContent);
        } else {
          throw new Error('Falha ao atualizar no banco de dados');
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar no banco de dados, usando localStorage como fallback:', error);
      // Fallback para localStorage se a API falhar
      localStorage.setItem('generatedContent', JSON.stringify(updatedContent));
    }

    console.log('Conteúdo atual atualizado:', updatedContent);
  };

  const handleApprove = async () => {
    if (!content) return;

    try {
      const currentVersion = versions[currentVersionIndex];
      const finalContent = currentVersion ? currentVersion.content : content;

      await saveToHistory(finalContent, true);
      toast.success('Conteúdo aprovado e salvo no histórico!');

      // Remove o conteúdo temporário do banco de dados
      if (user?.id && user?.teamId && finalContent.id) {
        try {
          const response = await fetch(`/api/temporary-content?id=${finalContent.id}&userId=${user.id}&teamId=${user.teamId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            console.log('Conteúdo temporário removido do banco de dados');
          }
        } catch (error) {
          console.error('Erro ao remover conteúdo temporário do banco:', error);
        }
      }

      // Limpa o localStorage como fallback
      localStorage.removeItem('generatedContent');

      router.push('/historico');
    } catch (error) {
      console.error('Erro ao aprovar conteúdo:', error);
      toast.error('Erro ao aprovar o conteúdo');
    }
  };

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

  const handleRevisionComplete = async (updatedContent: GeneratedContent) => {
    try {
      updateTeamCredits('contentReviews');

      // Incrementa o contador de revisões
      const contentWithRevision = {
        ...updatedContent,
        revisions: (content?.revisions || 0) + 1,
        originalId: content?.originalId || content?.id || updatedContent.id
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

      // Salva temporariamente no histórico como "Em revisão"
      await saveToHistory(contentWithRevision, false);

      setShowRevisionForm(false);
      setRevisionType(null);

      toast.success(`Revisão ${revisionType === 'image' ? 'da imagem' : 'do texto'} concluída!`);

    } catch (error) {
      console.error('Erro ao completar revisão:', error);
      toast.error('Erro ao processar a revisão');
    }
  };

  const handleRevert = () => {
    if (currentVersionIndex <= 0) {
      toast.info("Você já está na versão original.");
      return;
    }

    try {
      const previousIndex = currentVersionIndex - 1;
      const previousVersion = versions[previousIndex];

      if (previousVersion) {
        setCurrentVersionIndex(previousIndex);
        updateCurrentContent(previousVersion.content);
        toast.info("Versão anterior restaurada.");
      }
    } catch (error) {
      console.error('Erro ao reverter versão:', error);
      toast.error('Erro ao reverter para versão anterior');
    }
  };

  const handleDownloadImage = async () => {
    if (!content?.imageUrl) return;
    setIsDownloading(true);
    toast.info("O download da imagem foi iniciado.");
    try {
      const response = await fetch(`/api/download-image?url=${encodeURIComponent(content.imageUrl)}`);
      if (!response.ok) throw new Error('Falha ao buscar a imagem.');

      const blob = await response.blob();
      const contentType = response.headers.get('Content-Type') || 'image/png';
      const extension = contentType.includes('jpeg') ? 'jpeg' : 'png';
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `creator-ai-image.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar a imagem:', err);
      toast.error('Não foi possível baixar a imagem.');
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
    <div className="p-4 md:p-8 h-full flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center flex-shrink-0">
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
          >
            <Undo2 className="mr-2" /> Reverter
          </Button>
          <Button
            onClick={() => setShowRevisionDialog(true)}
            variant="secondary"
            className="rounded-full"
            disabled={content.revisions >= 2 || (team && team.credits.contentReviews <= 0)}
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

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow overflow-hidden">
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          <Card className="flex-grow w-full aspect-square bg-muted/30 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/10 relative">
            <img src={content.imageUrl} alt="Imagem Gerada" className="object-cover w-full h-full" />
            <Button onClick={handleDownloadImage} disabled={isDownloading} size="icon" className="absolute top-4 right-4 rounded-full w-12 h-12 shadow-lg">
              {isDownloading ? <Loader className="animate-spin" /> : <Download />}
            </Button>
          </Card>
        </div>

        <div className="flex flex-col h-full overflow-hidden">
          <Card className="w-full h-full bg-card rounded-2xl p-1 shadow-lg border-2 border-primary/10 flex flex-col">
            <CardHeader className="p-4 flex-row justify-between items-center border-b border-border/10">
              <CardTitle className="text-xl font-bold text-foreground">{content.title}</CardTitle>
              <Button onClick={handleCopyToClipboard} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                {copied ? <Check className="text-green-500" /> : <Copy />}
              </Button>
            </CardHeader>
            <CardContent className="p-4 flex-grow overflow-y-auto">
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
              Você pode fazer até {2 - content.revisions} revisões. Cada revisão consome 1 crédito.
              Restam {team?.credits.contentReviews || 0} créditos de revisão.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button onClick={() => handleStartRevision('image')} className="flex-1" variant="secondary">Ajustar a Imagem</Button>
            <Button onClick={() => handleStartRevision('text')} className="flex-1" variant="secondary">Ajustar a Legenda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}