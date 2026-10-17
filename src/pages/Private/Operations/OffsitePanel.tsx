import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import './cycle2.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Chip,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectAuth } from '@/redux';
import { restauranteApi } from '@/api';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { Account } from './types';
import { Run } from './Operations.page';
export const modalityLabel: Record<string, string> = {
  TABLE: 'MESA',
  TAKE_AWAY: 'PARA LLEVAR',
  OWN_DELIVERY: 'DELIVERY PROPIO',
  EXTERNAL_COURIER: 'COURIER EXTERNO'
};
export const paymentLabel: Record<string, string> = {
  UNPAID: 'Pendiente',
  PARTIAL: 'Pago parcial',
  SETTLED: 'Saldado',
  CREDIT: 'Saldo a favor'
};
interface Details {
  customerName: string;
  phone: string;
  address: string;
  reference: string;
  courierId?: string;
  status: string;
}
interface View {
  delivery: Details | null;
  cash: {
    id: string;
    pendingAmount: string;
    appliedAmount: string;
    courierId: string;
  }[];
  receipts: {
    id: string;
    amount: string;
    recipientId: string;
    createdAt: string;
  }[];
}
export function OffsitePanel({ account, run }: { account: Account; run: Run }) {
  const zone =
    useRestaurantStore((s) => s.restaurant?.timeZone) || 'America/Lima';
  const user = useSelector(selectAuth).user;
  const [data, setData] = useState<View>(),
    [couriers, setCouriers] = useState<
      { id: string; name: string; kind: string }[]
    >([]),
    [shift, setShift] = useState(''),
    [error, setError] = useState('');
  const [fields, setFields] = useState({
      customerName: '',
      phone: '',
      address: '',
      reference: '',
      courierId: ''
    }),
    [reason, setReason] = useState(''),
    [courierName, setCourierName] = useState(''),
    [courierPhone, setCourierPhone] = useState(''),
    [amount, setAmount] = useState(''),
    [custody, setCustody] = useState('');
  const [refresh, setRefresh] = useState(0);
  const reconcile = useCallback(() => {
    setRefresh((v) => v + 1);
  }, []);
  useLiveRefresh(reconcile, ['attention.changed', 'finance.changed']);
  const initialized = useRef('');
  useEffect(() => {
    let active = true;
    Promise.all([
      restauranteApi.get<View>(`/offsite/accounts/${account.id}`),
      restauranteApi.get<typeof couriers>('/offsite/couriers'),
      restauranteApi.get<
        { shift: { id: string; workerId: string; status: string } }[]
      >('/finance/shifts')
    ])
      .then(([v, c, s]) => {
        if (!active) return;
        setError('');
        setData(v.data);
        setCouriers(c.data);
        setShift(
          s.data.find(
            (s) => s.shift.workerId === user?.id && s.shift.status === 'OPEN'
          )?.shift.id || ''
        );
        if (initialized.current !== account.id) {
          initialized.current = account.id;
          const d = v.data.delivery;
          if (d)
            setFields({
              customerName: d.customerName,
              phone: d.phone,
              address: d.address,
              reference: d.reference,
              courierId: d.courierId || ''
            });
        }
      })
      .catch(() => {
        if (active) {
          setData(undefined);
          setError('No se pudieron actualizar los datos de entrega.');
        }
      });
    return () => {
      active = false;
    };
  }, [account.id, account.version, user?.id, refresh]);
  const base = `/offsite/accounts/${account.id}`;
  const states: Record<string, string[]> =
    account.modality === 'TAKE_AWAY'
      ? { PREPARING: ['READY', 'CANCELLED'], READY: ['DELIVERED', 'CANCELLED'] }
      : {
          PREPARING: ['READY', 'CANCELLED'],
          READY: ['DISPATCHED', 'CANCELLED'],
          DISPATCHED: ['IN_TRANSIT'],
          IN_TRANSIT: ['DELIVERED']
        };
  const labels: Record<string, string> = {
    PREPARING: 'Preparación',
    READY: 'Listo para despacho',
    DISPATCHED: 'Despachado',
    IN_TRANSIT: 'En camino',
    DELIVERED: 'Entregado',
    CANCELLED: 'Entrega cancelada'
  };
  return (
    <Card className='offsite-operation'>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant='h5'>
            {modalityLabel[account.modality]} · envío gratuito
          </Typography>
          {error && <Alert severity='error'>{error}</Alert>}
          <Alert severity='info'>
            Entrega, salida de cocina, pago y atención son independientes.
            Marcar entregado no registra dinero ni cierra la cuenta.
          </Alert>
          <Typography>
            Estado: {labels[data?.delivery?.status || 'PREPARING']} · saldo S/
            {account.balance}
          </Typography>
          <Stack
            direction='row'
            gap={1}
            flexWrap='wrap'
            className='offsite-states'
          >
            <Chip
              label={`Entrega: ${labels[data?.delivery?.status || 'PREPARING']}`}
              color='primary'
              variant='outlined'
            />
            <Chip
              label={`Pago: ${paymentLabel[account.paymentStatus] || account.paymentStatus} · saldo S/ ${account.balance}`}
              variant='outlined'
            />
            <Chip
              label={`Atención: ${account.attentionStatus === 'OPEN' ? 'Abierta' : 'Cerrada'}`}
              variant='outlined'
            />
          </Stack>
          {data?.delivery && (
            <Stack className='offsite-contact'>
              <Typography fontWeight={700}>
                {data.delivery.customerName || 'Sin nombre registrado'}
              </Typography>
              <Typography>{data.delivery.phone}</Typography>
              <Typography>{data.delivery.address}</Typography>
              <Typography variant='caption'>
                {data.delivery.reference}
              </Typography>
            </Stack>
          )}
          <div className='offsite-fields'>
            {(['customerName', 'phone', 'address', 'reference'] as const).map(
              (key) => (
                <TextField
                  key={key}
                  label={
                    {
                      customerName: 'Nombre de quien recibe',
                      phone: 'Teléfono de contacto',
                      address: 'Dirección de entrega',
                      reference: 'Referencia de entrega'
                    }[key]
                  }
                  value={fields[key]}
                  onChange={(e) =>
                    setFields((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              )
            )}
            {account.modality !== 'TAKE_AWAY' && (
              <>
                <TextField
                  select
                  label='Repartidor / courier'
                  value={fields.courierId}
                  onChange={(e) =>
                    setFields((f) => ({ ...f, courierId: e.target.value }))
                  }
                >
                  <MenuItem value=''>Sin asignar</MenuItem>
                  {couriers
                    .filter((c) => c.kind === account.modality)
                    .map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  label='Nuevo repartidor: nombre'
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                />
                <TextField
                  label='Nuevo repartidor: teléfono'
                  value={courierPhone}
                  onChange={(e) => setCourierPhone(e.target.value)}
                />
                <Button
                  onClick={async () => {
                    if (
                      await run('/offsite/couriers', {
                        name: courierName,
                        phone: courierPhone,
                        kind: account.modality
                      })
                    ) {
                      setCouriers(
                        (
                          await restauranteApi.get<typeof couriers>(
                            '/offsite/couriers'
                          )
                        ).data
                      );
                      setCourierName('');
                      setCourierPhone('');
                    }
                  }}
                >
                  Registrar repartidor/courier
                </Button>
              </>
            )}
            <TextField
              label='Motivo de operación de entrega'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button
              disabled={!data || !reason.trim()}
              onClick={() =>
                void run(`${base}/details`, {
                  ...fields,
                  courierId: fields.courierId || undefined,
                  expectedVersion: account.version,
                  reason
                })
              }
            >
              Guardar datos de entrega
            </Button>
          </div>
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            {(states[data?.delivery?.status || 'PREPARING'] || []).map(
              (status) => (
                <Button
                  key={status}
                  disabled={!data || !reason.trim()}
                  onClick={() =>
                    void run(`${base}/state`, {
                      expectedVersion: account.version,
                      status,
                      reason
                    })
                  }
                >
                  {labels[status]}
                </Button>
              )
            )}
            {data?.delivery && data.delivery.status !== 'PREPARING' && (
              <Button
                disabled={!reason.trim()}
                onClick={() =>
                  void run(`${base}/correction`, {
                    expectedVersion: account.version,
                    status: 'PREPARING',
                    reason
                  })
                }
              >
                Corregir estado a preparación
              </Button>
            )}
          </Stack>
          <Button component={Link} to='/finance'>
            Cobros, propinas y rendición
          </Button>
          <section className='courier-custody'>
            <Typography variant='h6'>Efectivo en poder del courier</Typography>
            <Typography variant='body2'>
              Custodia de dinero ya cobrado. Recibirlo no registra otra venta ni
              otro pago.
            </Typography>
            {(data?.cash || []).map((c) => (
              <Typography key={c.id}>
                Cobrado S/{c.appliedAmount} · por recibir S/{c.pendingAmount}
              </Typography>
            ))}
            <TextField
              select
              label='Cobro a recibir del courier'
              value={custody}
              onChange={(e) => setCustody(e.target.value)}
            >
              <MenuItem value=''>Seleccione</MenuItem>
              {data?.cash
                .filter((c) => Number(c.pendingAmount) > 0)
                .map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.id.slice(0, 8)} · pendiente S/{c.pendingAmount}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label='Efectivo recibido del courier S/'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              disabled={
                !data ||
                !shift ||
                !custody ||
                !reason.trim() ||
                account.responsibleUserId !== user?.id
              }
              onClick={() =>
                void run(`${base}/cash-receipts`, {
                  expectedVersion: account.version,
                  custodyId: custody,
                  shiftId: shift,
                  amount,
                  reason
                })
              }
            >
              Confirmo recepción física del efectivo
            </Button>
            {!shift && (
              <Typography>
                Abra su turno en Cobros y rendición para recibir efectivo.
              </Typography>
            )}
            {data?.receipts.map((r) => (
              <Typography key={r.id}>
                Recibido S/{r.amount} · responsable {r.recipientId} ·{' '}
                {new Date(r.createdAt).toLocaleString('es-PE', {
                  timeZone: zone
                })}
              </Typography>
            ))}
          </section>
        </Stack>
      </CardContent>
    </Card>
  );
}
