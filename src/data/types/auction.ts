export type AuctionRoomStatus = 'RECRUITING' | 'POINT_SETTING' | 'IN_PROGRESS' | 'FINISHED';

export interface AuctionParticipant {
  accountId: number;
  nickname: string;
  joinedAt: string;
  isCaptain: boolean;
  auctionPoints: number | null;
  player: {
    id: number;
    nickname: string;
    tagname: string;
    tierName: string;
    position: string;
    positions: string[];
  } | null;
  teamCaptainAccountId: number | null;
  winningBid: number | null;
  isUnsold: boolean;
}

export interface AuctionRoom {
  id: number;
  clanName: string;
  title: string;
  description: string;
  maxParticipants: number;
  bidSeconds: number;
  teamCount: number;
  scheduledAt: string;
  status: AuctionRoomStatus;
  ownerId: number;
  ownerNickname: string;
  participants: AuctionParticipant[];
  createdAt: string;
}
