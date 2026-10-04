import { can as canClan } from '@/stores/useClanPermissionStore';
import { can as canSystem } from '@/stores/usePermissionStore';

const GROUP = 'CLANMATCH';

export function canReadClanMatch() {
  return (
    canClan(GROUP, 'CLAN-SET-CLANMATCH-R') ||
    canSystem(GROUP, 'SYS-SET-CLANMATCH-R')
  );
}

export function canCreateClanMatch() {
  return (
    canClan(GROUP, 'CLAN-SET-CLANMATCH-C') ||
    canSystem(GROUP, 'SYS-SET-CLANMATCH-C')
  );
}

export function canSystemCreateClanMatch() {
  return canSystem(GROUP, 'SYS-SET-CLANMATCH-C');
}

export function canUpdateClanMatch() {
  return (
    canClan(GROUP, 'CLAN-SET-CLANMATCH-U') ||
    canSystem(GROUP, 'SYS-SET-CLANMATCH-U')
  );
}

export function canDeleteClanMatch() {
  return (
    canClan(GROUP, 'CLAN-SET-CLANMATCH-D') ||
    canSystem(GROUP, 'SYS-SET-CLANMATCH-D')
  );
}

export function canSystemUpdateClanMatch() {
  return canSystem(GROUP, 'SYS-SET-CLANMATCH-U');
}

export function canSystemDeleteClanMatch() {
  return canSystem(GROUP, 'SYS-SET-CLANMATCH-D');
}
