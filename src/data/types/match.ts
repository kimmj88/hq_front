import type { Player } from './player';

export interface Match {
  id: number;
  name: string;
  type: string;
  match_members: MatchMember[];
  is_confirm: boolean;
  create_at: string;
  updated_at: string;
  winner_team: number;
}

export interface MatchMember {
  id: number;
  order: string;
  create_at: string;
  player: Player;
}
