import type { Position } from './position';
import type { Tier } from './tier';

export interface Player {
  id: number;
  avatar?: string | null;
  nickname: string;
  tagname: string;
  point: number;
  created_at: string;
  /** 이전 응답 호환용 */
  create_at?: string;
  tier: Tier | null;
  custom_tier: Tier | null;
  positions: Position[];
  is_active: boolean;
  cupmember_id: number;
  cup_count: number;
  sub_cup_count: number;
  clan_tier: Tier | null;
}
