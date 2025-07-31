// app/perfil/page.tsx
import { User } from 'lucide-react';
import PersonalInfoForm from '@/components/perfil/personalInfoForm';
import AdditionalInfoCard from '@/components/perfil/additionalInfoCard';

// Mock de dados que viriam do seu backend/autenticação
const userProfileData = {
  personalInfo: {
    fullName: 'Ricardo Pereira Machado de Oliveira',
    email: 'Ricperas06@gmail.com',
    phone: '+55 (81) 9 0000-0000',
    state: 'PE',
    city: 'Garanhuns',
  },
  teamInfo: {
    teamName: 'Mídia Paga',
    plan: 'Free Trial',
    actionsRemaining: {
      total: 253,
      createContent: 50,
      reviewContent: 50,
      planContent: 153, // Assumindo o restante para 'planejar'
    },
  },
};

export default function PerfilPage() {
  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-8">
      {/* Cabeçalho da Página */}
      <header>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <User className="h-8 w-8" />
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

      {/* Conteúdo Principal */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
        <div className="lg:col-span-2">
          <PersonalInfoForm initialData={userProfileData.personalInfo} />
        </div>
        <div className="lg:col-span-1">
          <AdditionalInfoCard teamData={userProfileData.teamInfo} />
        </div>
      </main>
    </div>
  );
}