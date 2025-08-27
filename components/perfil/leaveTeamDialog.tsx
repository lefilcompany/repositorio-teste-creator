

'use client';

import { useState } from 'react';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LeaveTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeaveTeamDialog({ isOpen, onOpenChange }: LeaveTeamDialogProps) {
  const { user, logout } = useAuth();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveTeam = async () => {
    if (!user || !user.teamId) return;
    setIsLeaving(true);
    try {
      const res = await fetch(`/api/teams/${user.teamId}/members/${user.id}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Ajuste para mensagem de admin
        if (data?.error && data.error.toLowerCase().includes('admin')) {
          toast.error('O administrador não pode sair da equipe. Transfira a administração ou delete a conta.');
        } else {
          toast.error(data?.error || 'Falha ao sair da equipe');
        }
        setIsLeaving(false);
        return;
      }
      toast.success('Você saiu da equipe');
      onOpenChange(false);
      logout();
    } catch (error) {
      toast.error('Erro ao processar a solicitação. Tente novamente.');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background to-muted/10 border border-primary/20 shadow-xl p-8">
          <DialogHeader className="text-center space-y-6">
            <div className="w-60 h-full mx-auto relative">
              <div className="w-full h-full flex items-center justify-center p-2">
                <Image
                  src="/assets/logoCreatorPreta.png"
                  alt="Logo Creator"
                  width={420}
                  height={200}
                />
              </div>
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Sair da Equipe?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base leading-relaxed">
              Você tem certeza? Esta ação removerá seu acesso aos projetos e recursos compartilhados.
            </DialogDescription>
          </DialogHeader>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-300/40 my-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-400/20 rounded-md flex-shrink-0 mt-0.5">
              <div className="text-xl">⚠️</div>
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="font-bold text-yellow-800 text-sm">Atenção</h4>
              <p className="text-yellow-700 text-sm leading-tight">
                Você perderá acesso a todos os projetos, marcas e conteúdos da equipe. Esta ação não pode ser desfeita sem um novo convite.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-4 pt-4">
          <DialogClose asChild>
            <Button 
              variant="outline" 
              className="flex-1 h-10 rounded-lg border-2 border-accent font-medium text-sm"
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button 
            onClick={handleLeaveTeam} 
            className="flex-1 h-10 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
            disabled={isLeaving}
          >
            {isLeaving ? (<><Loader2 className="animate-spin h-4 w-4 mr-2 inline" />Saindo...</>) : 'Sair da Equipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
