import type { Account } from './account';

export interface Comment {
  id: number;
  content: string;
  account: Account;
  created_at: string;
  updated_at: string;
}
