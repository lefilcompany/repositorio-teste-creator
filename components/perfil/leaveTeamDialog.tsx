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
      console.error('Erro ao sair da equipe:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <Image
            src="/assets/logoCreatorPreta.png"
            alt="Logo Creator"
            width={120}
            height={32}
            className="mb-4"
          />
          <DialogTitle className="text-2xl">Sair da Equipe?</DialogTitle>
          <DialogDescription>
            Você tem certeza que deseja sair desta equipe? Esta ação removerá seu acesso aos projetos e recursos compartilhados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full rounded-full hover:border-accent">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={handleLeaveTeam} className="w-full rounded-full">
            Sair da Equipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}