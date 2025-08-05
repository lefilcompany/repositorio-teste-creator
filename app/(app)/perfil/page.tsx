'use client';

import { User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import PersonalInfoForm from '@/components/perfil/personalInfoForm';
import AdditionalInfoCard from '@/components/perfil/additionalInfoCard';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/user';
import { Team } from '@/types/team';
import { Loader2 } from 'lucide-react';

export default function PerfilPage() {
  const { user, updateUser, isLoading } = useAuth();
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    if (user?.teamId) {
      const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
      const t = teams.find((team) => team.id === user.teamId);
      if (t) setTeamName(t.name);
    }
  }, [user]);

  if (isLoading || !user) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
  
  const handleSaveInfo = (data: Omit<User, 'email' | 'password'>) => {
    updateUser(data);
    alert("Dados salvos com sucesso!");
  };
  
  // ** NOVA FUNÇÃO PARA SALVAR A SENHA **
  const handleSavePassword = (newPassword: string) => {
    updateUser({ password: newPassword });
    alert("Senha alterada com sucesso!");
  };

  const teamInfo = {
    teamName: teamName || 'Sem equipe',
    plan: 'Free Trial',
    actionsRemaining: {
      total: 253,
      createContent: 50,
      reviewContent: 50,
      planContent: 153,
    },
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-8">
      <header>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Meu Perfil
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais e detalhes da sua equipe.
            </p>
          </div>
        </div>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
        <div className="lg:col-span-2">
           <PersonalInfoForm 
            initialData={personalInfo} 
            onSave={handleSaveInfo}
            onSavePassword={handleSavePassword}
          />
        </div>
        <div className="lg:col-span-1">
          <AdditionalInfoCard teamData={teamInfo} userName={user.name} />
        </div>
      </main>
    </div>
  );
}