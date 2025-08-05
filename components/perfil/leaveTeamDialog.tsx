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

  const handleLeaveTeam = () => {
    if (!user) return;
    const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
    const teamIndex = teams.findIndex(t => t.id === user.teamId);
    if (teamIndex > -1) {
      teams[teamIndex].members = teams[teamIndex].members.filter(m => m !== user.email);
      localStorage.setItem('creator-teams', JSON.stringify(teams));
    }
    const users = JSON.parse(localStorage.getItem('creator-users') || '[]') as User[];
    const updatedUsers = users.filter(u => u.email !== user.email);
    localStorage.setItem('creator-users', JSON.stringify(updatedUsers));
    onOpenChange(false);
    logout();
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