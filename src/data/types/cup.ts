import type { Player } from './player';

export interface Cup {
  id: number;
  name: string;
  type: string;
  cup_teams: CupTeam[];
  cup_members: CupMember[];
  is_confirm: boolean;
  team_count: number;

  create_at: string;
  updated_at: string;

  position_players?: PositionPlayerList[];
}

export interface CupTeam {
  key: string;
  name: string;
  cup_members: CupMember[];
}

export interface CupMember {
  id: number;
  order: string;
  create_at: string;
  player: Player;
}

export interface PositionPlayerList {
  key: string;
  players: Player[];
}
