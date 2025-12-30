import type { Position } from './position';
import type { Tier } from './tier';

export interface Player {
  id: number;
  nickname: string;
  tagname: string;
  point: number;
  create_at: string;
  tier: Tier;
  positions: Position;
  is_active: boolean;
  cupmember_id: number;
  cup_count: number;
  sub_cup_count: number;
  clan_tier: Tier;
}
