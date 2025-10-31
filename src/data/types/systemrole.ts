export interface SystemRole {
  id?: number;
  name?: string;
  permissionGroups?: GroupPermission[];
  created_at?: string;
  updated_at?: string;
}

export interface ProjectRole {
  id?: number;
  name?: string;
  permissionGroups?: GroupPermission[];
  created_at?: string;
  updated_at?: string;
}

interface GroupPermission {
  code: string;
  order: number;
  children: Permission[];
}
export interface PermissionGroup {
  code: string;
  order: number;
  children: { code: string; order: number; access: boolean }[];
}

interface Permission {
  code: string;
  order: number;
  access: boolean;
}
