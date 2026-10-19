import { ReactNode } from 'react';
import { Alert, Button } from '@mui/material';
import { RouteLoading } from '@/components/ui/RouteLoading';
import { useMenu } from '@/hooks/useMenu';
import { useProductionAreas } from '../Restaurant/hooks/useProductionArea';
import { useTables } from '../Tables/hooks/useTables';
import { useOnTableUpdated } from '../Tables/hooks/useOnWebSocketsEventsTables';
import { useActiveOrders } from '../Orders/hooks/useOrders';
import {
  useOnOrderCreated,
  useOnOrderDeleted,
  useOnOrderUpdated
} from '../Orders/hooks/useOnWebSocketsEventsOrders';

/** Retain the historical CRUD stores without making operational routes wait for them. */
export default function LegacyWorkspaceData({
  children
}: {
  children: ReactNode;
}) {
  const menu = useMenu();
  const areas = useProductionAreas();
  const { activeOrdersQuery: orders } = useActiveOrders();
  const { tablesQuery: tables } = useTables();
  useOnTableUpdated();
  useOnOrderCreated();
  useOnOrderUpdated();
  useOnOrderDeleted();
  const queries = [menu, areas, orders, tables];
  const failed = queries.some((query) => query.isError);
  const missingSnapshot = queries.some((query) => query.data === undefined);
  const failure = (
    <Alert
      severity='error'
      action={
        <Button
          onClick={() => queries.forEach((query) => void query.refetch())}
        >
          Reintentar
        </Button>
      }
    >
      No se pudieron cargar los datos de esta sección. Puedes reintentar o
      navegar a otra sección; no se modificó ninguna operación.
    </Alert>
  );
  if (missingSnapshot) return failed ? failure : <RouteLoading />;
  // Background failures must not unmount a form or discard user input.
  return (
    <>
      {failed && failure}
      {children}
    </>
  );
}
