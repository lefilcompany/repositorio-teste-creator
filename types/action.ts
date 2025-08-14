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
    color: 'text-pink-600',
    background: 'bg-pink-100 dark:bg-pink-900/20',
  },
  'Revisar conteúdo': {
    icon: CheckCircle,
    color: 'text-blue-600',
    background: 'bg-blue-100 dark:bg-blue-900/20',
  },
  'Planejar conteúdo': {
    icon: Calendar,
    color: 'text-purple-600',
    background: 'bg-purple-100 dark:bg-purple-900/20',
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