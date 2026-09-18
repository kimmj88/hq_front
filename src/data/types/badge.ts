export interface Season {
  id: number;
  code: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
}
export interface BadgeMaster {
  id: number;
  code: string;
  name: string;
  description: string;
  icon_image_url: string | null;
  frame_image_url: string;
  frame_image_name?: string | null;
  frame_slice: number;
  frame_width: number;
  is_active: boolean;
}
export interface AccountBadge {
  id: number;
  badge: BadgeMaster;
  season: Season;
  earned_at: string;
  revoked_at: string | null;
  reason?: string;
  revoke_reason?: string | null;
}
export interface EquippedBadge {
  account_badge_id: number;
  name: string;
  season_name: string;
  season_code: string;
  icon_image_url: string | null;
  frame_image_url: string;
  frame_slice: number;
  frame_width: number;
}
export interface BadgeCatalog { badges: BadgeMaster[]; seasons: Season[] }
export interface BadgeCollection { items: AccountBadge[]; equipped_id: number | null }
