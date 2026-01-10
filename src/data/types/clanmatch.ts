export type SlotKey = 'TOP' | 'JUG' | 'MID' | 'ADC' | 'SUP';
export type MatchStatus = 'WAITING' | 'MATCHED' | 'DONE' | 'CANCELLED';

export interface HostMember {
  id: number;
  nickname: string;
  tagname: string;
  tier: string;
  point: number;
}

export interface ClanMini {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// ✅ API 응답 item 형태
export interface ClanMatch {
  id: number;
  is_confirm: boolean;
  status: MatchStatus;
  match_at: string; // ISO
  winner_team: number | null;
  tier: number;
  created_at: string;
  updated_at: string;
  host_clan: ClanMini;
  guest_clan: ClanMini | null;
  host_member: Partial<Record<SlotKey, HostMember>>;
}
