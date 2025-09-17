'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadButton } from '@/components/ui/download-button';
import { ArrowLeft, Copy } from 'lucide-react';
import type { Action } from '@/types/action';
import { ACTION_TYPE_DISPLAY, ACTION_STYLE_MAP } from '@/types/action';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ActionViewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const actionId = params.id as string;
  
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAction = async () => {
      if (!user?.teamId || !actionId) return;
      
      try {
        const response = await fetch(`/api/actions/${actionId}?teamId=${user.teamId}`);
        
        if (response.ok) {
          const actionData: Action = await response.json();
          
          // Verifica se a ação está aprovada
          if (actionData.approved && actionData.status === 'Aprovado') {
            setAction(actionData);
          } else {
            toast.error('Esta ação não está aprovada ou não pode ser visualizada');
            router.push('/historico');
            return;
          }
        } else {
          toast.error('Erro ao carregar a ação');
          router.push('/historico');
        }
      } catch (error) {
        toast.error('Erro de conexão ao carregar a ação');
        router.push('/historico');
      } finally {
        setLoading(false);
      }
    };

    loadAction();
  }, [user, actionId, router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência`);
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando ação...</p>
        </div>
      </div>
    );
  }

  const displayType = ACTION_TYPE_DISPLAY[action.type];
  const style = ACTION_STYLE_MAP[displayType];
  const Icon = style.icon;

  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("flex-shrink-0 rounded-xl w-16 h-16 flex items-center justify-center", style.background)}>
                <Icon className={cn("h-8 w-8", style.color)} />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  {displayType}
                </CardTitle>
                <p className="text-muted-foreground">
                  {action.brand?.name} • {formatDate(action.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content based on action type */}
      {action.type === 'CRIAR_CONTEUDO' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image */}
          {action.result?.imageUrl && (
            <Card className="shadow-sm border-2 border-secondary/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Imagem Gerada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full aspect-square bg-muted/50 rounded-lg overflow-hidden relative">
                  <Image 
                    src={action.result.imageUrl} 
                    alt="Imagem Gerada" 
                    fill
                    className="object-cover"
                  />
                </div>
                <DownloadButton
                  imageUrl={action.result.imageUrl}
                  filename={`conteudo-${action.brand?.name}-${Date.now()}`}
                  className="w-full"
                  variant="outline"
                >
                  Baixar Imagem
                </DownloadButton>
              </CardContent>
            </Card>
          )}

          {/* Content Details */}
          <Card className="shadow-sm border-2 border-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Detalhes do Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {action.result?.title && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-muted-foreground">Título</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(action.result!.title!, 'Título')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-semibold text-foreground p-3 bg-muted/50 rounded-lg">
                    {action.result.title}
                  </p>
                </div>
              )}

              {action.result?.body && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-muted-foreground">Legenda</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(action.result!.body!, 'Legenda')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-semibold text-foreground whitespace-pre-line p-3 bg-muted/50 rounded-lg">
                    {action.result.body}
                  </p>
                </div>
              )}

              {action.result?.hashtags && action.result.hashtags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-muted-foreground">Hashtags</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(action.result!.hashtags!.join(' '), 'Hashtags')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                    {action.result.hashtags.map((hashtag, index) => (
                      <span key={index} className="text-primary font-medium">
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {action.details?.platform && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Plataforma</h4>
                  <p className="font-semibold text-foreground p-3 bg-muted/50 rounded-lg">
                    {action.details.platform}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {action.type === 'REVISAR_CONTEUDO' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Image */}
          {action.result?.originalImage && (
            <Card className="shadow-sm border-2 border-secondary/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Imagem Revisada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full aspect-square bg-muted/50 rounded-lg overflow-hidden relative">
                  <Image 
                    src={action.result.originalImage} 
                    alt="Imagem Revisada" 
                    fill
                    className="object-cover"
                  />
                </div>
                <DownloadButton
                  imageUrl={action.result.originalImage}
                  filename={`revisao-${action.brand?.name}-${Date.now()}`}
                  className="w-full"
                  variant="outline"
                >
                  Baixar Imagem
                </DownloadButton>
              </CardContent>
            </Card>
          )}

          {/* Feedback Details */}
          <Card className="shadow-sm border-2 border-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Feedback da Revisão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {action.result?.feedback && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-muted-foreground">Feedback Gerado</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(action.result!.feedback!, 'Feedback')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-semibold text-foreground whitespace-pre-line p-3 bg-muted/50 rounded-lg">
                    {action.result.feedback}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {action.type === 'PLANEJAR_CONTEUDO' && (
        <Card className="shadow-sm border-2 border-secondary/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Planejamento de Conteúdo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {action.details?.platform && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Plataforma</h4>
                <p className="font-semibold text-foreground p-3 bg-muted/50 rounded-lg">
                  {action.details.platform}
                </p>
              </div>
            )}

            {action.details?.quantity && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Quantidade</h4>
                <p className="font-semibold text-foreground p-3 bg-muted/50 rounded-lg">
                  {action.details.quantity}
                </p>
              </div>
            )}

            {action.result?.plan && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-muted-foreground">Planejamento Gerado</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(action.result!.plan!, 'Planejamento')}
                    className="h-6 w-6 p-0 hover:text-primary hover:border-1 hover:border transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-left overflow-y-auto bg-card rounded-xl border border-border/20 p-4"
                  style={{ minHeight: 200 }}
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      // Agrupa todos os <p class="list-item"> consecutivos em uma única <ul>
                      let html = action.result.plan || '';
                      // Encontra blocos de <p class="list-item">...</p> consecutivos
                      html = html.replace(/(<p class=\"list-item\">[\s\S]*?<\/p>)+/g, (match) => {
                        // Transforma cada <p class="list-item">...</p> em <li>...</li>
                        const items = match.match(/<p class=\"list-item\">([\s\S]*?)<\/p>/g) || [];
                        const lis = items.map(p => p.replace(/<p class=\"list-item\">([\s\S]*?)<\/p>/, '<li style="margin:8px 0 8px 24px;list-style:disc inside;">$1</li>')).join('');
                        return `<ul>${lis}</ul>`;
                      });
                      return html;
                    })()
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
