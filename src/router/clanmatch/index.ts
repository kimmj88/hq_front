export const CLAN_MATCH_PATH = {
  BASE: (name: string | number = ':name') => `/clan/${name}/clanmatch`,
  ADD: (name: string | number = ':name') => `/clan/${name}/clanmatch/add`,
  ACCEPT: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/clanmatch/accept/${id}`,
  VIEW: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/clanmatch/view/${id}`,
};
