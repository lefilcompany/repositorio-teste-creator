'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { User } from '@/types/user';

interface TeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isFromLogin?: boolean; // Para saber se vem do login ou cadastro
}

type TeamStep = 'choice' | 'create' | 'join' | 'pending';

export default function TeamDialog({ isOpen, onClose, user, isFromLogin = false }: TeamDialogProps) {
  const [teamStep, setTeamStep] = useState<TeamStep>('choice');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showCreateCode, setShowCreateCode] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const router = useRouter();
  const { completeLogin } = useAuth();

  const handleClose = () => {
    // Resetar estados
    setTeamStep('choice');
    setTeamName('');
    setTeamCode('');
    setJoinCode('');
    
    // Se for do cadastro e o usuário tentar fechar, redirecionar para login
    if (!isFromLogin) {
      toast.info('Você será redirecionado para fazer login quando estiver pronto para escolher uma equipe.');
      setTimeout(() => {
        router.push('/login');
      }, 1500); // Dar tempo para o usuário ler a mensagem
    }
    
    onClose();
  };

  const handleCreateTeam = async () => {
    if (!user) return;
    
    if (!teamName.trim() || !teamCode.trim()) {
      toast.error('Por favor, preencha o nome e código da equipe');
      return;
    }
    
    try {
      const freePlan = {
        name: 'Free',
        limits: {
          members: 5,
          brands: 1,
          themes: 3,
          personas: 2,
          calendars: 1,
          contentSuggestions: 20,
          contentReviews: 20,
        },
      };
      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: teamName,
          code: teamCode,
          plan: freePlan,
          credits: {
            contentSuggestions: freePlan.limits.contentSuggestions,
            contentReviews: freePlan.limits.contentReviews,
            contentPlans: freePlan.limits.calendars,
          },
        }),
      });
      
      if (res.ok) {
        const updatedTeam = await res.json();
        toast.success('Equipe criada com sucesso!');
        handleClose();
        
        if (isFromLogin && user) {
          // Se vem do login, completar o login com os dados atualizados
          const updatedUser = { ...user, status: 'ACTIVE' as const, teamId: updatedTeam.id, role: 'ADMIN' as const };
          await completeLogin(updatedUser);
        } else {
          // Se vem do cadastro, redirecionar para login
          router.push('/login');
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao criar equipe');
      }
    } catch (error) {
      toast.error('Erro de conexão ao criar equipe');
    }
  };

  const handleJoinTeam = async () => {
    if (!user) return;
    
    if (!joinCode.trim()) {
      toast.error('Por favor, digite o código da equipe');
      return;
    }
    
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, code: joinCode }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Código de equipe inválido');
        return;
      }
      
      if (isFromLogin && user) {
        // Se vem do login, fechar dialog (usuário fica com PENDING)
        const updatedUser = { ...user, status: 'PENDING' as const };
        handleClose();
        // Não completar login pois status é PENDING - usuário deve aguardar aprovação
        toast.success('Solicitação enviada! Você será redirecionado para aguardar aprovação.');
        router.push('/login');
      } else {
        // Se vem do cadastro, mostrar tela de pending
        setTeamStep('pending');
        toast.success('Solicitação enviada! Aguarde aprovação do administrador.');
      }
    } catch (error) {
      toast.error('Erro de conexão ao solicitar entrada na equipe');
    }
  };

  const renderDialogContent = () => {
    switch (teamStep) {
      case 'choice':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Participar de uma equipe</DialogTitle>
              <DialogDescription className="space-y-3 text-left">
                {isFromLogin 
                  ? "Para acessar o sistema, você precisa fazer parte de uma equipe. Escolha uma das opções abaixo:"
                  : "Para começar a usar o sistema, você precisa estar em uma equipe. Escolha uma das opções abaixo:"
                }
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>• Criar equipe:</strong> Você se tornará o administrador e poderá convidar outros membros.
                  </div>
                  <div>
                    <strong>• Entrar em equipe:</strong> Solicite acesso usando o código fornecido pelo administrador.
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <div className="flex space-x-2">
                <Button onClick={() => setTeamStep('create')}>Criar equipe</Button>
                <Button onClick={() => setTeamStep('join')}>Entrar em equipe</Button>
              </div>
            </DialogFooter>
          </>
        );

      case 'create':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Criar nova equipe</DialogTitle>
              <DialogDescription>
                Você será o administrador desta equipe e poderá convidar outros membros usando o código de acesso que você definir.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da equipe</label>
                <Input 
                  placeholder="Ex: Minha Empresa, Time Marketing..." 
                  value={teamName} 
                  onChange={e => setTeamName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Código de acesso</label>
                <div className="relative">
                  <Input 
                    type={showCreateCode ? 'text' : 'password'}
                    placeholder="Crie um código seguro para sua equipe" 
                    value={teamCode} 
                    onChange={e => setTeamCode(e.target.value)} 
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => setShowCreateCode(!showCreateCode)}
                  >
                    {showCreateCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este código será usado por outros usuários para solicitar entrada na sua equipe.
                </p>
              </div>
            </div>
            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={() => setTeamStep('choice')}>
                Voltar
              </Button>
              <Button onClick={handleCreateTeam}>Criar equipe</Button>
            </DialogFooter>
          </>
        );

      case 'join':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Entrar em uma equipe</DialogTitle>
              <DialogDescription>
                Para entrar em uma equipe existente, você precisa do código de acesso fornecido pelo administrador da equipe.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código da equipe</label>
                <div className="relative">
                  <Input 
                    type={showJoinCode ? 'text' : 'password'}
                    placeholder="Digite o código fornecido pelo administrador" 
                    value={joinCode} 
                    onChange={e => setJoinCode(e.target.value)} 
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => setShowJoinCode(!showJoinCode)}
                  >
                    {showJoinCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Após enviar, aguarde a aprovação do administrador para acessar o sistema.
                </p>
              </div>
            </div>
            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={() => setTeamStep('choice')}>
                Voltar
              </Button>
              <Button onClick={handleJoinTeam}>Solicitar entrada</Button>
            </DialogFooter>
          </>
        );

      case 'pending':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Solicitação enviada com sucesso</DialogTitle>
              <DialogDescription>
                Sua solicitação foi enviada para o administrador da equipe. Você receberá uma notificação quando ela for aprovada e poderá acessar o sistema normalmente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => router.push('/login')}>Entendido</Button>
            </DialogFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent>
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
