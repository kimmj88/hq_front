import type { Account } from './account';

export interface Board {
  id: number;
  title: string;
  description: string;
  type: string;
  account: Account;
  created_at: string;
  updated_at: string;
  attachments: File[];
}
