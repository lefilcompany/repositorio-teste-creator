// components/perfil/additionalInfoCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Shield, Crown, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import LeaveTeamDialog from './leaveTeamDialog';

interface AdditionalInfoCardProps {
  userData: {
    team?: {
      name: string;
    };
    role?: 'ADMIN' | 'MEMBER' | 'WITHOUT_TEAM';
  };
}

export default function AdditionalInfoCard({ userData }: AdditionalInfoCardProps) {
  const { user, team } = useAuth();
  const [totalActions, setTotalActions] = useState(0);
  const [teamData, setTeamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!user?.teamId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch team data with subscription-based credits
        const teamResponse = await fetch(`/api/teams/${user.teamId}?summary=true`);
        if (teamResponse.ok) {
          const data = await teamResponse.json();
          setTeamData(data);
        } else {
          toast.error('Erro ao carregar dados da equipe');
        }

        // Fetch actions count
        const actionsResponse = await fetch(`/api/actions?teamId=${user.teamId}`);
        if (actionsResponse.ok) {
          const actions = await actionsResponse.json();
          setTotalActions(actions.length);
        } else {
          toast.error('Erro ao carregar histórico de ações da equipe');
        }
      } catch (error) {
        toast.error('Erro de conexão ao carregar dados da equipe');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [user?.teamId]);

  // Calcular progresso baseado nos créditos calculados da API
  const creditosDisponiveis = teamData ? {
    total: teamData.plan 
      ? ((teamData.plan.quickContentCreations || 5) + (teamData.plan.customContentSuggestions || 15) + (teamData.plan.contentReviews || 10) + (teamData.plan.contentPlans || 5))
      : 35, // Total do FREE plan
    restantes: (teamData.credits?.quickContentCreations || 0) + (teamData.credits?.contentSuggestions || 0) + (teamData.credits?.contentReviews || 0) + (teamData.credits?.contentPlans || 0)
  } : { total: 35, restantes: 0 };

  const creditosUsados = creditosDisponiveis.total - creditosDisponiveis.restantes;
  const progressoPercentual = creditosDisponiveis.total > 0 ? (creditosUsados / creditosDisponiveis.total) * 100 : 0;
  return (
    <Card className="shadow-md border border-primary/20 bg-gradient-to-br from-background via-background/95 to-muted/10 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-secondary/10 to-accent/10 rounded-t-lg border-b border-secondary/20 p-6">
        <CardTitle className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 bg-secondary/15 rounded-xl shadow-sm">
            <Users className="h-6 w-6 text-secondary" />
          </div>
          Informações da Equipe
        </CardTitle>
        <CardDescription className="text-muted-foreground text-base">
          Dados da sua equipe e função
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {userData?.team && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-accent/15 rounded-lg">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-semibold text-foreground">
                  Equipe
                </h3>
                <p className="text-foreground font-medium text-md">{userData.team.name.charAt(0).toUpperCase() + userData.team.name.slice(1).toLowerCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Button to open leave team confirmation dialog */}
              <LeaveTeamTrigger />
            </div>
          </div>
        )}
        {userData?.role && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="p-1.5 bg-primary/15 rounded-lg">
                {userData.role === 'ADMIN' ? (
                  <Crown className="h-6 w-6 text-primary" />
                ) : (
                  <Shield className="h-6 w-6 text-primary" />
                )}
              </div>
              Função
            </h3>
            <div className="pl-8 space-y-1">
              <p className={`font-semibold text-lg ${
                userData.role === 'ADMIN' ? 'text-yellow-600' : userData.role === 'MEMBER' ? 'text-accent' : 'text-muted-foreground'
              }`}>
                {userData.role === 'ADMIN' ? 'Administrador' : userData.role === 'MEMBER' ? 'Membro' : 'Sem Equipe'}
              </p>
              <p className="text-sm text-muted-foreground">
                {userData.role === 'ADMIN' 
                  ? 'Controle total sobre a equipe' 
                  : userData.role === 'MEMBER'
                  ? 'Acesso aos projetos da equipe'
                  : 'Precisa fazer parte de uma equipe'
                }
              </p>
            </div>
          </div>
        )}

        {teamData && (
          <div className="space-y-3 border-t border-muted/20 pt-6">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="p-1.5 bg-green-500/15 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              Ações Restantes
            </h3>
            <div className="pl-8 space-y-3">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Carregando...</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-foreground">{creditosDisponiveis.restantes}</span>
                    <span className="text-sm text-muted-foreground">de {creditosDisponiveis.total} disponíveis</span>
                  </div>
                  <Progress value={progressoPercentual} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    {creditosUsados} ações utilizadas
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeaveTeamTrigger() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user?.teamId) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-3 py-1.5 rounded-md border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition"
        aria-label="Sair da equipe"
        title="Sair da equipe"
      >
        Sair da equipe
      </button>
      <LeaveTeamDialog isOpen={open} onOpenChange={setOpen} />
    </>
  );
}
