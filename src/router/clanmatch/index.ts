export const CLAN_MATCH_PATH = {
  BASE: '/clanmatch/',
  ADD: '/clanmatch/add',
  ACCEPT: (id: string | number = ':id') => `/clanmatch/accept/${id}`,
  VIEW: (id: string | number = ':id') => `/clanmatch/view/${id}`,
};
