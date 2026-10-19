import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { WorkspaceEmpty } from '@/components/operational/WorkspaceEmpty';
import { useCallback, useState } from 'react';
import { Alert, Button, Card, Chip, Stack, Typography } from '@mui/material';
import { restauranteApi } from '@/api';
import { Account, Operator } from './types';
import { modalityLabel, paymentLabel } from './OffsitePanel';
import { DeliveryProgress } from './DeliveryProgress';
import { Dispatch } from './fulfillment.types';
interface Delivery {
  customerName: string;
  phone: string;
  address: string;
  status: string;
}
const stateNames: Record<string, string> = {
  PREPARING: 'Preparación',
  READY: 'Listo para despacho',
  DISPATCHED: 'Despachado',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado'
};
function OffsiteCard({
  account,
  operators,
  onSelect
}: {
  account: Account;
  operators: Operator[];
  onSelect: (id: string) => void;
}) {
  const [view, setView] = useState<{ delivery: Delivery | null }>(),
    [pending, setPending] = useState<boolean>(),
    [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    try {
      const [v, d] = await Promise.all([
        restauranteApi.get<{ delivery: Delivery | null }>(
          `/offsite/accounts/${account.id}`
        ),
        restauranteApi.get<Dispatch[]>(
          `/attention-accounts/${account.id}/dispatches`
        )
      ]);
      setView(v.data);
      setPending(d.data.some((x) => x.pending));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [account.id]);
  useLiveRefresh(
    load,
    ['attention.changed', 'finance.changed', 'kitchen.changed'],
    String(account.version)
  );
  return (
    <Card variant='outlined' className='pos-delivery-card'>
      <Typography fontWeight={700}>
        {modalityLabel[account.modality]}
      </Typography>
      {failed ? (
        <Alert severity='warning'>
          Información posiblemente desactualizada
        </Alert>
      ) : (
        <>
          <Typography>
            {view?.delivery?.customerName || 'Sin nombre registrado'}
          </Typography>
          <Typography variant='body2'>
            {view?.delivery?.phone} {view?.delivery?.address}
          </Typography>
          <Typography variant='body2'>
            Cocina:{' '}
            {pending === undefined
              ? 'Consultando…'
              : pending
                ? 'Producción pendiente'
                : 'Sin producción pendiente'}
          </Typography>
          {view?.delivery && (
            <DeliveryProgress
              status={view.delivery.status}
              takeaway={account.modality === 'TAKE_AWAY'}
            />
          )}
          <Chip
            size='small'
            label={`Entrega: ${view ? stateNames[view.delivery?.status || 'PREPARING'] : 'Consultando…'}`}
          />
        </>
      )}
      <Typography variant='caption' color='text.secondary'>
        Entrega y pago son estados independientes.
      </Typography>
      <Typography variant='body2'>
        Pago: {paymentLabel[account.paymentStatus] || account.paymentStatus} ·
        Saldo S/ {account.balance}
      </Typography>
      <Typography variant='body2'>
        Responsable:{' '}
        {operators.find((o) => o.id === account.responsibleUserId)?.firstName ||
          'Responsable asignado'}
      </Typography>
      <Button onClick={() => onSelect(account.id)}>Ver atención</Button>
    </Card>
  );
}
export function OffsiteCards({
  accounts,
  operators,
  onSelect
}: {
  accounts: Account[];
  operators: Operator[];
  onSelect: (id: string) => void;
}) {
  const [page, setPage] = useState(0),
    [mode, setMode] = useState('');
  const rows = accounts.filter(
    (a) =>
      a.modality !== 'TABLE' &&
      a.attentionStatus === 'OPEN' &&
      (!mode || a.modality === mode)
  );
  return (
    <section>
      <Typography variant='h6'>Delivery · atenciones activas</Typography>
      <Stack direction='row' gap={1} flexWrap='wrap' mb={1}>
        {[
          '',
          'OWN_DELIVERY',
          'EXTERNAL_COURIER',
          ...(accounts.some(
            (a) => a.modality === 'TAKE_AWAY' && a.attentionStatus === 'OPEN'
          )
            ? ['TAKE_AWAY']
            : [])
        ].map((m) => (
          <Chip
            key={m}
            clickable
            color={mode === m ? 'primary' : 'default'}
            label={
              m === 'TAKE_AWAY'
                ? 'Recogidas existentes'
                : modalityLabel[m] || 'Todos'
            }
            onClick={() => {
              setMode(m);
              setPage(0);
            }}
          />
        ))}
      </Stack>
      <div className='offsite-list'>
        {rows.slice(page * 6, page * 6 + 6).map((a) => (
          <OffsiteCard
            key={a.id}
            account={a}
            operators={operators}
            onSelect={onSelect}
          />
        ))}
      </div>
      {!rows.length && (
        <WorkspaceEmpty
          title='Sin atenciones en esta modalidad'
          description='Al abrir un delivery aparecerán aquí su preparación, entrega y pago.'
        />
      )}
      {rows.length > 6 && (
        <Stack direction='row'>
          <Button disabled={!page} onClick={() => setPage((p) => p - 1)}>
            Anteriores
          </Button>
          <Typography>Página {page + 1}</Typography>
          <Button
            disabled={(page + 1) * 6 >= rows.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguientes
          </Button>
        </Stack>
      )}
    </section>
  );
}
