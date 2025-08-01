import { Sparkles, CheckCircle, Calendar } from 'lucide-react';

// Tipos de ação para consistência
export type ActionType = 'Criar conteúdo' | 'Revisar conteúdo' | 'Planejar conteúdo';

// Mapeamento de tipos para seus respectivos ícones e cores
export const ACTION_STYLE_MAP: {
  [key in ActionType]: { icon: React.ElementType; color: string; background: string };
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

// Interface principal da Ação
export interface Action {
  id: string;
  type: ActionType;
  brand: string;
  createdAt: string;
  // Detalhes da entrada do usuário
  details: {
    prompt?: string;
    objective?: string;
    platform?: string;
    [key: string]: any;
  };
  // Resultado gerado pela IA
  result: {
    imageUrl?: string;
    title?: string;
    body?: string;
    hashtags?: string[];
    feedback?: string;
    plan?: string;
    originalImage?: string; // Para armazenar a imagem original na revisão
  };
}