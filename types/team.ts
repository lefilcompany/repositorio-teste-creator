import type { PlanKey, PlanSnapshot, SubscriptionStatus, TeamCredits } from '@/lib/plans';

export interface Team {
  id: string;
  name: string;
  code: string;
  displayCode?: string;
  admin: string; // admin email
  members: string[];
  pending: string[];
  plan: string | PlanSnapshot;
  planKey?: PlanKey;
  subscriptionStatus?: SubscriptionStatus;
  trialEndsAt?: string | null;
  credits?: TeamCredits;
}

export interface TeamSummary {
  id: string;
  name: string;
  code: string;
  plan: Team['plan'];
  credits?: Team['credits'];
  totalBrands: number;
  totalContents: number;
}