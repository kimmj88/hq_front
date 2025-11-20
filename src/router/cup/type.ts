export const CUP_PATH = {
  BASE: '/cup/',
  ADD: '/cup/add',
  VIEW: (id: string | number = ':id') => `/cup/view/${id}`,
  BRACKET: (id: string | number = ':id') => `/cup/bracket/${id}`,
};
