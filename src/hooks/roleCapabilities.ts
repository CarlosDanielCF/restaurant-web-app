/** UI presentation of base-role scopes. Server authorization remains authoritative. */
const service = [
  'attention',
  'reservations',
  'delivery',
  'finance',
  'reports',
  'documents',
  'clients',
  'history'
];
const management = [
  ...service,
  'kitchen',
  'catalog.manage',
  'availability.manage',
  'configuration',
  'workers',
  'tables.manage'
];
export function permissionsForRole(role: string): string[] {
  if (role === 'ADMINISTRADOR') return [...management];
  if (role === 'MOZO') return [...service];
  if (role === 'COCINERO')
    return ['kitchen', 'catalog.manage', 'availability.manage', 'reports'];
  // The owner cannot be restricted. Unknown roles never acquire capabilities.
  return [];
}
