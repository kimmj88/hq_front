import type { Clan } from './clan';
import type { ClanRole } from './clanrole';
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
  shop_coin?: number;
  auction_avatar_effect_expires_at?: string | null;
  match_avatar_effect_expires_at?: string | null;
  party_avatar_effect_expires_at?: string | null;
  systemrole: SystemRole;
  is_confirm: boolean;
  player: Player;
  clan: Clan;
  clanrole: ClanRole;
}
