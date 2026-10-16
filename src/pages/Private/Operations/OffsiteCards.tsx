import { useEffect, useState } from 'react';
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
  useEffect(() => {
    let active = true;
    const load = () =>
      Promise.all([
        restauranteApi.get<{ delivery: Delivery | null }>(
          `/offsite/accounts/${account.id}`
        ),
        restauranteApi.get<Dispatch[]>(
          `/attention-accounts/${account.id}/dispatches`
        )
      ])
        .then(([v, d]) => {
          if (active) {
            setView(v.data);
            setPending(d.data.some((x) => x.pending));
            setFailed(false);
          }
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [account.id, account.version]);
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
                ? 'Comida pendiente'
                : 'Sin comida pendiente'}
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
          account.responsibleUserId}
      </Typography>
      <Button onClick={() => onSelect(account.id)}>
        Ver atención {account.id.slice(0, 8)}
      </Button>
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
      <Typography variant='h6'>Para llevar y delivery</Typography>
      <Stack direction='row' gap={1} flexWrap='wrap' mb={1}>
        {['', 'TAKE_AWAY', 'OWN_DELIVERY', 'EXTERNAL_COURIER'].map((m) => (
          <Chip
            key={m}
            clickable
            color={mode === m ? 'primary' : 'default'}
            label={modalityLabel[m] || 'Todos'}
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
        <Typography color='text.secondary'>
          No hay atenciones abiertas en esta modalidad.
        </Typography>
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
