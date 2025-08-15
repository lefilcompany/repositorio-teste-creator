'use client';

import { User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import PersonalInfoForm from '@/components/perfil/personalInfoForm';
import AdditionalInfoCard from '@/components/perfil/additionalInfoCard';
import AccountManagement from '@/components/perfil/accountManagement';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/user';
import { Team } from '@/types/team';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PerfilPage() {
  const { user, updateUser, isLoading } = useAuth();
  const [teamInfo, setTeamInfo] = useState({
    teamName: 'Sem equipe',
    plan: '-',
    actionsRemaining: { total: 0, createContent: 0, reviewContent: 0, planContent: 0 },
  });

  useEffect(() => {
    const loadTeamInfo = async () => {
      if (!user?.teamId || !user.id) return;

      try {
        const teamsRes = await fetch(`/api/teams?userId=${user.id}`);
        if (teamsRes.ok) {
          const teamsData: Team[] = await teamsRes.json();
          const t = teamsData.find((team) => team.id === user.teamId);
          if (t) {
            setTeamInfo({
              teamName: t.name,
              plan: t.plan.name,
              actionsRemaining: {
                total: t.credits.contentSuggestions + t.credits.contentReviews + t.credits.contentPlans,
                createContent: t.credits.contentSuggestions,
                reviewContent: t.credits.contentReviews,
                planContent: t.credits.contentPlans,
              },
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar informações da equipe:', error);
      }
    };

    loadTeamInfo();
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const personalInfo = {
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    state: user.state || '',
    city: user.city || '',
  };

  const handleSaveInfo = async (data: Omit<User, 'email' | 'password'>) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar dados');
      }

      const updatedUser = await response.json();
      updateUser(updatedUser);
      toast.success('Informações pessoais atualizadas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar informações:', error);
      toast.error(error.message || 'Erro ao salvar informações. Tente novamente.');
    }
  };

  const handleSavePassword = async (newPassword: string) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao alterar senha');
      }

      toast.success('Senha alterada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha. Tente novamente.');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="pb-6">
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-6 rounded-xl border border-primary/20 shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 bg-gradient-to-br from-primary to-secondary text-white rounded-xl p-3 shadow-md">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Meu Perfil
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mt-2">
                Gerencie suas informações pessoais e configurações da conta
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-6 md:pb-8 overflow-y-auto">
        <div className="space-y-8">
          {/* Seção: Informações Pessoais e da Equipe */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PersonalInfoForm
              initialData={personalInfo}
              onSave={handleSaveInfo}
              onSavePassword={handleSavePassword}
            />
            <AdditionalInfoCard userData={{ team: { name: teamInfo.teamName }, role: user.role }} />
          </div>
          
          {/* Seção: Configurações Avançadas */}
          <div className="w-full">
            <AccountManagement />
          </div>
        </div>
      </main>
    </div>
  );
}