// components/perfil/additionalInfoCard.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Star, Zap, Sparkles, CheckCircle, Calendar } from 'lucide-react';
import LeaveTeamDialog from './leaveTeamDialog';

interface AdditionalInfoCardProps {
  teamData: {
    teamName: string;
    plan: string;
    actionsRemaining: {
      total: number;
      createContent: number;
      reviewContent: number;
      planContent: number;
    };
  };
}

export default function AdditionalInfoCard({ teamData }: AdditionalInfoCardProps) {
  const [isLeaveTeamDialogOpen, setIsLeaveTeamDialogOpen] = useState(false);

  return (
    <>
      <Card className="h-full shadow-lg bg-gradient-to-br from-secondary to-primary text-secondary-foreground">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <InfoItem icon={Users} label="Equipe" value={teamData.teamName} />
            <InfoItem icon={Star} label="Assinatura da Equipe" value={teamData.plan} />
            <InfoItem icon={Zap} label="Ações Restantes" value={teamData.actionsRemaining.total.toString()} />
          </div>
          <div className="pt-4 border-t border-white/20 space-y-3">
             <ActionDetail icon={Sparkles} label="Criar conteúdo:" value={teamData.actionsRemaining.createContent} />
             <ActionDetail icon={Calendar} label="Planejar conteúdo:" value={teamData.actionsRemaining.planContent} />
             <ActionDetail icon={CheckCircle} label="Revisar conteúdo:" value={teamData.actionsRemaining.reviewContent} />
          </div>
          <div className="pt-6">
            <Button 
              variant="outline" 
              className="w-full bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => setIsLeaveTeamDialogOpen(true)}
            >
              Sair da equipe
            </Button>
          </div>
        </CardContent>
      </Card>
      <LeaveTeamDialog isOpen={isLeaveTeamDialogOpen} onOpenChange={setIsLeaveTeamDialogOpen} />
    </>
  );
}

// Componente auxiliar para os itens de informação
const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-center gap-4">
    <div className="p-2 bg-white/10 rounded-full">
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div>
      <p className="text-sm font-light text-white/80">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  </div>
);

// Componente auxiliar para os detalhes das ações
const ActionDetail = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) => (
    <div className="flex justify-between items-center text-white/90">
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="text-sm">{label}</span>
        </div>
        <span className="font-semibold">{value}</span>
    </div>
);