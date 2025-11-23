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

  cup_matches: CupMatch[];
}

export interface CupTeam {
  id: number;
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

export interface CupMatch {
  id?: number;
  cup_id?: number;
  round?: string;
  match_no?: number;
  home_team?: CupTeam;
  away_team?: CupTeam;
  winner_team?: CupTeam;
}

export interface PositionPlayerList {
  key: string;
  players: Player[];
}
