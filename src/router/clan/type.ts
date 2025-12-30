export const CLAN_PATH = {
  BASE: '/clan/',
  VIEW: (name: string | number = ':name') => `/clan/${name}`,
  PLAYER: (name: string | number = ':name') => `/clan/${name}/player`,
  SETTING: (name: string | number = ':name') => `/clan/${name}/setting`,
  ACCOUNT: (name: string | number = ':name') => `/clan/${name}/account`,
  ACCOUNT_VIEW: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/account/view/${id}`,
  PERMISSION: (name: string | number = ':name') => `/clan/${name}/permission`,
  NOTICE: (name: string | number = ':name') => `/clan/${name}/notice`,
  NOTICE_ADD: (name: string | number = ':name') => `/clan/${name}/notice/add`,
  NOTICE_VIEW: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/notice/view/${id}`,
  NOTICE_EDIT: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/notice/edit/${id}`,
  ENQUIRE: (name: string | number = ':name') => `/clan/${name}/enquire`,
  ENQUIRE_ADD: (name: string | number = ':name') => `/clan/${name}/enquire/add`,
  ENQUIRE_VIEW: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/enquire/view/${id}`,
  MATCH: (name: string | number = ':name') => `/clan/${name}/match`,
  MATCH_ADD: (name: string | number = ':name') => `/clan/${name}/match/add`,
  MATCH_VIEW: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/match/view/${id}`,
  CUP: (name: string | number = ':name') => `/clan/${name}/cup`,
  CUP_ADD: (name: string | number = ':name') => `/clan/${name}/cup/add`,
  CUP_VIEW: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/cup/view/${id}`,
  CUP_BRACKET: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/cup/bracket/${id}`,
};
