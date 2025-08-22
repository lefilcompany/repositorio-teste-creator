// app/(app)/equipe/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Rocket, Users, ClipboardCopy, Check, X, Crown, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { api } from '@/lib/api';

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
      const [membersData, requestsData] = await Promise.all([
        api.get(`/api/team-members?teamId=${team.id}`),
        api.get(`/api/teams/${team.id}/requests`)
      ]);

      setMembersDetails(membersData as any);
      setPendingRequests(requestsData as any);

    } catch (error) {
      console.error("Falha ao carregar dados da equipe", error);
      toast.error("Não foi possível carregar os dados da equipe.");
      setMembersDetails([]);
      setPendingRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, team, router]);

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

    if (action === 'approve' && typeof team.plan === 'object' && membersDetails.length >= team.plan.limits.members) {
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

      // Find the request user data before removing from pending requests
      const requestUser = pendingRequests.find(req => req.id === requestId)?.user;

      // Update local state immediately for better UX
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));

      if (action === 'approve' && requestUser) {
        // Add to members list if approved with complete user data
        const newMember = {
          id: userId,
          name: userName,
          email: requestUser.email,
          phone: requestUser.phone || '',
          state: requestUser.state || '',
          city: requestUser.city || ''
        };
        setMembersDetails(prev => [...prev, newMember]);
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show success message
      if (action === 'approve') {
        toast.success(`${userName} foi adicionado à equipe!`);
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

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!team) {
      toast.error("Dados da equipe não disponíveis.");
      return;
    }

    // Prevent admin from removing themselves
    if (userId === user?.id) {
      toast.error("Você não pode remover a si mesmo da equipe.");
      return;
    }

    // Show loading state
    const loadingToast = toast.loading(`Removendo ${userName} da equipe...`);

    try {
      const res = await fetch(`/api/teams/${team.id}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao remover o membro.');
      }

      // Update local state immediately for better UX
      setMembersDetails(prev => prev.filter(member => member.id !== userId));

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show success message
      toast.success(`${userName} foi removido da equipe!`);

      // Refresh team data to ensure consistency
      await reloadTeam();

    } catch (error: any) {
      console.error('Erro ao remover membro:', error);

      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Ocorreu um erro ao remover o membro.');

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
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
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

        {/* Main Content - Fluid layout */}
        <main className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column - Team Info and Requests */}
          <div className="space-y-4">
            {/* Team Information Card */}
            <Card className="shadow-lg border-2 border-primary/20 bg-gradient-to-br from-card via-primary/5 to-secondary/10 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg pb-2">
                <CardTitle className="text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {team.name}
              </CardTitle>
              <CardDescription className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent font-medium text-sm">
                Plano {typeof team.plan === 'object' ? team.plan.name : team.plan}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {/* Horizontal Layout for Access Code and Members Count */}
              <div className="flex gap-4 items-start">
                {/* Access Code */}
                <div className="flex-1 space-y-1">
                  <Label className="text-primary font-semibold text-sm">Código de Acesso</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={team.code}
                      readOnly
                      className="bg-gradient-to-r from-muted/50 to-primary/5 cursor-not-allowed border-primary/20 text-sm h-8"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                      className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 h-8 w-8"
                    >
                      <ClipboardCopy className="h-3 w-3 text-primary" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Compartilhe para novos membros solicitarem entrada.</p>
                </div>

                {/* Members Count */}
                <div className="flex-shrink-0 space-y-1 min-w-[140px]">
                  <Label className="text-secondary font-semibold text-sm">Membros Aceitos</Label>
                  <div className="flex items-center gap-2 text-lg font-bold p-2 rounded-lg bg-gradient-to-r from-secondary/10 to-accent/10 border border-secondary/20">
                    <Users className="h-4 w-4 text-secondary" />
                    <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                      {membersDetails.length} / {typeof team.plan === 'object' ? team.plan.limits.members : 5}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests Card - Takes remaining space */}
          <Card className="flex-1 flex flex-col bg-gradient-to-br from-card via-accent/5 to-primary/5 border-accent/20 shadow-lg min-h-0">
            <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-t-lg pb-3 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-accent text-lg">
                <UserPlus className="h-5 w-5" />
                Solicitações para Aprovação
                {pendingRequests.length > 0 && (
                  <span className="bg-gradient-to-r from-accent to-primary text-white text-xs px-2 py-1 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-sm">Aprove ou recuse as solicitações para entrar na sua equipe.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-background/70 to-accent/5 rounded-lg shadow-sm border border-accent/10 hover:border-accent/20 transition-all duration-200">
                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-accent font-bold text-sm">
                            {request.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{request.user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{request.user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm text-xs px-2 py-1 h-8"
                          onClick={() => handleRequest(request.id, request.user.id, request.user.name, 'reject')}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/50 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm text-xs px-2 py-1 h-8"
                          onClick={() => handleRequest(request.id, request.user.id, request.user.name, 'approve')}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Aceitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                    <UserPlus className="h-6 w-6 text-secondary" />
                  </div>
                  <p className="text-muted-foreground text-sm">Nenhuma solicitação pendente</p>
                  <p className="text-muted-foreground text-xs mt-1">As solicitações aparecerão aqui quando enviadas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Team Members (Accepted Only) */}
        <div className="flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-card via-secondary/5 to-accent/5 border-secondary/20 shadow-lg min-h-0">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-accent/10 rounded-t-lg pb-4 flex-shrink-0">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-secondary">
                  <Users className="h-5 w-5" />
                  Membros Aceitos
                </div>
                <span className="bg-gradient-to-r from-secondary to-accent text-white text-sm px-3 py-1.5 rounded-full font-medium shadow-sm">
                  {membersDetails.length}
                </span>
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Usuários que foram aprovados e fazem parte da equipe
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {membersDetails.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 auto-rows-max">
                  {membersDetails.map(member => (
                    <div
                      key={member.email}
                      className="group relative flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-background/90 via-background/70 to-secondary/5 border border-secondary/10 hover:border-secondary/20 hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
                    >
                      <Avatar className="h-12 w-12 ring-2 ring-secondary/15 group-hover:ring-secondary/25 transition-all duration-300 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-secondary/20 to-accent/20 text-secondary font-bold text-base">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors duration-200 truncate pr-2">
                            {member.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs text-green-600 font-medium hidden sm:inline">Ativo</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground truncate mb-3">
                          {member.email}
                        </p>

                        <div className="flex items-center justify-between">
                          {/* Role Badge */}
                          {member.email === team.admin ? (
                            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-gradient-to-r from-amber-100 to-amber-50 px-2.5 py-1 rounded-full border border-amber-200 shadow-sm">
                              <Crown className="h-3 w-3" />
                              <span className="font-semibold">Administrador</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-gradient-to-r from-blue-100 to-blue-50 px-2.5 py-1 rounded-full border border-blue-200 shadow-sm">
                              <Users className="h-3 w-3" />
                              <span className="font-semibold">Membro</span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            <div className="flex items-center gap-1.5 text-xs text-green-700 bg-gradient-to-r from-green-100 to-green-50 px-2.5 py-1 rounded-full border border-green-200 shadow-sm">
                              <Check className="h-3 w-3" />
                              <span className="font-semibold">Aprovado</span>
                            </div>

                            {member.email !== team.admin && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-200 h-7 w-7 p-0"
                                onClick={() => handleRemoveMember(member.id, member.name)}
                                title={`Remover ${member.name} da equipe`}
                              >
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <p className="text-muted-foreground text-sm">Nenhum membro aprovado ainda</p>
                  <p className="text-muted-foreground text-xs mt-1">Aprove as solicitações para adicionar membros</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      </div>
    </div>
  );
}