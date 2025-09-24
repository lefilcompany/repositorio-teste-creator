'use client';

import { User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import PersonalInfoForm from '@/components/perfil/personalInfoForm';
import AdditionalInfoCard from '@/components/perfil/additionalInfoCard';
import AccountManagement from '@/components/perfil/accountManagement';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/user';
import type { Team } from '@/types/team';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PerfilPage() {
  const { user, updateUser, isLoading } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [teamInfo, setTeamInfo] = useState({
    teamName: 'Sem equipe',
    plan: '-',
    actionsRemaining: { total: 0, createContent: 0, reviewContent: 0, planContent: 0 },
  });

  // Carrega dados da equipe via API
  useEffect(() => {
    const loadTeam = async () => {
      if (!user?.teamId) {
        setIsLoadingTeam(false);
        return;
      }
      
      try {
        const teamRes = await fetch(`/api/teams?userId=${user.id}`);
        if (teamRes.ok) {
          const teamsData: Team[] = await teamRes.json();
          const currentTeam = teamsData.find(t => t.id === user.teamId);
          if (currentTeam) setTeam(currentTeam);
        }

        // Fetch team data with subscription-based credits
        const teamResponse = await fetch(`/api/teams/${user.teamId}?summary=true`);
        if (teamResponse.ok) {
          const teamDataResult = await teamResponse.json();
          setTeamData(teamDataResult);
        }
      } catch (error) {
        // Silently handle error for team data
      } finally {
        setIsLoadingTeam(false);
      }
    };

    loadTeam();
  }, [user]);

  useEffect(() => {
    if (!team || !teamData) return;
    setTeamInfo({
      teamName: team.name,
      plan: team.plan?.displayName || team.plan?.name || 'Não definido',
      actionsRemaining: {
        total: (teamData.credits?.quickContentCreations || 0) + (teamData.credits?.contentSuggestions || 0) + (teamData.credits?.contentReviews || 0) + (teamData.credits?.contentPlans || 0),
        createContent: teamData.credits?.contentSuggestions || 0,
        reviewContent: teamData.credits?.contentReviews || 0,
        planContent: teamData.credits?.contentPlans || 0,
      },
    });
  }, [team, teamData]);

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
          'x-user-id': user.id, // Adiciona o header de autenticação
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
      toast.error(error.message || 'Erro ao salvar informações. Tente novamente.');
    }
  };

  const handleSavePassword = async (newPassword: string) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id, // Adiciona o header de autenticação
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao alterar senha');
      }

      toast.success('Senha alterada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha. Tente novamente.');
    }
  };

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 p-6 rounded-xl border border-primary/30 shadow-lg backdrop-blur-md">
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

        {/* Main content */}
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
      </div>
    </div>
  );
}
