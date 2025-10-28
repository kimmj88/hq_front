import type { Tier } from './tier';

export interface Player {
  id: number;
  nickname: string;
  tagname: string;
  point: number;
  create_at: string;
  tier: Tier;
}
