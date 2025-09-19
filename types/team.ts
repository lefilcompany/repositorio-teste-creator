export interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  trialDays: number;
  maxMembers: number;
  maxBrands: number;
  maxStrategicThemes: number;
  maxPersonas: number;
  quickContentCreations: number;
  customContentSuggestions: number;
  contentPlans: number;
  contentReviews: number;
  isActive: boolean;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  displayCode?: string;
  admin: string; // admin email
  members: string[];
  pending: string[];
  plan: Plan | null; // Novo: objeto Plan completo ou null
  credits?: {
    contentSuggestions: number;
    contentReviews: number;
    contentPlans: number;
  };
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