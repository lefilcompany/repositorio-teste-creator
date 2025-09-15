import type { ColorItem } from './brand';

export type StrategicTheme = {
  id: string;
  teamId: string;
  userId: string;
  brandId: string;
  title: string;
  description: string;
  colorPalette: string;
  toneOfVoice: string;
  targetAudience: string;
  hashtags: string;
  objectives: string;
  contentFormat: string;
  macroThemes: string;
  bestFormats: string;
  platforms: string;
  expectedAction: string;
  additionalInfo: string;
  createdAt: string;
  updatedAt: string;
};

// Dados mínimos utilizados nas listagens de temas
export type StrategicThemeSummary = Pick<StrategicTheme, 'id' | 'brandId' | 'title' | 'createdAt'>;