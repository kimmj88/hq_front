export type AuctionRoomStatus = 'RECRUITING' | 'POINT_SETTING' | 'IN_PROGRESS' | 'FINISHED';

export interface AuctionParticipant {
  accountId: number;
  nickname: string;
  joinedAt: string;
  isCaptain: boolean;
  teamIndex: number | null;
  auctionPoints: number | null;
  attendedAt: string | null;
  player: {
    id: number;
    nickname: string;
    tagname: string;
    tierName: string;
    position: string;
    positions: string[];
    cupCount: number;
    subCupCount: number;
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
  isBlind: boolean;
  teamCount: number;
  scheduledAt: string;
  status: AuctionRoomStatus;
  ownerId: number;
  ownerNickname: string;
  winnerCaptainAccountId: number | null;
  participants: AuctionParticipant[];
  createdAt: string;
}
