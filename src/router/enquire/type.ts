export const ENQUIRE_PATH = {
  BASE: '/enquire/',
  ADD: '/enquire/add',
  VIEW: (id: string | number = ':id') => `/enquire/view/${id}`,
  EDIT: (id: string | number = ':id') => `/enquire/edit/${id}`,
};
