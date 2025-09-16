import { Sparkles, CheckCircle, Calendar } from 'lucide-react';

// Tipos de ação para consistência - deve corresponder ao enum ActionType no Prisma
export type ActionType = 'CRIAR_CONTEUDO' | 'REVISAR_CONTEUDO' | 'PLANEJAR_CONTEUDO';

// Tipos de ação para exibição
export type ActionDisplayType = 'Criar conteúdo' | 'Revisar conteúdo' | 'Planejar conteúdo';

// Mapeamento de tipos para exibição
export const ACTION_TYPE_DISPLAY: { [key in ActionType]: ActionDisplayType } = {
  'CRIAR_CONTEUDO': 'Criar conteúdo',
  'REVISAR_CONTEUDO': 'Revisar conteúdo',
  'PLANEJAR_CONTEUDO': 'Planejar conteúdo',
};

// Mapeamento de tipos para seus respectivos ícones e cores
export const ACTION_STYLE_MAP: {
  [key in ActionDisplayType]: { icon: React.ElementType; color: string; background: string };
} = {
  'Criar conteúdo': {
    icon: Sparkles,
    color: 'text-primary',
    background: 'bg-primary/10',
  },
  'Revisar conteúdo': {
    icon: CheckCircle,
    color: 'text-accent',
    background: 'bg-accent/10',
  },
  'Planejar conteúdo': {
    icon: Calendar,
    color: 'text-secondary',
    background: 'bg-secondary/10',
  },
};

// Interface principal da Ação - corresponde ao modelo Prisma
export interface Action {
  id: string;
  type: ActionType;
  brandId: string;
  teamId: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  status: string; // "Em revisão", "Aprovado", "Rejeitado"
  approved: boolean;
  revisions: number;
  details?: {
    prompt?: string;
    objective?: string;
    platform?: string;
    [key: string]: any;
  } | null;
  result?: {
    imageUrl?: string;
    title?: string;
    body?: string;
    hashtags?: string[];
    feedback?: string;
    plan?: string;
    originalImage?: string;
    [key: string]: any;
  } | null;
  // Relacionamentos vindos do Prisma
  brand?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Dados mínimos utilizados nas listagens de ações
export type ActionSummary = {
  id: string;
  type: ActionType;
  createdAt: string;
  brand: { id: string; name: string } | null;
};