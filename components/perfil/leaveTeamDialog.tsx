// components/perfil/leaveTeamDialog.tsx
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface LeaveTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeaveTeamDialog({ isOpen, onOpenChange }: LeaveTeamDialogProps) {
  const handleLeaveTeam = () => {
    console.log("Usuário saiu da equipe (simulação).");
    onOpenChange(false);
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