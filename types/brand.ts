export interface MoodboardFile {
  name: string; 
  type: string; 
  content: string;   
}

export interface Brand {
  id: string;
  teamId: string;
  userId: string;
  name: string;
  responsible: string;
  segment: string;
  values: string;
  keywords: string;
  goals: string;
  inspirations: string;
  successMetrics: string;
  references: string;
  specialDates: string;
  sectorRestrictions: string;
  promise: string;
  crisisInfo: string;
  milestones: string;
  collaborations: string;
  restrictions: string;
  moodboard: MoodboardFile | null;
  createdAt: string;
  updatedAt: string;
}