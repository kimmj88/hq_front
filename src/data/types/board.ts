import type { Account } from './account';

export interface Board {
  id: number;
  title: string;
  description: Text;
  type: string;
  notice_type?: 'URGENT' | 'EVENT' | 'GENERAL' | 'PATCH_NOTE';
  account: Account;
  created_at: string;
  updated_at: string;
  attachments: File[];
  is_pin: boolean;
}
