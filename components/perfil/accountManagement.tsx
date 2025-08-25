'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, UserMinus, UserX } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AccountManagement() {
  const { user, team, logout, reloadTeam } = useAuth();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const isUserAdmin = user && team ? user.email === team.admin : false;

  const loadTeamMembers = async () => {
    if (!user?.teamId || !user?.id) return;

    setLoadingMembers(true);
    try {
      const response = await fetch(`/api/users/team-members?teamId=${user.teamId}&excludeUserId=${user.id}`);
      if (response.ok) {
        const members = await response.json();
        setTeamMembers(members);
      } else {
        toast.error('Erro ao carregar membros da equipe');
      }
    } catch (error) {
      toast.error('Erro ao carregar membros da equipe');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newAdminId: isUserAdmin && teamMembers.length > 0 ? selectedNewAdmin : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isAdmin && teamMembers.length > 0 && !selectedNewAdmin) {
          toast.error('Você deve escolher um novo administrador antes de deletar sua conta');
          return;
        }
        throw new Error(data.error || 'Erro ao deletar conta');
      }

      // Se houve transferência de admin, notificar
      if (isUserAdmin && selectedNewAdmin) {
        const newAdminName = teamMembers.find(m => m.id === selectedNewAdmin)?.name;
        if (newAdminName) {
          toast.success(`Administração transferida para ${newAdminName}. Conta deletada com sucesso.`);
        }
      }

      toast.success('Conta deletada com sucesso');
      logout();
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar conta');
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/deactivate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newAdminId: isUserAdmin && teamMembers.length > 0 ? selectedNewAdmin : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isAdmin && teamMembers.length > 0 && !selectedNewAdmin) {
          toast.error('Você deve escolher um novo administrador antes de inativar sua conta');
          return;
        }
        throw new Error(data.error || 'Erro ao inativar conta');
      }

      // Se houve transferência de admin, notificar
      if (isUserAdmin && selectedNewAdmin) {
        const newAdminName = teamMembers.find(m => m.id === selectedNewAdmin)?.name;
        if (newAdminName) {
          toast.success(`Administração transferida para ${newAdminName}. Conta inativada com sucesso.`);
        }
      }

      toast.success('Conta inativada com sucesso');
      logout();
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao inativar conta');
    } finally {
      setIsLoading(false);
      setIsDeactivateDialogOpen(false);
    }
  };

  const openDeleteDialog = () => {
    if (isUserAdmin) {
      loadTeamMembers();
    }
    setSelectedNewAdmin('');
    setIsDeleteDialogOpen(true);
  };

  const openDeactivateDialog = () => {
    if (isUserAdmin) {
      loadTeamMembers();
    }
    setSelectedNewAdmin('');
    setIsDeactivateDialogOpen(true);
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl border border-primary/20 shadow-md backdrop-blur-sm">
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              Configurações Avançadas
            </h3>
            <p className="text-base text-muted-foreground">
              Gerencie as opções avançadas da sua conta
            </p>
          </div>

          {!isAdvancedOpen ? (
            <Button
              variant="outline"
              onClick={() => setIsAdvancedOpen(true)}
              className="w-full h-12 bg-gradient-to-r from-accent/10 to-secondary/10 border border-accent/30 hover:border-accent/50 hover:bg-gradient-to-r hover:from-accent/20 hover:to-secondary/20 text-foreground font-medium rounded-lg transition-all text-base"
            >
              Mostrar Opções Avançadas
            </Button>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300/50 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-yellow-400/20 rounded-xl flex-shrink-0 mt-1">
                    <AlertTriangle className="h-5 w-5 text-yellow-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-yellow-800 text-base mb-2">Atenção!</h4>
                    <p className="text-yellow-800 text-sm leading-relaxed">
                      As ações abaixo são irreversíveis. Certifique-se antes de prosseguir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={openDeactivateDialog}
                  variant="outline"
                  className="flex flex-col h-auto p-5 space-y-3 border border-slate-300/50 hover:border-slate-400/70 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-700 hover:text-slate-800 rounded-xl transition-all group shadow-sm"
                >
                  <div className="p-2.5 bg-slate-200/60 rounded-xl group-hover:bg-slate-300/70 transition-colors">
                    <UserMinus className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="text-center space-y-2">
                    <span className="font-bold text-base">Inativar Conta</span>
                    <p className="text-sm text-slate-600 leading-tight px-2">
                      Dados preservados. Reative facilmente cadastrando-se novamente.
                    </p>
                  </div>
                </Button>

                <Button
                  onClick={openDeleteDialog}
                  variant="outline"
                  className="flex flex-col h-auto p-5 space-y-3 border border-red-300/50 hover:border-red-400/70 bg-gradient-to-br from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 text-red-800 hover:text-red-900 rounded-xl transition-all group shadow-sm"
                >
                  <div className="p-2.5 bg-red-400/20 rounded-xl group-hover:bg-red-400/30 transition-colors">
                    <UserX className="h-5 w-5 text-red-700" />
                  </div>
                  <div className="text-center space-y-2">
                    <span className="font-bold text-base">Deletar Conta</span>
                    <p className="text-sm text-red-700 leading-tight px-2">
                      <strong>PERMANENTE!</strong> Todos os dados serão removidos.
                    </p>
                  </div>
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => setIsAdvancedOpen(false)}
                className="w-full text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-all h-10 text-base"
                size="sm"
              >
                Ocultar Opções Avançadas
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Dialog para Inativar Conta */}
      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent className="max-w-2xl w-full bg-gradient-to-br from-background to-muted/20 border border-slate-300/50 shadow-2xl rounded-2xl">
          <DialogHeader className="space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-slate-100/50">
              <UserMinus className="h-8 w-8 text-white" />
            </div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl font-bold text-foreground">
                Inativar Conta
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
                Sua conta será temporariamente inativada, mas seus dados permanecerão seguros.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/80 p-5 rounded-xl border border-slate-200/60 shadow-sm">
              <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-3 text-base">
                <div className="w-2.5 h-2.5 bg-slate-600 rounded-full"></div>
                Como reativar:
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Faça um novo cadastro usando o <strong>mesmo e-mail</strong>.
                Todos os dados serão restaurados automaticamente!
              </p>
            </div>

            {isUserAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-gradient-to-r from-orange-50 to-red-50/80 p-5 rounded-xl border border-orange-200/60 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-400/20 rounded-xl flex-shrink-0 mt-0.5">
                      <AlertTriangle className="h-5 w-5 text-orange-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-orange-800 text-base mb-2">Administrador</h4>
                      <p className="text-orange-700 text-sm leading-relaxed">
                        Escolha um novo administrador antes de inativar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                    Novo Administrador:
                  </label>
                  <Select value={selectedNewAdmin} onValueChange={setSelectedNewAdmin}>
                    <SelectTrigger className="h-12 bg-background border border-primary/30 hover:border-primary/50 rounded-xl text-base shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                      <SelectValue
                        placeholder={
                          loadingMembers
                            ? "Carregando..."
                            : teamMembers.length === 0
                              ? "Nenhum membro ativo"
                              : "Selecione um membro"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-muted shadow-xl max-w-md">
                      {teamMembers.length === 0 ? (
                        <SelectItem value="no-members" disabled className="text-sm py-3 px-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            Nenhum membro ativo na equipe
                          </div>
                        </SelectItem>
                      ) : (
                        teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id} className="text-sm py-3 px-4 rounded-lg hover:bg-foreground/50 focus:bg-foreground/50 transition-colors cursor-pointer">
                            <div className="flex flex-col gap-1.5 w-full pr-6">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 ml-4"></div>
                                  <span className="font-medium text-sm truncate">{member.name}</span>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex-shrink-0 font-medium">
                                  {member.role === 'ADMIN' ? 'Admin' : member.role === 'MEMBER' ? 'Membro' : 'Sem Equipe'}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {teamMembers.length === 0 && (
                    <div className="bg-muted/40 p-3 rounded-xl border border-muted/60">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Como não há outros membros, você pode prosseguir diretamente.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeactivateDialogOpen(false)}
              disabled={isLoading}
              className="flex-1 h-12 border-2 border-muted hover:border-muted-foreground/60 rounded-xl font-semibold transition-all text-base bg-background/50 hover:bg-background shadow-sm hover:text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeactivateAccount}
              disabled={isLoading || (isUserAdmin && teamMembers.length > 0 && !selectedNewAdmin)}
              className="flex-1 h-12 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-base ring-2 ring-slate-500/20"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Inativação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Deletar Conta */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-2xl w-full bg-gradient-to-br from-background to-muted/20 border border-destructive/30 shadow-2xl rounded-2xl">
          <DialogHeader className="space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-red-100/50">
              <UserX className="h-8 w-8 text-white" />
            </div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl font-bold text-foreground">
                Deletar Conta
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
                Esta ação é <strong className="text-destructive">PERMANENTE</strong> e não pode ser desfeita.
                Todos os dados serão removidos.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <div className="bg-gradient-to-r from-red-50 to-pink-50/80 p-5 rounded-xl border border-red-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-400/20 rounded-xl flex-shrink-0 mt-0.5">
                  <AlertTriangle className="h-5 w-5 text-red-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-red-800 text-base mb-2">Aviso Importante</h4>
                  <p className="text-red-700 text-sm leading-relaxed">
                    <strong>Dados perdidos:</strong> perfil, projetos, conteúdos, marcas e histórico.
                  </p>
                </div>
              </div>
            </div>

            {isUserAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-gradient-to-r from-orange-50 to-red-50/80 p-5 rounded-xl border border-orange-200/60 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-400/20 rounded-xl flex-shrink-0 mt-0.5">
                      <AlertTriangle className="h-5 w-5 text-orange-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-orange-800 text-base mb-2">Administrador</h4>
                      <p className="text-orange-700 text-sm leading-relaxed">
                        Escolha um novo administrador antes de deletar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                    Novo Administrador:
                  </label>
                  <Select value={selectedNewAdmin} onValueChange={setSelectedNewAdmin}>
                    <SelectTrigger className="h-12 bg-background border border-primary/30 hover:border-primary/50 rounded-xl text-base shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                      <SelectValue
                        placeholder={
                          loadingMembers
                            ? "Carregando..."
                            : teamMembers.length === 0
                              ? "Nenhum membro ativo"
                              : "Selecione um membro"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-muted shadow-xl max-w-md">
                      {teamMembers.length === 0 ? (
                        <SelectItem value="no-members" disabled className="text-sm py-3 px-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            Nenhum membro ativo na equipe
                          </div>
                        </SelectItem>
                      ) : (
                        teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id} className="text-sm py-3 px-4 rounded-lg hover:bg-foreground/50 focus:bg-foreground/50 transition-colors cursor-pointer">
                            <div className="flex flex-col gap-1.5 w-full pr-6">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 ml-4"></div>
                                  <span className="font-medium text-sm truncate">{member.name}</span>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex-shrink-0 font-medium">
                                  {member.role === 'ADMIN' ? 'Admin' : member.role === 'MEMBER' ? 'Membro' : 'Sem Equipe'}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {teamMembers.length === 0 && (
                    <div className="bg-muted/40 p-3 rounded-xl border border-muted/60">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Como não há outros membros, você pode prosseguir diretamente.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
              className="flex-1 h-12 border-2 border-muted hover:border-muted-foreground/60 rounded-xl font-semibold transition-all text-base bg-background/50 hover:bg-background shadow-sm hover:text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={isLoading || (isUserAdmin && teamMembers.length > 0 && !selectedNewAdmin)}
              className="flex-1 h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-base ring-2 ring-red-500/20"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deletar Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
