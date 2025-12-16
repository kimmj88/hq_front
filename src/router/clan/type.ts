export const CLAN_PATH = {
  BASE: '/clan/',
  VIEW: (name: string | number = ':name') => `/clan/${name}`,
  PLAYER: (name: string | number = ':name') => `/clan/${name}/player`,
  ACCOUNT: (name: string | number = ':name') => `/clan/${name}/account`,
  ACCOUNT_VIEW: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/account/view/${id}`,
  PERMISSION: (name: string | number = ':name') => `/clan/${name}/permission`,
  NOTICE: (name: string | number = ':name') => `/clan/${name}/notice`,
  NOTICE_ADD: (name: string | number = ':name') => `/clan/${name}/notice/add`,
  NOTICE_VIEW: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/notice/view/${id}`,
  ENQUIRE: (name: string | number = ':name') => `/clan/${name}/enquire`,
  ENQUIRE_ADD: (name: string | number = ':name') => `/clan/${name}/enquire/add`,
  ENQUIRE_VIEW: (name: string | number = ':name', id: string | number = ':id') =>
    `/clan/${name}/enquire/view/${id}`,
};
