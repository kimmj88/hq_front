import type { SystemRole } from './systemrole';

export interface Account {
  id: number;
  email: string;
  name: string;
  department: string;
  created_at: string;
  updated_at: string;
  avatar: string;
  systemrole: SystemRole;
}
