export type AppRole = 'owner' | 'admin' | 'researcher' | 'individual';

export type Permission =
  | 'org.read'
  | 'org.create'
  | 'org.update'
  | 'org.delete'
  | 'user.read'
  | 'settings:manage'
  | 'predict.run'
  | 'predict.batch'
  | 'model.read'
  | 'research.read';

const OWNER_PERMISSIONS: Permission[] = [
  'org.read',
  'org.create',
  'org.update',
  'org.delete',
  'user.read',
  'settings:manage',
  'predict.run',
  'predict.batch',
  'model.read',
  'research.read',
];

const ADMIN_PERMISSIONS: Permission[] = [
  'org.read',
  'org.update',
  'user.read',
  'settings:manage',
  'predict.run',
  'predict.batch',
  'model.read',
  'research.read',
];

const RESEARCHER_PERMISSIONS: Permission[] = [
  'org.read',
  'predict.run',
  'predict.batch',
  'model.read',
  'research.read',
];

const INDIVIDUAL_PERMISSIONS: Permission[] = ['org.read', 'predict.run', 'research.read'];

/** Maps platform roles to permission scopes — mirrors backend ROLE_PERMISSIONS. */
export function mapRoleToPermissions(role: AppRole): Permission[] {
  switch (role) {
    case 'owner':
      return OWNER_PERMISSIONS;
    case 'admin':
      return ADMIN_PERMISSIONS;
    case 'researcher':
      return RESEARCHER_PERMISSIONS;
    case 'individual':
      return INDIVIDUAL_PERMISSIONS;
    default:
      return [];
  }
}

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return mapRoleToPermissions(role).includes(permission);
}
