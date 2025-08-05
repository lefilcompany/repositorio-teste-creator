export interface Team {
  id: string;
  name: string;
  code: string;
  admin: string; // admin email
  members: string[];
  pending: string[];
}
