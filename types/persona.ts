export type Persona = {
  // --- Campos de Metadados (Mantidos) ---
  id: string;
  teamId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;

  // --- Campos Demográficos e de Associação (Mantidos) ---
  brandId: string; 
  name: string;
  gender: string;
  age: string;
  location: string;
  
  // --- Campos Estratégicos (Atualizados) ---

  // 'role' foi renomeado para ser mais descritivo
  professionalContext: string; 

  // 'hobbies' foi renomeado para ter um foco mais estratégico
  beliefsAndInterests: string;

  // 'consumptionHabits' foi renomeado para ser mais específico
  contentConsumptionRoutine: string;

  // 'goals' foi renomeado para focar no principal motivador
  mainGoal: string;

  // 'challenges' foi mantido, pois já é um campo estratégico chave
  challenges: string;

  // --- Campos Estratégicos (Novos) ---
  
  // Adicionado para guiar a comunicação e o copywriting
  preferredToneOfVoice: string;

  // Adicionado para segmentar conteúdo e ofertas
  purchaseJourneyStage: string;

  // Adicionado para otimizar "ganchos" de conteúdo e anúncios
  interestTriggers: string;
};

// Dados mínimos utilizados nas listagens de personas
export type PersonaSummary = Pick<Persona, 'id' | 'brandId' | 'name' | 'createdAt'>;

/*
  Campos removidos do tipo original e substituídos:
  - role: string;
  - hobbies: string;
  - consumptionHabits: string;
  - goals: string;
*/

// Nota: Dependendo da sua regra de negócio, você pode querer tornar alguns destes
// campos opcionais, adicionando um "?" (ex: age?: string) ou permitindo null
// (ex: age: string | null), caso não sejam obrigatórios no momento da criação.