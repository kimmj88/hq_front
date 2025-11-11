import type { Player } from './player';

export interface Cup {
  id: number;
  name: string;
  type: string;
  cup_members: CupMember[];
  is_confirm: boolean;
  create_at: string;
  updated_at: string;
}

export interface CupMember {
  id: number;
  order: string;
  create_at: string;
  player: Player;
}
