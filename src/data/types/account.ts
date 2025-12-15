import type { Clan } from './clan';
import type { Player } from './player';
import type { SystemRole } from './systemrole';

export interface Account {
  id: number;
  email: string;
  name: string;
  nickname: string;
  department: string;
  created_at: string;
  updated_at: string;
  avatar: string;
  systemrole: SystemRole;
  is_confirm: boolean;
  player: Player;
  clan: Clan;
}
