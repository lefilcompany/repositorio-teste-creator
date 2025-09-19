// lib/subscription-utils.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PlanLimits {
  maxMembers: number;
  maxBrands: number;
  maxStrategicThemes: number;
  maxPersonas: number;
  quickContentCreations: number;
  customContentSuggestions: number;
  contentPlans: number;
  contentReviews: number;
}

export interface PlanInfo extends PlanLimits {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  price: number;
  trialDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionStatus {
  isActive: boolean;
  isExpired: boolean;
  isTrial: boolean;
  canAccess: boolean;
  plan: PlanInfo | null;
  daysRemaining?: number;
  subscription?: any;
}

/**
 * Verifica o status da assinatura de um time
 */
export async function getTeamSubscriptionStatus(teamId: string): Promise<SubscriptionStatus> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        currentPlan: true,
        subscriptions: {
          include: {
            plan: true
          },
          where: {
            isActive: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!team) {
      return {
        isActive: false,
        isExpired: true,
        isTrial: false,
        canAccess: false,
        plan: null
      };
    }

    // Usar currentPlan como fonte principal de verdade
    let currentPlan = team.currentPlan;
    
    // Se não tem currentPlan definido, usar FREE como padrão e atualizar
    if (!currentPlan) {
      const freePlan = await prisma.plan.findFirst({
        where: { name: 'FREE' }
      });
      
      if (!freePlan) {
        throw new Error('Plano padrão FREE não encontrado');
      }

      // Atualizar o team para ter o plano FREE
      await prisma.team.update({
        where: { id: teamId },
        data: { currentPlanId: freePlan.id }
      });

      currentPlan = freePlan;
    }

    // Verificar se há assinatura ativa (para detectar trial)
    const activeSubscription = team.subscriptions.length > 0 ? team.subscriptions[0] : null;
    
    let isActive = true; // Sempre ativo pois sempre tem um plano
    let isTrial = false;
    let isExpired = false;
    let canAccess = true;
    let daysRemaining: number | undefined;
    
    if (activeSubscription) {
      const now = new Date();
      isTrial = activeSubscription.status === 'TRIAL';
      
      if (isTrial && activeSubscription.trialEndDate) {
        const isTrialExpired = now > activeSubscription.trialEndDate;
        
        if (isTrialExpired) {
          // Trial expirado - marcar como expirado e bloquear acesso premium
          isExpired = true;
          canAccess = false; // Bloquear acesso às funcionalidades premium
          
          // Downgrade para FREE
          const freePlan = await prisma.plan.findFirst({
            where: { name: 'FREE' }
          });
          
          if (freePlan && team.currentPlanId !== freePlan.id) {
            await prisma.team.update({
              where: { id: teamId },
              data: { 
                currentPlanId: freePlan.id,
                isTrialActive: false 
              }
            });
            currentPlan = freePlan;
          }
          
          // Atualizar subscription para EXPIRED
          await prisma.subscription.updateMany({
            where: {
              teamId: teamId,
              status: 'TRIAL',
              isActive: true
            },
            data: {
              status: 'EXPIRED',
              isActive: false
            }
          });
          
          isTrial = false; // Não é mais trial ativo
        } else {
          // Trial ainda ativo - calcular dias restantes
          const diffTime = activeSubscription.trialEndDate.getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }
      }
    }
    
    return {
      isActive,
      isExpired,
      isTrial,
      canAccess,
      plan: currentPlan,
      daysRemaining,
      subscription: activeSubscription
    };
  } catch (error) {
    console.error('Erro ao verificar status da assinatura:', error);
    return {
      isActive: false,
      isExpired: true,
      isTrial: false,
      canAccess: false,
      plan: null
    };
  }
}

/**
 * Atualiza o plano atual de um team
 */
export async function updateTeamPlan(teamId: string, planId: string): Promise<void> {
  await prisma.team.update({
    where: { id: teamId },
    data: { currentPlanId: planId }
  });
}

/**
 * Verifica se o time pode executar uma ação específica
 */
export async function canTeamPerformAction(
  teamId: string, 
  actionType: 'quickContentCreations' | 'customContentSuggestions' | 'contentPlans' | 'contentReviews',
  currentUsage: number
): Promise<{ canPerform: boolean; reason?: string; limit?: number }> {
  const status = await getTeamSubscriptionStatus(teamId);
  
  if (!status.canAccess) {
    return {
      canPerform: false,
      reason: status.isTrial && status.isExpired 
        ? 'Período de teste expirado. Assine um plano para continuar.' 
        : 'Assinatura inativa. Assine um plano para acessar esta funcionalidade.'
    };
  }
  
  if (!status.plan) {
    return {
      canPerform: false,
      reason: 'Plano não encontrado.'
    };
  }
  
  const limit = status.plan[actionType];
  
  if (currentUsage >= limit) {
    return {
      canPerform: false,
      reason: `Limite de ${limit} ${getActionName(actionType)} atingido para seu plano.`,
      limit
    };
  }
  
  return {
    canPerform: true,
    limit
  };
}

/**
 * Verifica se o time pode adicionar mais membros
 */
export async function canTeamAddMembers(teamId: string, currentMemberCount: number): Promise<{ canAdd: boolean; reason?: string; limit?: number }> {
  const status = await getTeamSubscriptionStatus(teamId);
  
  if (!status.canAccess) {
    return {
      canAdd: false,
      reason: status.isTrial && status.isExpired 
        ? 'Período de teste expirado. Assine um plano para continuar.' 
        : 'Assinatura inativa.'
    };
  }
  
  if (!status.plan) {
    return {
      canAdd: false,
      reason: 'Plano não encontrado.'
    };
  }
  
  if (currentMemberCount >= status.plan.maxMembers) {
    return {
      canAdd: false,
      reason: `Limite de ${status.plan.maxMembers} membros atingido para seu plano.`,
      limit: status.plan.maxMembers
    };
  }
  
  return {
    canAdd: true,
    limit: status.plan.maxMembers
  };
}

/**
 * Verifica se o time pode criar mais brands
 */
export async function canTeamCreateBrand(teamId: string, currentBrandCount: number): Promise<{ canCreate: boolean; reason?: string; limit?: number }> {
  const status = await getTeamSubscriptionStatus(teamId);
  
  if (!status.canAccess) {
    return {
      canCreate: false,
      reason: status.isTrial && status.isExpired 
        ? 'Período de teste expirado. Assine um plano para continuar.' 
        : 'Assinatura inativa.'
    };
  }
  
  if (!status.plan) {
    return {
      canCreate: false,
      reason: 'Plano não encontrado.'
    };
  }
  
  if (currentBrandCount >= status.plan.maxBrands) {
    return {
      canCreate: false,
      reason: `Limite de ${status.plan.maxBrands} marcas atingido para seu plano.`,
      limit: status.plan.maxBrands
    };
  }
  
  return {
    canCreate: true,
    limit: status.plan.maxBrands
  };
}

/**
 * Verifica se o time pode criar mais personas
 */
export async function canTeamCreatePersona(teamId: string, currentPersonaCount: number): Promise<{ canCreate: boolean; reason?: string; limit?: number }> {
  const status = await getTeamSubscriptionStatus(teamId);
  
  if (!status.canAccess) {
    return {
      canCreate: false,
      reason: status.isTrial && status.isExpired 
        ? 'Período de teste expirado. Assine um plano para continuar.' 
        : 'Assinatura inativa.'
    };
  }
  
  if (!status.plan) {
    return {
      canCreate: false,
      reason: 'Plano não encontrado.'
    };
  }
  
  if (currentPersonaCount >= status.plan.maxPersonas) {
    return {
      canCreate: false,
      reason: `Limite de ${status.plan.maxPersonas} personas atingido para seu plano.`,
      limit: status.plan.maxPersonas
    };
  }
  
  return {
    canCreate: true,
    limit: status.plan.maxPersonas
  };
}

/**
 * Verifica se o time pode criar mais temas estratégicos
 */
export async function canTeamCreateTheme(teamId: string, currentThemeCount: number): Promise<{ canCreate: boolean; reason?: string; limit?: number }> {
  const status = await getTeamSubscriptionStatus(teamId);
  
  if (!status.canAccess) {
    return {
      canCreate: false,
      reason: status.isTrial && status.isExpired 
        ? 'Período de teste expirado. Assine um plano para continuar.' 
        : 'Assinatura inativa.'
    };
  }
  
  if (!status.plan) {
    return {
      canCreate: false,
      reason: 'Plano não encontrado.'
    };
  }
  
  if (currentThemeCount >= status.plan.maxStrategicThemes) {
    return {
      canCreate: false,
      reason: `Limite de ${status.plan.maxStrategicThemes} temas estratégicos atingido para seu plano.`,
      limit: status.plan.maxStrategicThemes
    };
  }
  
  return {
    canCreate: true,
    limit: status.plan.maxStrategicThemes
  };
}

/**
 * Atualiza assinaturas expiradas
 */
export async function updateExpiredSubscriptions(): Promise<void> {
  try {
    const now = new Date();
    
    // Atualizar assinaturas em trial que expiraram
    await prisma.subscription.updateMany({
      where: {
        status: 'TRIAL',
        trialEndDate: {
          lt: now
        },
        isActive: true
      },
      data: {
        status: 'EXPIRED',
        isActive: false
      }
    });
    
    // Atualizar teams com trial expirado
    await prisma.team.updateMany({
      where: {
        trialEndsAt: {
          lt: now
        },
        isTrialActive: true
      },
      data: {
        isTrialActive: false
      }
    });
    
  } catch (error) {
    console.error('Erro ao atualizar assinaturas expiradas:', error);
  }
}

/**
 * Cria uma nova assinatura para um time
 */
export async function createTeamSubscription(teamId: string, planName: string): Promise<boolean> {
  try {
    const plan = await prisma.plan.findUnique({
      where: { name: planName }
    });
    
    if (!plan) {
      throw new Error(`Plano ${planName} não encontrado`);
    }
    
    // Desativar assinaturas antigas
    await prisma.subscription.updateMany({
      where: { teamId },
      data: { isActive: false }
    });
    
    // Criar nova assinatura
    const endDate = planName === 'FREE' ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    const trialEndDate = plan.trialDays > 0 ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : undefined;
    
    await prisma.subscription.create({
      data: {
        teamId,
        planId: plan.id,
        status: plan.trialDays > 0 ? 'TRIAL' : 'ACTIVE',
        endDate,
        trialEndDate,
        isActive: true
      }
    });
    
    // PRINCIPAL: Atualizar currentPlanId do team usando função dedicada
    await updateTeamPlan(teamId, plan.id);
    
    return true;
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return false;
  }
}

function getActionName(actionType: string): string {
  const names = {
    quickContentCreations: 'criações de conteúdo rápido',
    customContentSuggestions: 'sugestões de conteúdo personalizadas',
    contentPlans: 'planejamentos de conteúdo',
    contentReviews: 'revisões de conteúdo'
  };
  return names[actionType as keyof typeof names] || actionType;
}