export const FORUM_PATH = {
  BASE: '/forum/',
  ADD: '/forum/add',
  VIEW: (id: string | number = ':id') => `/forum/view/${id}`,
  EDIT: (id: string | number = ':id') => `/forum/edit/${id}`,
};
