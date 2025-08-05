export interface Team {
  id: string;
  name: string;
  code: string;
  admin: string; // admin email
  members: string[];
  pending: string[];
  plan: {
    name: string;
    limits: {
      members: number;
      brands: number;
      themes: number;
      personas: number;
      calendars: number;
      contentSuggestions: number;
      contentReviews: number;
    };
  };
  credits: {
    contentSuggestions: number;
    contentReviews: number;
    contentPlans: number;
  };
}