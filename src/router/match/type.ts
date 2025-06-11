export const MATCH_PATH = {
  BASE: "/match/",
  ADD: "/match/add",
  VIEW: (id: string | number = ":id") => `/match/view/${id}`,
  //MEMBER: (id: string | number = ":id") => `/project/view/${id}/member`,
  //DRAFT: (id: string | number = ":id") => `/project/view/${id}/draft`,
  //DRAFT_ADD: (id: string | number = ":id") => `/project/view/${id}/draft/add`,
  //LOG: (id: string | number = ":id") => `/project/view/${id}/log`,
};
