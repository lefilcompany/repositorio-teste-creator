export interface User {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  state?: string;
  city?: string;
  teamId?: string | null;
  role?: 'admin' | 'member';
  status?: 'active' | 'pending';
}