import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert } from '@mui/material';
import { routePermission, useWorkerAccess } from '@/hooks/useWorkerAccess';
export function WorkerAccessBoundary({ children }: { children: ReactNode }) {
  const path = useLocation().pathname,
    can = useWorkerAccess(),
    permission = routePermission(path);
  return permission && !can(permission) ? (
    <Alert severity='info'>
      Este acceso está restringido para tu usuario. Selecciona otra opción del
      menú.
    </Alert>
  ) : (
    <>{children}</>
  );
}
