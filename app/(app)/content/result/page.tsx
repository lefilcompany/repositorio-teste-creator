// app/(app)/content/result/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader, Download, ArrowLeft, Copy, Check, ThumbsUp, Edit, ShieldAlert } from 'lucide-react';
import RevisionForm from '@/components/content/revisionForm';
import type { Team } from '@/types/team';
import { useAuth } from '@/hooks/useAuth';

interface GeneratedContent {
  imageUrl: string;
  title: string;
  body: string;
  hashtags: string[];
  revisions: number;
  originalActionId?: string;
  brand?: string;
  theme?: string;
}

export default function ResultPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionType, setRevisionType] = useState<'image' | 'text' | null>(null);
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  useEffect(() => {
    try {
      const storedContent = localStorage.getItem('generatedContent');
      if (storedContent) {
        const parsedContent = JSON.parse(storedContent);
        setContent(parsedContent);
      } else {
        throw new Error("Nenhum conteúdo gerado encontrado.");
      }

      if (user?.teamId) {
        const teams: Team[] = JSON.parse(localStorage.getItem('creator-teams') || '[]');
        const currentTeam = teams.find(t => t.id === user.teamId);
        setTeam(currentTeam || null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateTeamCredits = useCallback((creditType: 'contentReviews' | 'contentSuggestions', amount = 1) => {
    if (!user?.teamId) return;
    try {
      const teams: Team[] = JSON.parse(localStorage.getItem('creator-teams') || '[]');
      const teamIndex = teams.findIndex(t => t.id === user.teamId);
      if (teamIndex > -1) {
        // Correctly access the property on the specific credit type
        if (creditType in teams[teamIndex].credits) {
          (teams[teamIndex].credits as any)[creditType] -= amount;
        }
        localStorage.setItem('creator-teams', JSON.stringify(teams));
        setTeam(teams[teamIndex]);
      }
    } catch (e) {
      console.error("Erro ao atualizar créditos da equipe:", e);
    }
  }, [user?.teamId]);


  const saveToHistory = (finalContent: GeneratedContent, approved = false) => {
    try {
      const history = JSON.parse(localStorage.getItem('creator-action-history') || '[]');
      const actionId = finalContent.originalActionId || `gen-${new Date().toISOString()}`;

      if (approved) {
        const existingIndex = history.findIndex((a: any) => a.id === actionId);
        if (existingIndex > -1) {
          history[existingIndex].result = { ...finalContent, approved: true };
          history[existingIndex].status = 'Aprovado';
        } else {
          history.unshift({
            id: actionId,
            type: 'Criar conteúdo',
            brand: finalContent.brand,
            createdAt: new Date().toISOString(),
            details: { theme: finalContent.theme },
            result: { ...finalContent, approved: true },
            status: 'Aprovado',
          });
        }
      }
      localStorage.setItem('creator-action-history', JSON.stringify(history));
    } catch (e) {
      console.error("Erro ao salvar no histórico:", e);
    }
  };

  const handleApprove = () => {
    if (!content) return;
    saveToHistory(content, true);
    alert('Conteúdo aprovado e salvo no histórico!');
    localStorage.removeItem('generatedContent');
    router.push('/historico');
  };

  const handleStartRevision = (type: 'image' | 'text') => {
    if (team && team.credits.contentReviews <= 0) {
      setError("Você não tem créditos de revisão suficientes.");
      return;
    }
    if (content && content.revisions >= 2) {
      setError("Limite de 2 revisões por conteúdo atingido.");
      return;
    }
    setRevisionType(type);
    setShowRevisionDialog(false);
    setShowRevisionForm(true);
  };

  const handleDownloadImage = async () => {
    if (!content?.imageUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/download-image?url=${encodeURIComponent(content.imageUrl)}`);
      if (!response.ok) throw new Error("Falha ao buscar a imagem.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'creator-ai-image.png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar a imagem:", err);
      setError("Não foi possível baixar a imagem.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!content) return;
    const fullText = `${content.title}\n\n${content.body}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showRevisionForm && content && revisionType) {
    return (
      <RevisionForm
        content={content}
        revisionType={revisionType}
        onRevisionComplete={(updatedContent) => {
          updateTeamCredits('contentReviews');
          setContent(updatedContent);
          setShowRevisionForm(false);
          setRevisionType(null);
          localStorage.setItem('generatedContent', JSON.stringify(updatedContent));
        }}
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

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-4">Ocorreu um Erro</h2>
        <p className="text-muted-foreground mb-6">{error || "Não foi possível carregar o conteúdo."}</p>
        <Button onClick={() => router.push('/content')}>
          <ArrowLeft className="mr-2" /> Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl mx-auto h-full">
        <div className="flex flex-col gap-4 h-full">
          <Card className="flex-grow w-full aspect-square bg-muted/30 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/10">
            <img src={content.imageUrl} alt="Imagem Gerada" className="object-cover w-full h-full" />
          </Card>
          <div className="flex gap-4">
            <Button onClick={handleDownloadImage} disabled={isDownloading} variant="outline" className="w-full rounded-full text-base py-6">
              {isDownloading ? <Loader className="animate-spin" /> : <Download />}
              {isDownloading ? 'Baixando...' : 'Baixar Imagem'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col h-full gap-4">
          <Card className="w-full flex-grow bg-card rounded-2xl p-6 shadow-lg border-2 border-primary/10 flex flex-col">
            <CardHeader className="p-0 pb-4 flex-row justify-between items-center">
              <CardTitle className="text-2xl font-bold text-foreground">{content.title}</CardTitle>
              <Button onClick={handleCopyToClipboard} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                {copied ? <Check className="text-green-500" /> : <Copy />}
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-grow overflow-y-auto">
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

          <div className="flex gap-4">
            <Button onClick={() => setShowRevisionDialog(true)} variant="outline" className="w-full rounded-full text-base py-6 border-2" disabled={content.revisions >= 2 || (team && team.credits.contentReviews <= 0)}>
              <Edit /> Revisar ({2 - content.revisions} rest.)
            </Button>
            <Button onClick={handleApprove} className="w-full rounded-full text-base py-6 bg-green-600 hover:bg-green-700 text-white">
              <ThumbsUp /> Aprovar Versão Final
            </Button>
          </div>
          {content.revisions >= 2 && <p className="text-center text-sm text-destructive">Limite de revisões atingido.</p>}
          {team && team.credits.contentReviews <= 0 && <p className="text-center text-sm text-destructive">Créditos de revisão esgotados.</p>}
        </div>
      </div>

      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O que você deseja revisar?</DialogTitle>
            <DialogDescription>
              Você pode fazer até 2 revisões por conteúdo. Cada revisão consome 1 crédito.
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