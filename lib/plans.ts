export type PlanKey = 'TRIAL' | 'BASIC' | 'PRO';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface PlanLimits {
  members: number;
  brands: number;
  themes: number;
  personas: number;
  contentSuggestions: number;
  customCreations: number;
  contentPlans: number;
  contentReviews: number;
}

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  price: string;
  description?: string;
  isTrial?: boolean;
  trialDays?: number;
  limits: PlanLimits;
}

export interface PlanSnapshot {
  key: PlanKey;
  name: string;
  price: string;
  description?: string;
  isTrial?: boolean;
  trialDays?: number;
  limits: PlanLimits & {
    calendars: number;
  };
}

export interface TeamCredits {
  contentSuggestions: number;
  customCreations: number;
  contentPlans: number;
  contentReviews: number;
}

export const PLAN_KEYS: PlanKey[] = ['TRIAL', 'BASIC', 'PRO'];

export function resolvePlanKey(planKey?: string | null, planName?: string | null): PlanKey {
  if (planKey && PLAN_KEYS.includes(planKey as PlanKey)) {
    return planKey as PlanKey;
  }

  const normalizedName = (planName || '').toLowerCase();
  if (normalizedName.includes('pro')) return 'PRO';
  if (normalizedName.includes('básico') || normalizedName.includes('basico') || normalizedName.includes('basic')) return 'BASIC';
  return 'TRIAL';
}

const PLAN_DEFINITIONS: Record<PlanKey, PlanDefinition> = {
  TRIAL: {
    key: 'TRIAL',
    name: 'Plano Free',
    price: 'Grátis por 14 dias',
    description: 'Experimente todos os recursos essenciais do Creator gratuitamente por 14 dias.',
    isTrial: true,
    trialDays: 14,
    limits: {
      members: 5,
      brands: 1,
      themes: 3,
      personas: 3,
      contentSuggestions: 5,
      customCreations: 15,
      contentPlans: 5,
      contentReviews: 10,
    },
  },
  BASIC: {
    key: 'BASIC',
    name: 'Plano Básico',
    price: 'R$ 59,90/mês',
    description: 'Ideal para pequenas equipes que precisam produzir conteúdo com consistência.',
    limits: {
      members: 10,
      brands: 5,
      themes: 15,
      personas: 15,
      contentSuggestions: 7,
      customCreations: 20,
      contentPlans: 7,
      contentReviews: 15,
    },
  },
  PRO: {
    key: 'PRO',
    name: 'Plano Pro',
    price: 'R$ 99,90/mês',
    description: 'Para squads de marketing que precisam de alto volume de produção e colaboração.',
    limits: {
      members: 20,
      brands: 10,
      themes: 30,
      personas: 30,
      contentSuggestions: 10,
      customCreations: 30,
      contentPlans: 10,
      contentReviews: 25,
    },
  },
};

export const AVAILABLE_PLANS: PlanDefinition[] = [
  PLAN_DEFINITIONS.TRIAL,
  PLAN_DEFINITIONS.BASIC,
  PLAN_DEFINITIONS.PRO,
];

export function getPlanDefinition(planKey: PlanKey): PlanDefinition {
  return PLAN_DEFINITIONS[planKey];
}

export function buildPlanSnapshot(plan: PlanDefinition): PlanSnapshot {
  return {
    key: plan.key,
    name: plan.name,
    price: plan.price,
    description: plan.description,
    isTrial: plan.isTrial,
    trialDays: plan.trialDays,
    limits: {
      ...plan.limits,
      calendars: plan.limits.contentPlans,
    },
  };
}

export function getDefaultCredits(plan: PlanDefinition): TeamCredits {
  return {
    contentSuggestions: plan.limits.contentSuggestions,
    customCreations: plan.limits.customCreations,
    contentPlans: plan.limits.contentPlans,
    contentReviews: plan.limits.contentReviews,
  };
}

export function calculateTrialEndDate(plan: PlanDefinition, startDate = new Date()): Date | null {
  if (!plan.isTrial || !plan.trialDays) return null;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.trialDays);
  return endDate;
}

export function isTrialExpired(trialEndsAt?: string | Date | null): boolean {
  if (!trialEndsAt) return false;
  const trialDate = typeof trialEndsAt === 'string' ? new Date(trialEndsAt) : trialEndsAt;
  if (Number.isNaN(trialDate.getTime())) return false;
  const now = new Date();
  return trialDate.getTime() < now.getTime();
}
