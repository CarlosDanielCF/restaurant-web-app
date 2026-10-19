import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux';
export const permissionLabels: Record<string, string> = {
  attention: 'Atención y mesas',
  reservations: 'Reservas',
  delivery: 'Delivery y para llevar',
  finance: 'Cobros, fiados y rendiciones',
  reports: 'Reportes autorizados por el rol',
  documents: 'Documentos internos',
  kitchen: 'Cocina',
  'catalog.manage': 'Editar carta y menú',
  'availability.manage': 'Cambiar disponibilidad',
  configuration: 'Configuración',
  workers: 'Administrar trabajadores',
  'tables.manage': 'Gestionar mesas',
  clients: 'Clientes',
  history: 'Pedidos históricos'
};
export function useWorkerAccess() {
  const user = useSelector(selectAuth).user;
  return (permission: string) => !user?.deniedPermissions?.includes(permission);
}
export function routePermission(path: string): string | undefined {
  const root = path.split('/')[1];
  return (
    {
      attention: 'attention',
      finance: 'finance',
      kitchen: 'kitchen',
      'internal-documents': 'documents',
      'operational-reports': 'reports',
      'operational-overview': 'reports',
      restaurant: 'configuration',
      supplies: 'configuration',
      users: 'workers',
      tables: 'tables.manage',
      clients: 'clients',
      orders: 'history',
      menu: 'catalog.manage'
    } as Record<string, string>
  )[root];
}
