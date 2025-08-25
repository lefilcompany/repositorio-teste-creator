// components/perfil/leaveTeamDialog.tsx
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Team } from '@/types/team';
import { User } from '@/types/user';

interface LeaveTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeaveTeamDialog({ isOpen, onOpenChange }: LeaveTeamDialogProps) {
  const { user, logout } = useAuth();

  const handleLeaveTeam = async () => {
    if (!user || !user.teamId) return;
    
    try {
      // Fazer chamada à API para remover o usuário da equipe
      // Por ora, apenas fazemos logout pois a lógica completa depende da API de teams
      onOpenChange(false);
      logout();
    } catch (error) {
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background to-muted/10 border border-primary/20 shadow-lg">
        <DialogHeader className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto relative">
            <Image
              src="/assets/logoCreatorPreta.png"
              alt="Logo Creator"
              width={64}
              height={64}
              className="rounded-lg shadow-sm border border-primary/15"
            />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-sm">🚪</span>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Sair da Equipe?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
            Você tem certeza? Esta ação removerá seu acesso aos projetos e recursos compartilhados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-300/40 my-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-yellow-400/20 rounded flex-shrink-0 mt-0.5">
              <div className="text-lg">⚠️</div>
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="font-bold text-yellow-800 text-sm">Atenção</h4>
              <p className="text-yellow-700 text-xs leading-tight">
                Você perderá acesso a todos os projetos, marcas e conteúdos da equipe. 
                Esta ação não pode ser desfeita sem um novo convite.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-3 pt-3">
          <DialogClose asChild>
            <Button 
              variant="outline" 
              className="flex-1 h-9 border border-muted hover:border-muted-foreground hover:bg-muted/30 rounded-lg font-medium transition-all text-sm"
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button 
            onClick={handleLeaveTeam} 
            className="flex-1 h-9 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all text-sm"
          >
            Sair da Equipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
