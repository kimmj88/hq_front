export const BOARD_PATH = {
  BASE: '/board/',
  ADD: '/board/add',
  VIEW: (id: string | number = ':id') => `/board/view/${id}`,
  EDIT: (id: string | number = ':id') => `/board/edit/${id}`,
};
