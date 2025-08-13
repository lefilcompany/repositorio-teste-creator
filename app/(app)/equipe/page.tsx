'use client';

import { useEffect, useState } from 'react';
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

export default function EquipePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    try {
      const storedUsers = localStorage.getItem('creator-users');
      if (storedUsers) {
        setAllUsers(JSON.parse(storedUsers));
      }

      if (user.teamId) {
        const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
        const userTeam = teams.find((t) => t.id === user.teamId);

        if (userTeam) {
          if (user.email !== userTeam.admin) {
            toast.error("Você não tem permissão para acessar esta página.");
            router.replace('/home');
            return; 
          }
          setTeam(userTeam);
        } else {
          toast.warning("Não foi possível encontrar sua equipe.");
          router.replace('/home');
        }
      } else {
        toast.info("Você precisa fazer parte de uma equipe para acessar esta página.");
        router.replace('/home');
      }
    } catch (error) {
      console.error("Falha ao carregar dados do localStorage", error);
      toast.error("Não foi possível carregar os dados da equipe.");
    } finally {
      setIsLoading(false);
    }
  }, [user, router]);

  const copyToClipboard = () => {
    if (team?.code) {
      navigator.clipboard.writeText(team.code);
      toast.success('Código copiado para a área de transferência!');
    }
  };

  const handleRequest = (email: string, action: 'approve' | 'reject') => {
    if (!team) return;

    const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
    const teamIndex = teams.findIndex(t => t.id === team.id);
    if (teamIndex === -1) return;

    const currentTeam = { ...teams[teamIndex] };

    if (action === 'approve' && currentTeam.members.length >= currentTeam.plan.limits.members) {
      toast.error('Limite de membros do plano atingido.');
      return;
    }

    currentTeam.pending = currentTeam.pending.filter(e => e !== email);
    if (action === 'approve') {
      currentTeam.members.push(email);
    }

    teams[teamIndex] = currentTeam;
    localStorage.setItem('creator-teams', JSON.stringify(teams));
    setTeam(currentTeam);

    const users = JSON.parse(localStorage.getItem('creator-users') || '[]') as User[];
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex > -1) {
      if (action === 'approve') {
        users[userIndex].teamId = team.id;
        toast.success(`${getUserName(email)} foi adicionado à equipe.`);
      } else {
        delete users[userIndex].teamId;
        toast.info(`${getUserName(email)} foi recusado.`);
      }
      localStorage.setItem('creator-users', JSON.stringify(users));
      setAllUsers(users);
    }
  };

  const getUserName = (email: string) => {
    return allUsers.find(u => u.email === email)?.name || email;
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando equipe...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-8 text-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 h-full flex items-center justify-center">
        <p className="text-muted-foreground">Verificando informações da equipe...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-8 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-gradient-to-br from-primary to-secondary text-white rounded-lg p-3 shadow-lg">
            <Rocket className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Gerenciar Equipe
            </h1>
            <p className="text-muted-foreground">Veja os detalhes do seu plano, membros e solicitações.</p>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
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
                    {team.members.length} / {team.plan.limits.members}
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
                  {team.pending.length}
                </span>
              </CardTitle>
              <CardDescription className="text-sm">Aprove ou recuse as solicitações para entrar na sua equipe.</CardDescription>
            </CardHeader>
            <CardContent className="py-3">
              <div className="max-h-40 overflow-y-auto pr-2">
                {team.pending.length > 0 ? (
                  <ul className="space-y-2">
                    {team.pending.map(email => (
                      <li key={email} className="flex items-center justify-between p-3 bg-gradient-to-r from-background/70 to-accent/5 rounded-lg shadow-sm border border-accent/10 hover:border-accent/20 transition-all duration-200">
                        <div className='flex items-center gap-3'>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-accent font-bold text-sm">
                              {getUserName(email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{getUserName(email)}</p>
                            <p className="text-xs text-muted-foreground">{email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive transition-all duration-200 h-8 w-8 p-0"
                            onClick={() => handleRequest(email, 'reject')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-success/50 text-success hover:bg-success/10 hover:border-success transition-all duration-200 h-8 w-8 p-0"
                            onClick={() => handleRequest(email, 'approve')}
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
                  {team.members.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
                {team.members.map(email => (
                  <div
                    key={email}
                    className="group relative flex flex-col p-4 rounded-xl bg-gradient-to-br from-background/90 to-secondary/8 border border-secondary/15 hover:border-secondary/25 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 h-fit"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 ring-2 ring-secondary/20 group-hover:ring-secondary/35 transition-all duration-300">
                          <AvatarFallback className="bg-gradient-to-br from-secondary/25 to-accent/25 text-secondary font-bold text-base">
                            {getUserName(email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-secondary transition-colors duration-200 text-sm">
                            {getUserName(email)}
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
                        {email}
                      </p>

                      {email === team.admin && (
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