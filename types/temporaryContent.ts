export interface TemporaryContent {
  id: string;
  userId: string;
  teamId: string;
  actionId: string;
  imageUrl: string;
  title: string;
  body: string;
  hashtags: string[] | any;
  revisions: number;
  brand?: string | null;
  theme?: string | null;
  originalId?: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}
