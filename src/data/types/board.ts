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
  calendar_enabled?: boolean;
  calendar_starts_at?: string;
  calendar_ends_at?: string;
  calendar_is_all_day?: boolean;
  calendar_location?: string;
  calendar_discord_url?: string;
}
