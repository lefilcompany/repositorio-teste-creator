// app/(app)/equipe/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Team } from '@/types/team';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Rocket, Users, ClipboardCopy, Check, X, Crown, Loader2, UserPlus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";

// Assuming a join request type might look like this
interface JoinRequest {
  id: string;
  user: User;
}

export default function EquipePage() {
  const { user, team, reloadTeam, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [membersDetails, setMembersDetails] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeamData = useCallback(async () => {
    if (!user || !team) {
      if (!isAuthLoading) {
        toast.error("Você precisa estar em uma equipe para ver esta página.");
        router.replace('/home');
      }
      return;
    }

    if (user.email !== team.admin) {
      toast.error("Você não tem permissão para acessar esta página.");
      router.replace('/home');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch full member details and pending requests
      const [membersRes, requestsRes] = await Promise.all([
        fetch(`/api/team-members?teamId=${team.id}`),
        fetch(`/api/teams/${team.id}/requests`)
      ]);

      let membersFetchSuccess = false;
      let requestsFetchSuccess = false;

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembersDetails(data);
        membersFetchSuccess = true;
      } else {
        console.error('Failed to fetch members:', await membersRes.text());
        setMembersDetails([]);
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setPendingRequests(data);
        requestsFetchSuccess = true;
      } else {
        console.error('Failed to fetch requests:', await requestsRes.text());
        setPendingRequests([]);
      }

      // Only show error toasts if both requests failed
      if (!membersFetchSuccess && !requestsFetchSuccess) {
        toast.error("Não foi possível carregar os dados da equipe.");
      } else if (!membersFetchSuccess) {
        toast.warning("Não foi possível carregar os membros da equipe.");
      } else if (!requestsFetchSuccess) {
        toast.warning("Não foi possível carregar as solicitações pendentes.");
      }

    } catch (error) {
      console.error("Falha ao carregar dados da equipe", error);
      toast.error("Erro de conexão ao carregar os dados da equipe.");
      setMembersDetails([]);
      setPendingRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, team, router, isAuthLoading]);

  useEffect(() => {
    // Only fetch data when auth is not loading and we have the necessary data
    if (!isAuthLoading && user && team) {
      fetchTeamData();
    }
  }, [isAuthLoading, user, team, fetchTeamData]);


  const copyToClipboard = () => {
    if (team?.code) {
      navigator.clipboard.writeText(team.code);
      toast.success('Código copiado para a área de transferência!');
    }
  };

  const handleRequest = async (requestId: string, userId: string, userName: string, action: 'approve' | 'reject') => {
    if (!team) {
      toast.error("Dados da equipe não disponíveis.");
      return;
    }

    if (action === 'approve' && membersDetails.length >= team.plan.limits.members) {
      toast.error('Limite de membros do plano atingido.');
      return;
    }

    // Show loading state
    const loadingToast = toast.loading(`${action === 'approve' ? 'Aprovando' : 'Recusando'} solicitação de ${userName}...`);

    try {
      const res = await fetch(`/api/teams/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, teamId: team.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao processar a solicitação.');
      }

      const result = await res.json();

      // Update local state immediately for better UX
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));

      if (action === 'approve') {
        // Add to members list if approved
        const requestUser = pendingRequests.find(req => req.id === requestId)?.user;
        if (requestUser) {
          const newMember = {
            id: userId,
            name: userName,
            email: requestUser.email
          };
          setMembersDetails(prev => [...prev, newMember]);
        }
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show success message
      if (action === 'approve') {
        toast.success(`${userName} foi adicionado à equipe.`);
      } else {
        toast.info(`Solicitação de ${userName} foi recusada.`);
      }

      // Refresh team data to ensure consistency
      await reloadTeam();

    } catch (error: any) {
      console.error('Erro ao processar solicitação:', error);

      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Ocorreu um erro ao processar a solicitação.');

      // Refresh data on error to ensure consistency
      await fetchTeamData();
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando equipe...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    // This case is mostly handled by the fetchTeamData logic, but as a fallback:
    return (
      <div className="p-8 text-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 h-full flex items-center justify-center">
        <p className="text-muted-foreground">Não foi possível carregar as informações da equipe.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <Rocket className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">
                Gerenciar Equipe
              </CardTitle>
              <p className="text-muted-foreground">Veja os detalhes do seu plano, membros e solicitações.</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg border-2 border-primary/20 bg-gradient-to-br from-card via-primary/5 to-secondary/10 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {team.name}
              </CardTitle>
              <CardDescription className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent font-medium">
                Plano {team.plan.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Código de Acesso</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={team.code}
                    readOnly
                    className="bg-gradient-to-r from-muted/50 to-primary/5 cursor-not-allowed border-primary/20"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
                  >
                    <ClipboardCopy className="h-4 w-4 text-primary" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Compartilhe para novos membros solicitarem entrada.</p>
              </div>
              <div className="space-y-2 pt-4">
                <Label className="text-secondary font-semibold">Membros</Label>
                <div className="flex items-center gap-2 text-2xl font-bold p-3 rounded-lg bg-gradient-to-r from-secondary/10 to-accent/10 border border-secondary/20">
                  <Users className="h-6 w-6 text-secondary" />
                  <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                    {membersDetails.length} / {team.plan.limits.members}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden min-h-0">
          <Card className="flex-shrink-0 bg-gradient-to-br from-card via-accent/5 to-primary/5 border-accent/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-t-lg pb-3">
              <CardTitle className="flex items-center gap-2 text-accent text-lg">
                <UserPlus className="h-5 w-5" />
                Solicitações Pendentes
                <span className="bg-gradient-to-r from-accent to-primary text-white text-sm px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              </CardTitle>
              <CardDescription className="text-sm">Aprove ou recuse as solicitações para entrar na sua equipe.</CardDescription>
            </CardHeader>
            <CardContent className="py-3">
              <div className="max-h-40 overflow-y-auto pr-2">
                {pendingRequests.length > 0 ? (
                  <ul className="space-y-2">
                    {pendingRequests.map(request => (
                      <li key={request.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-background/70 to-accent/5 rounded-lg shadow-sm border border-accent/10 hover:border-accent/20 transition-all duration-200">
                        <div className='flex items-center gap-3'>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-accent font-bold text-sm">
                              {request.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{request.user.name}</p>
                            <p className="text-xs text-muted-foreground">{request.user.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive transition-all duration-200 h-8 w-8 p-0"
                            onClick={() => handleRequest(request.id, request.user.id, request.user.name, 'reject')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-success/50 text-success hover:bg-success/10 hover:border-success transition-all duration-200 h-8 w-8 p-0"
                            onClick={() => handleRequest(request.id, request.user.id, request.user.name, 'approve')}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4">
                    <div className="bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <UserPlus className="h-6 w-6 text-secondary" />
                    </div>
                    <p className="text-muted-foreground text-sm">Nenhuma solicitação pendente.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-card via-secondary/5 to-accent/5 border-secondary/20 shadow-lg min-h-0">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-accent/10 rounded-t-lg pb-4 flex-shrink-0">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-secondary">
                  <Users className="h-5 w-5" />
                  Membros da Equipe
                </div>
                <span className="bg-gradient-to-r from-secondary to-accent text-white text-sm px-3 py-1.5 rounded-full font-medium shadow-sm">
                  {membersDetails.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
                {membersDetails.map(member => (
                  <div
                    key={member.email}
                    className="group relative flex flex-col p-4 rounded-xl bg-gradient-to-br from-background/90 to-secondary/8 border border-secondary/15 hover:border-secondary/25 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 h-fit"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 ring-2 ring-secondary/20 group-hover:ring-secondary/35 transition-all duration-300">
                          <AvatarFallback className="bg-gradient-to-br from-secondary/25 to-accent/25 text-secondary font-bold text-base">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-secondary transition-colors duration-200 text-sm">
                            {member.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-success/70 to-success animate-pulse"></div>
                        <span className="text-xs text-success font-medium hidden sm:inline">Ativo</span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      <p className="text-xs text-muted-foreground truncate bg-muted/30 px-2 py-1 rounded-md">
                        {member.email}
                      </p>

                      {member.email === team.admin && (
                        <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 bg-gradient-to-r from-amber-400/15 to-amber-500/15 px-3 py-1.5 rounded-lg border border-amber-400/25 shadow-sm">
                          <Crown className="h-3.5 w-3.5" />
                          <span className="font-semibold">Administrador</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-secondary/10 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Membro ativo</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary/40"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary/60"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary/80"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}