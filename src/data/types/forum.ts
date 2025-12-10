import type { Account } from './account';

export interface Forum {
  id: number;
  title: string;
  description: Text;
  type: string;
  account: Account;
  view_cnt: number;
  comment_cnt: number;
  created_at: string;
  updated_at: string;
}
