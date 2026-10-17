import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { WorkspaceEmpty } from '@/components/operational/WorkspaceEmpty';
import { operationalLabel } from '../Insights/labels';
import { DebtCards } from './DebtCards';
import '../Operations/cycle2.css';
import { Link } from 'react-router-dom';
import { cents, difference, displayCents, sumMoney } from './displayMoney';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux';
import { restauranteApi } from '@/api';
import { SocketContext } from '@/context';
import { useRestaurantImage } from '@/hooks/useRestaurantImage';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { Account } from '../Operations/types';
interface Payment {
  id: string;
  collectorId: string;
  method: string;
  appliedAmount: string;
  receivedAmount: string;
  changeAmount: string;
  refunded: string;
  confirmedAt: string;
}
interface Tip {
  id: string;
  kind: string;
  amount: string;
  paidOut: string;
}
interface Financial {
  lineBalances: { lineId: string; remaining: string }[];
  account: Account & { grossTotal: string; discountTotal: string };
  payments: Payment[];
  refunds: { id: string; amount: string; method: string; reason: string }[];
  debts: {
    id: string;
    principal: string;
    installmentsTotal: string;
    outstanding: string;
    clientId: string;
  }[];
  debtBalance: string;
  tips: Tip[];
  yapeQr: string;
}
interface Shift {
  refunds: { method: string; amount: string }[];
  movements: {
    id: string;
    kind: string;
    amount: string;
    reason: string;
    createdAt: string;
  }[];
  tips: { kind: string; method: string; amount: string }[];
  shift: { id: string; workerId: string; status: string; version: number };
  courierCashRecorded?: string;
  courierCashReceived?: string;
  expectedCash: string;
  shortage: string;
  overage: string;
  settlement: {
    differenceReason: string;
    expectedCash: string;
    deliveredCash: string;
    status: string;
  } | null;
  payments: { method: string; amount: string }[];
  installmentsIncludedInPayments: string;
}
interface Field {
  key: string;
  label: string;
  value?: string;
  options?: { id: string; name: string }[];
  optional?: boolean;
}
interface Action {
  title: string;
  path: string;
  version?: number;
  fields: Field[];
  defaults?: Record<string, unknown>;
  explanation?: string;
}
const methods = [
  { id: 'CASH', name: 'Efectivo' },
  { id: 'YAPE', name: 'Yape manual' },
  { id: 'CARD', name: 'Tarjeta / POS manual' }
];
export function FinancePage() {
  const user = useSelector(selectAuth).user;
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const manager = ['DUENO', 'ADMINISTRADOR'].includes(user?.role.name || '');
  const { online } = useContext(SocketContext);
  const [accounts, setAccounts] = useState<Account[]>([]),
    [selected, setSelected] = useState(''),
    [data, setData] = useState<Financial>(),
    [shifts, setShifts] = useState<Shift[]>([]);
  const [workerNames, setWorkerNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    setWorkerNames({});
    restauranteApi
      .get<{ id: string; name: string }[]>('/operational-reports/directory')
      .then(({ data }) => {
        if (active)
          setWorkerNames(Object.fromEntries(data.map((w) => [w.id, w.name])));
      })
      .catch(() => {
        /* Keep the stable worker identifier when the directory is unavailable. */
      });
    return () => {
      active = false;
    };
  }, [restaurant?.id]);
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false);
  const [action, setAction] = useState<Action>(),
    [values, setValues] = useState<Record<string, string>>({});
  const [payment, setPayment] = useState(false),
    [payVersion, setPayVersion] = useState(0),
    [parts, setParts] = useState([
      { method: 'CASH', amount: '', receivedAmount: '' }
    ]),
    [manual, setManual] = useState(false),
    [adminReason, setAdminReason] = useState(''),
    [lineIds, setLineIds] = useState<string[]>([]);
  const [courierCash, setCourierCash] = useState(false),
    [courierId, setCourierId] = useState('');
  useEffect(() => {
    let active = true;
    setCourierCash(false);
    setCourierId('');
    if (
      selected &&
      data?.account.modality &&
      ['OWN_DELIVERY', 'EXTERNAL_COURIER'].includes(data.account.modality)
    )
      restauranteApi
        .get<{ delivery: { courierId: string } | null }>(
          `/offsite/accounts/${selected}`
        )
        .then((r) => {
          if (active) setCourierId(r.data.delivery?.courierId || '');
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [selected, data?.account.modality, data?.account.version]);
  const [people, setPeople] = useState('2');
  const [showDebts, setShowDebts] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<
    { id: string; person: { firstName: string; lastName: string } }[]
  >([]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      restauranteApi
        .get<{ clients: typeof clients }>('/clients', {
          params: { limit: 100, search: clientSearch }
        })
        .then(({ data }) => {
          if (active) setClients(data.clients);
        })
        .catch(() => {
          if (active) setClients([]);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [clientSearch, restaurant?.id]);
  const installment =
    !!data?.debts.length &&
    (data.account.attentionStatus === 'CLOSED' ||
      (data.account.responsibleUserId !== user?.id && !adminReason.trim()));
  const lock = useRef(false),
    generation = useRef(0);
  const qr = useRestaurantImage(data?.yapeQr);
  const own = shifts.find(
    (s) => s.shift.workerId === user?.id && s.shift.status === 'OPEN'
  );
  const refresh = useCallback(async () => {
    const ticket = ++generation.current;
    try {
      const [a, s, f] = await Promise.all([
        restauranteApi.get<Account[]>('/attention-accounts'),
        restauranteApi.get<Shift[]>('/finance/shifts'),
        selected
          ? restauranteApi.get<Financial>(`/finance/accounts/${selected}`)
          : Promise.resolve(undefined)
      ]);
      if (ticket !== generation.current) return;
      setAccounts(a.data);
      setShifts(s.data);
      setData(f?.data);
      setReady(true);
    } catch {
      if (ticket === generation.current) {
        setReady(false);
        setError('No se pudo actualizar. Recargue antes de operar.');
      }
    }
  }, [selected, restaurant?.id]);
  useEffect(() => {
    setReady(false);
    setData(undefined);
    return () => {
      generation.current++;
    };
  }, [refresh]);
  useLiveRefresh(refresh, ['finance.changed', 'attention.changed']);
  const run = async (path: string, body: Record<string, unknown>) => {
    if (lock.current || !ready) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    const storage = `finance-pending:${restaurant?.id}:${user?.id}`;
    const { expectedVersion, ...intent } = body;
    void expectedVersion;
    const signature = JSON.stringify({ path, intent });
    let pending: Record<string, string> = {};
    try {
      pending = JSON.parse(sessionStorage.getItem(storage) || '{}') as Record<
        string,
        string
      >;
    } catch {
      pending = {};
    }
    const key = pending[signature] || crypto.randomUUID();
    pending[signature] = key;
    sessionStorage.setItem(storage, JSON.stringify(pending));
    try {
      await restauranteApi.post(path, body, {
        headers: { 'Idempotency-Key': key }
      });
      delete pending[signature];
      sessionStorage.setItem(storage, JSON.stringify(pending));
      setAction(undefined);
      setPayment(false);
      setNotice('Operación confirmada por el servidor.');
      await refresh();
    } catch (e) {
      const response = e as { data?: { message?: string | string[] } };
      const message = response.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message ||
              'Sin confirmación. Consulte el estado y reintente la misma operación; se conserva su clave.'
      );
      await refresh();
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  const open = (a: Action) => {
    setAction(a);
    setValues(Object.fromEntries(a.fields.map((f) => [f.key, f.value || ''])));
  };
  const amount: Field = { key: 'amount', label: 'Importe S/' },
    reason: Field = { key: 'reason', label: 'Motivo obligatorio' };
  const base = `/finance/accounts/${selected}`;
  const accountAction = (
    title: string,
    route: string,
    fields: Field[],
    defaults?: Record<string, unknown>,
    explanation?: string
  ) =>
    open({
      title,
      path: `${base}/${route}`,
      fields,
      defaults,
      version: data?.account.version,
      explanation
    });
  const disabled = busy || !ready;
  return (
    <Container maxWidth='xl' className='finance-operation' sx={{ py: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
          flexWrap='wrap'
          gap={1}
        >
          <Typography variant='h4'>Cobros y rendición</Typography>
          <Button onClick={() => void refresh()} disabled={busy}>
            Revalidar información
          </Button>
        </Stack>
        <Alert severity='info'>
          Cobros manuales · pagar no libera la mesa. Yape y POS se verifican
          externamente.
        </Alert>
        {!online && (
          <Alert severity='warning'>
            Sin sincronización en tiempo real. Consulte el estado antes de
            operar; el servidor volverá a validar el saldo.
          </Alert>
        )}
        {error && <Alert severity='error'>{error}</Alert>}
        {notice && <Alert severity='success'>{notice}</Alert>}
        <details
          className='service-details'
          onToggle={(e) => setShowDebts(e.currentTarget.open)}
        >
          <summary>Fiados y abonos · consultar cuentas</summary>
          {showDebts && (
            <DebtCards
              accounts={accounts}
              onSelect={(id) => {
                setPayment(false);
                setAction(undefined);
                setSelected(id);
                setLineIds([]);
              }}
            />
          )}
        </details>
        {ready && accounts.length === 0 && (
          <Alert severity='info'>
            No hay cuentas para cobrar. Las atenciones abiertas aparecerán aquí
            con su saldo e historial.
          </Alert>
        )}
        <TextField
          className='finance-account-select'
          select
          label='Cuenta de atención'
          value={selected}
          onChange={(e) => {
            setPayment(false);
            setAction(undefined);
            setSelected(e.target.value);
            setLineIds([]);
          }}
        >
          <MenuItem value=''>Seleccione</MenuItem>
          {accounts.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.tables.map((t) => t.name).join(', ') || a.modality} ·{' '}
              {a.id.slice(0, 8)} · saldo S/{a.balance} · {a.attentionStatus}
            </MenuItem>
          ))}
        </TextField>
        {data && (
          <Paper className='finance-workbench' sx={{ p: 2 }}>
            <div className='finance-summary'>
              <Typography variant='h6'>Resumen de cuenta</Typography>
              <Typography>
                {data.account.tables.map((t) => t.name).join(' + ') ||
                  data.account.modality}
              </Typography>
              <dl className='money-summary'>
                <div>
                  <dt>Consumo</dt>
                  <dd>S/ {data.account.grossTotal}</dd>
                </div>
                <div>
                  <dt>Descuentos</dt>
                  <dd>S/ {data.account.discountTotal}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>S/ {data.account.total}</dd>
                </div>
                <div>
                  <dt>Cobros registrados</dt>
                  <dd>
                    S/ {sumMoney(data.payments.map((p) => p.appliedAmount))}
                  </dd>
                </div>
                <div>
                  <dt>Devuelto</dt>
                  <dd>S/ {sumMoney(data.refunds.map((r) => r.amount))}</dd>
                </div>
                <div className='balance'>
                  <dt>
                    {data.account.paymentStatus === 'CREDIT'
                      ? 'SALDO A FAVOR'
                      : 'SALDO'}
                  </dt>
                  <dd>S/ {data.account.balance}</dd>
                </div>
              </dl>
              <Typography variant='caption'>
                Estado de pago:{' '}
                {{
                  UNPAID: 'Pendiente',
                  PARTIAL: 'Pago parcial',
                  SETTLED: 'Saldada',
                  CREDIT: 'Saldo a favor'
                }[data.account.paymentStatus] || data.account.paymentStatus}
                . Deuda vigente S/ {data.debtBalance}.
              </Typography>
              <Typography variant='subtitle1' fontWeight={700}>
                Productos / división del cobro
              </Typography>
              {data.account.lines
                .filter((l) => l.status === 'ACTIVE')
                .map((l) => (
                  <FormControlLabel
                    key={l.id}
                    control={
                      <Checkbox
                        checked={lineIds.includes(l.id)}
                        onChange={(e) =>
                          setLineIds((ids) =>
                            e.target.checked
                              ? [...ids, l.id]
                              : ids.filter((id) => id !== l.id)
                          )
                        }
                      />
                    }
                    label={`${l.quantity} × ${l.productSnapshot.name} · S/${l.subtotal} · pendiente S/${data.lineBalances.find((b) => b.lineId === l.id)?.remaining ?? l.subtotal}`}
                  />
                ))}
              <Typography variant='caption'>
                Seleccione productos para limitar el cobro a esos consumos. Sin
                selección, el importe se distribuye sobre el saldo.
              </Typography>
            </div>
            <div className='finance-actions'>
              <Typography variant='h6'>Registrar pago</Typography>
              <Typography variant='body2'>
                El saldo se valida nuevamente al confirmar. Pagar no libera la
                mesa.
              </Typography>
              <Stack direction='row' spacing={1} flexWrap='wrap'>
                <Button
                  disabled={disabled || !own}
                  variant='contained'
                  onClick={() => {
                    setPayVersion(data.account.version);
                    setParts([
                      { method: 'CASH', amount: '', receivedAmount: '' }
                    ]);
                    setManual(false);
                    setAdminReason('');
                    setPayment(true);
                  }}
                >
                  Registrar {installment ? 'abono' : 'pago'}
                </Button>
                <Button
                  disabled={disabled}
                  onClick={() =>
                    accountAction(
                      'Descuento sobre consumos originales',
                      'discounts',
                      [
                        amount,
                        reason,
                        {
                          key: 'lineId',
                          label: 'Producto (vacío: toda la cuenta)',
                          optional: true,
                          options: data.account.lines
                            .filter((l) => l.status === 'ACTIVE')
                            .map((l) => ({
                              id: l.id,
                              name: l.productSnapshot.name
                            }))
                        }
                      ]
                    )
                  }
                >
                  Descuento
                </Button>
                <Button
                  disabled={disabled || !own}
                  onClick={() =>
                    accountAction(
                      'Devolución manual',
                      'refunds',
                      [
                        {
                          key: 'paymentId',
                          label: 'Pago original',
                          options: data.payments
                            .filter((p) => p.collectorId === user?.id)
                            .map((p) => ({
                              id: p.id,
                              name: `${p.method} S/${p.appliedAmount} · devuelto S/${p.refunded}`
                            }))
                        },
                        amount,
                        {
                          key: 'method',
                          label: 'Medio de devolución',
                          options: methods
                        },
                        reason
                      ],
                      { shiftId: own?.shift.id },
                      'Solo se permite devolver saldo a favor. No ejecuta una reversión externa.'
                    )
                  }
                  color='error'
                >
                  Reembolso
                </Button>
                <Button
                  disabled={disabled}
                  onClick={() =>
                    accountAction(
                      'Registrar deuda',
                      'debt',
                      [
                        reason,
                        ...(!data.account.clientId
                          ? [
                              {
                                key: 'clientId',
                                label: 'Cliente identificado',
                                options: clients.map((c) => ({
                                  id: c.id,
                                  name: `${c.person.firstName} ${c.person.lastName}`
                                }))
                              }
                            ]
                          : [])
                      ],
                      undefined,
                      'Requiere cliente identificado. Registre primero cualquier pago inicial. Después cierre la atención con deuda desde Atención.'
                    )
                  }
                >
                  Registrar fiado
                </Button>
                <Button
                  disabled={disabled || !own}
                  onClick={() =>
                    accountAction(
                      'Propina voluntaria',
                      'tips',
                      [
                        {
                          key: 'paymentId',
                          label: 'Cobro del beneficiario',
                          options: data.payments
                            .filter((p) => p.collectorId === user?.id)
                            .map((p) => ({
                              id: p.id,
                              name: `${p.method} S/${p.appliedAmount}`
                            }))
                        },
                        {
                          key: 'kind',
                          label: 'Tipo',
                          options: [
                            { id: 'DIRECT', name: 'Directa al mozo' },
                            {
                              id: 'DIGITAL_RECEIPT',
                              name: 'Digital recibida por restaurante'
                            }
                          ]
                        },
                        amount,
                        { key: 'method', label: 'Método', options: methods },
                        {
                          key: 'manuallyConfirmed',
                          label: 'Yape: recepción verificada',
                          optional: true,
                          options: [
                            { id: 'true', name: 'Sí, verificado visualmente' }
                          ]
                        }
                      ],
                      { shiftId: own?.shift.id }
                    )
                  }
                >
                  Propina
                </Button>
                {manager && (
                  <Button
                    disabled={disabled}
                    onClick={() =>
                      accountAction(
                        'Entrega de propina digital',
                        'tip-payouts',
                        [
                          {
                            key: 'sourceGratuityId',
                            label: 'Propina pendiente',
                            options: data.tips
                              .filter((t) => t.kind === 'DIGITAL_RECEIPT')
                              .map((t) => ({
                                id: t.id,
                                name: `S/${t.amount} · entregado S/${t.paidOut}`
                              }))
                          },
                          amount,
                          {
                            key: 'method',
                            label: 'Medio de entrega',
                            options: methods
                          },
                          reason
                        ],
                        undefined,
                        'Registra dinero entregado por el restaurante al beneficiario. No se descuenta del efectivo que custodia el mozo.'
                      )
                    }
                  >
                    Entregar propina digital
                  </Button>
                )}
              </Stack>
              {!data.account.clientId && (
                <TextField
                  label='Buscar cliente antes de registrar fiado'
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  helperText='Busque el cliente y luego pulse Registrar fiado. Puede crearlo desde Clientes.'
                />
              )}
              {!own && (
                <Alert severity='warning'>
                  Abra su turno para registrar cobros, reembolsos o propinas.
                </Alert>
              )}
              <Stack direction='row' spacing={1} flexWrap='wrap'>
                <TextField
                  size='small'
                  label='Personas'
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                />
                <Button
                  onClick={async () => {
                    try {
                      const { data: r } = await restauranteApi.get<{
                        amounts: string[];
                      }>(`${base}/split`, { params: { people } });
                      setNotice(
                        `División del saldo: ${r.amounts.map((a) => `S/${a}`).join(' + ')}. Registre cada importe al cobrar.`
                      );
                    } catch {
                      setError('División inválida');
                    }
                  }}
                >
                  Dividir saldo
                </Button>
              </Stack>
              <Stack direction='row' gap={1} flexWrap='wrap'>
                <Button
                  component={Link}
                  to={`/internal-documents?accountId=${selected}`}
                >
                  Ver cuenta
                </Button>
                <Button
                  component={Link}
                  to={`/internal-documents?accountId=${selected}`}
                  disabled={!data.payments.length}
                >
                  Ticket interno
                </Button>
              </Stack>
              <Typography variant='caption'>
                DOCUMENTO INTERNO · cuenta, emisión y reimpresión.
              </Typography>
            </div>
            <div className='finance-history'>
              {!!data.debts.length && (
                <section className='debt-summary'>
                  <Typography variant='h6'>Fiados y abonos</Typography>
                  <Typography>
                    Cliente:{' '}
                    {clients.find((c) => c.id === data.account.clientId)?.person
                      .firstName || data.account.clientId}
                  </Typography>
                  {data.debts.map((d) => (
                    <div className='debt-card' key={d.id}>
                      <Typography>Deuda original S/ {d.principal}</Typography>
                      <Typography>Abonado S/ {d.installmentsTotal}</Typography>
                      <Typography fontWeight={700}>
                        Saldo S/ {d.outstanding}
                      </Typography>
                    </div>
                  ))}
                  <Typography variant='caption'>
                    Los abonos son cobros de deuda, no ventas nuevas. Consulte
                    el historial de pagos de esta cuenta.
                  </Typography>
                </section>
              )}
              <Typography variant='h6'>Pagos anteriores</Typography>
              {!data.payments.length && (
                <Typography color='text.secondary'>
                  Sin pagos registrados.
                </Typography>
              )}
              {data.payments.map((p) => (
                <Typography key={p.id} className='payment-history-row'>
                  {new Date(p.confirmedAt).toLocaleString('es-PE', {
                    timeZone: restaurant?.timeZone || 'America/Lima'
                  })}{' '}
                  · {p.method} · aplicado S/{p.appliedAmount} · recibido S/
                  {p.receivedAmount} · vuelto S/{p.changeAmount} · reembolsado
                  S/{p.refunded} · cobrador{' '}
                  {p.collectorId === user?.id
                    ? user.person.firstName
                    : p.collectorId}
                </Typography>
              ))}
              {data.refunds.map((r) => (
                <Typography key={r.id}>
                  Devolución {r.method}: S/{r.amount} · {r.reason}
                </Typography>
              ))}
              <Typography variant='subtitle1'>
                Propinas · separadas de la venta
              </Typography>
              {data.tips.map((t) => (
                <Typography key={t.id}>
                  Propina{' '}
                  {t.kind === 'DIRECT'
                    ? 'directa al cobrador'
                    : t.kind === 'DIGITAL_RECEIPT'
                      ? 'digital recibida'
                      : 'digital entregada'}
                  : S/{t.amount} · entregado S/{t.paidOut}
                </Typography>
              ))}
            </div>
          </Paper>
        )}
        <Typography variant='h4'>Turnos y rendiciones</Typography>
        <Button
          disabled={disabled || !!own}
          onClick={() => void run('/finance/shifts', { workerId: user?.id })}
        >
          Abrir mi turno
        </Button>
        {ready && shifts.length === 0 && (
          <WorkspaceEmpty
            title='Sin turnos registrados'
            description='Al abrir un turno podrás consultar sus cobros, movimientos y rendición.'
          />
        )}
        {shifts.map((s) => (
          <Paper key={s.shift.id} className='shift-card' sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Typography>
                Trabajador{' '}
                {s.shift.workerId === user?.id
                  ? 'Yo'
                  : workerNames[s.shift.workerId] || s.shift.workerId}{' '}
                · {operationalLabel(s.shift.status)}
              </Typography>
              <div className='pos-shift-summary'>
                <section>
                  <Typography variant='overline'>
                    Efectivo y custodia
                  </Typography>
                  <dl>
                    <div>
                      <dt>Registrado en courier</dt>
                      <dd>S/ {s.courierCashRecorded || '0.00'}</dd>
                    </div>
                    <div>
                      <dt>Recibido del courier</dt>
                      <dd>S/ {s.courierCashReceived || '0.00'}</dd>
                    </div>
                    <div>
                      <dt>Abonos incluidos en cobros</dt>
                      <dd>S/ {s.installmentsIncludedInPayments}</dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <Typography variant='overline'>Cobros por medio</Typography>
                  <dl>
                    {s.payments.map((p) => (
                      <div key={p.method}>
                        <dt>{operationalLabel(p.method)}</dt>
                        <dd>S/ {p.amount}</dd>
                      </div>
                    ))}
                  </dl>
                  <Typography variant='caption'>
                    Propinas separadas en el historial de movimientos.
                  </Typography>
                </section>
              </div>
              {s.settlement && (
                <Typography>
                  Rendición {s.settlement.status}: esperado S/
                  {s.settlement.expectedCash} · entregado S/
                  {s.settlement.deliveredCash} · faltante S/{s.shortage} ·
                  sobrante S/{s.overage}
                </Typography>
              )}
              <div className='shift-totals'>
                {[
                  ['Esperado', s.expectedCash],
                  ['Entregado', s.settlement?.deliveredCash ?? '—'],
                  ['Faltante', s.shortage],
                  ['Sobrante', s.overage]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    data-financial-state={
                      label === 'Faltante' && value !== '0.00' && value !== '—'
                        ? 'shortage'
                        : label === 'Sobrante'
                          ? 'overage'
                          : 'neutral'
                    }
                  >
                    <Typography variant='caption'>{label}</Typography>
                    <Typography fontWeight={700}>S/ {value}</Typography>
                  </div>
                ))}
              </div>
              {s.settlement?.differenceReason && (
                <Alert severity='warning'>
                  Motivo de diferencia: {s.settlement.differenceReason}
                </Alert>
              )}
              <details className='shift-ledger'>
                <summary>
                  Fondos, entregas previas, devoluciones y propinas
                </summary>
                <Typography variant='body2'>
                  Abonos incluidos en los cobros: S/{' '}
                  {s.installmentsIncludedInPayments}. No se suman nuevamente.
                  Las deudas no son efectivo a rendir.
                </Typography>
                {s.movements?.map((m) => (
                  <Typography key={m.id}>
                    {operationalLabel(m.kind)} · S/ {m.amount} · {m.reason} ·{' '}
                    {new Date(m.createdAt).toLocaleString('es-PE', {
                      timeZone: restaurant?.timeZone
                    })}
                  </Typography>
                ))}
                {!s.movements?.length && (
                  <Typography>
                    Sin movimientos de fondos registrados.
                  </Typography>
                )}
                {s.refunds?.map((r) => (
                  <Typography key={r.method}>
                    Devoluciones {operationalLabel(r.method)}: S/ {r.amount}
                  </Typography>
                ))}
                {s.tips?.map((t, i) => (
                  <Typography key={i}>
                    Propina {operationalLabel(t.kind)} ·{' '}
                    {operationalLabel(t.method)} · S/ {t.amount} (separada de
                    ventas)
                  </Typography>
                ))}
              </details>
              <Stack direction='row' spacing={1} flexWrap='wrap'>
                {manager && s.shift.status !== 'SUBMITTED' && (
                  <Button
                    disabled={disabled}
                    onClick={() =>
                      open({
                        title: 'Movimiento de efectivo auditado',
                        path: `/finance/shifts/${s.shift.id}/cash`,
                        version: s.shift.version,
                        fields: [
                          {
                            key: 'kind',
                            label: 'Movimiento',
                            options:
                              s.shift.status === 'CLOSED'
                                ? [
                                    {
                                      id: 'CORRECTION',
                                      name: 'Corrección histórica (no cambia cierre)'
                                    }
                                  ]
                                : [
                                    {
                                      id: 'CHANGE_FUND',
                                      name: 'Fondo para vuelto'
                                    },
                                    {
                                      id: 'EARLY_HANDOVER',
                                      name: 'Entrega anticipada'
                                    },
                                    {
                                      id: 'FUND_RETURN',
                                      name: 'Devolución del fondo'
                                    },
                                    {
                                      id: 'CORRECTION',
                                      name: 'Corrección con signo'
                                    }
                                  ]
                          },
                          amount,
                          reason
                        ]
                      })
                    }
                  >
                    Movimiento de efectivo
                  </Button>
                )}
                {s.shift.workerId === user?.id && s.shift.status === 'OPEN' && (
                  <Button
                    disabled={disabled}
                    onClick={() =>
                      open({
                        title: 'Enviar rendición',
                        path: `/finance/shifts/${s.shift.id}/submit`,
                        version: s.shift.version,
                        fields: [
                          {
                            key: 'deliveredCash',
                            label: 'Efectivo entregado S/'
                          },
                          {
                            key: 'differenceReason',
                            label: 'Motivo si existe diferencia',
                            optional: true
                          }
                        ],
                        explanation:
                          'Al enviar, el turno deja de admitir cobros y espera revisión de administración.'
                      })
                    }
                  >
                    Rendir turno
                  </Button>
                )}
                {manager && s.shift.status === 'SUBMITTED' && (
                  <Button
                    disabled={disabled}
                    onClick={() =>
                      open({
                        title: 'Confirmar rendición revisada',
                        path: `/finance/shifts/${s.shift.id}/confirm`,
                        version: s.shift.version,
                        fields: [],
                        explanation: `Entregado: S/${s.settlement?.deliveredCash}. Confirma el cierre y conserva este documento sin modificaciones posteriores.`
                      })
                    }
                  >
                    Confirmar cierre
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        ))}
        <Dialog
          open={!!action}
          onClose={() => !busy && setAction(undefined)}
          fullWidth
        >
          <DialogTitle>{action?.title}</DialogTitle>
          <DialogContent>
            {error && <Alert severity='error'>{error}</Alert>}
            <Stack spacing={2} sx={{ pt: 1 }}>
              {action?.explanation && (
                <Alert severity='info'>{action.explanation}</Alert>
              )}
              {action?.path.endsWith('/refunds') &&
                (() => {
                  const original = data?.payments.find(
                    (p) => p.id === values.paymentId
                  );
                  if (!original)
                    return (
                      <Alert severity='warning'>
                        Seleccione el pago original. Devolver dinero no cancela
                        ni elimina ese pago.
                      </Alert>
                    );
                  const remaining =
                    (cents(original.appliedAmount) || BigInt(0)) -
                    (cents(original.refunded) || BigInt(0));
                  const credit = -(
                    cents(data?.account.balance || '0') || BigInt(0)
                  );
                  const max = remaining < credit ? remaining : credit;
                  return (
                    <Paper className='refund-summary' variant='outlined'>
                      <Typography>
                        Pago original S/ {original.appliedAmount}
                      </Typography>
                      <Typography>
                        Ya devuelto S/ {original.refunded}
                      </Typography>
                      <Typography fontWeight={700}>
                        Máximo disponible S/{' '}
                        {displayCents(max > BigInt(0) ? max : BigInt(0))}
                      </Typography>
                      <Typography variant='caption'>
                        Sujeto a validación del servidor. Yape/POS no se
                        revierten automáticamente.
                      </Typography>
                    </Paper>
                  );
                })()}
              {action?.path.endsWith('/tips') && (
                <Alert severity='info'>
                  Propina voluntaria, separada de la venta. Beneficiario: la
                  persona que realizó el cobro seleccionado.
                </Alert>
              )}
              {action?.fields.map((f) => (
                <TextField
                  key={f.key}
                  label={f.label}
                  select={!!f.options}
                  required={!f.optional}
                  value={values[f.key] || ''}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                >
                  {f.options && [
                    <MenuItem key='empty' value=''>
                      Seleccione
                    </MenuItem>,
                    ...f.options.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.name}
                      </MenuItem>
                    ))
                  ]}
                </TextField>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={busy} onClick={() => setAction(undefined)}>
              Volver
            </Button>
            <Button
              disabled={
                disabled ||
                action?.fields.some(
                  (f) => !f.optional && !values[f.key]?.trim()
                )
              }
              onClick={() => {
                if (!action) return;
                const body: Record<string, unknown> = {
                  ...action.defaults,
                  expectedVersion: action.version
                };
                for (const [key, value] of Object.entries(values))
                  if (value.trim())
                    body[key] =
                      key === 'manuallyConfirmed' ? value === 'true' : value;
                void run(action.path, body);
              }}
            >
              {action?.path.endsWith('/refunds')
                ? 'Registrar devolución'
                : 'Confirmar registro'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={payment}
          onClose={() => !busy && setPayment(false)}
          fullWidth
        >
          <DialogTitle>
            {installment ? 'Registrar abono' : 'Confirmar dinero recibido'}
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity='error'>{error}</Alert>}
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Paper className='payment-balance' variant='outlined'>
                <Typography variant='caption'>SALDO ACTUAL</Typography>
                <Typography variant='h5'>S/ {data?.account.balance}</Typography>
                <Typography variant='body2'>
                  Cobrador: {user?.person.firstName || user?.id}
                </Typography>
              </Paper>
              {installment && (
                <Alert severity='info'>
                  Abono a deuda existente. No registra una segunda venta.
                </Alert>
              )}
              {data?.account.version !== payVersion && (
                <Alert severity='warning'>
                  La cuenta cambió. Cierre este formulario y revise el saldo
                  antes de confirmar.
                </Alert>
              )}
              {courierId && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={courierCash}
                      onChange={(e) => setCourierCash(e.target.checked)}
                    />
                  }
                  label='El efectivo lo recibió físicamente el repartidor/courier'
                />
              )}
              {courierCash && (
                <Alert severity='info'>
                  Registra el pago del cliente una sola vez. La entrega del
                  efectivo al responsable se confirma aparte en Atención.
                </Alert>
              )}
              {parts.map((part, i) => (
                <Stack key={i} spacing={1} className='payment-part'>
                  <Stack direction='row' gap={1} flexWrap='wrap'>
                    {methods.map((m) => (
                      <Chip
                        key={m.id}
                        clickable
                        color={part.method === m.id ? 'primary' : 'default'}
                        label={m.name}
                        onClick={() =>
                          setParts((p) =>
                            p.map((v, j) =>
                              j === i ? { ...v, method: m.id } : v
                            )
                          )
                        }
                      />
                    ))}
                  </Stack>
                  <TextField
                    select
                    label='Método'
                    value={part.method}
                    onChange={(e) =>
                      setParts((p) =>
                        p.map((v, j) =>
                          j === i ? { ...v, method: e.target.value } : v
                        )
                      )
                    }
                  >
                    {methods.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  {(['amount', 'receivedAmount'] as const).map((key) => (
                    <TextField
                      key={key}
                      label={
                        key === 'amount'
                          ? 'Importe aplicado S/'
                          : 'Importe recibido S/'
                      }
                      value={part[key]}
                      onChange={(e) =>
                        setParts((p) =>
                          p.map((v, j) =>
                            i === j ? { ...v, [key]: e.target.value } : v
                          )
                        )
                      }
                    />
                  ))}
                  {part.method === 'CASH' && (
                    <Typography className='cash-change'>
                      Vuelto estimado: S/{' '}
                      {difference(part.receivedAmount, part.amount)}
                    </Typography>
                  )}
                  {part.method === 'CARD' && (
                    <Alert severity='info'>
                      Confirme manualmente el cobro en el POS externo antes de
                      registrar. No ingrese datos sensibles de tarjeta.
                    </Alert>
                  )}
                </Stack>
              ))}
              <Typography variant='body2'>
                Saldo estimado después del cobro: S/{' '}
                {difference(
                  data?.account.balance || '',
                  sumMoney(parts.map((p) => p.amount))
                )}
                . El servidor valida el importe final.
              </Typography>
              <Button
                disabled={parts.length >= 20}
                onClick={() =>
                  setParts((p) => [
                    ...p,
                    { method: 'CASH', amount: '', receivedAmount: '' }
                  ])
                }
              >
                Agregar método para pago mixto
              </Button>
              {parts.some((p) => p.method === 'YAPE') && (
                <>
                  {qr ? (
                    <Box
                      component='img'
                      src={qr}
                      alt='QR original de Yape del restaurante'
                      sx={{ maxWidth: 280, alignSelf: 'center' }}
                    />
                  ) : (
                    <Alert severity='warning'>
                      Sin QR disponible. Mostrar esta pantalla no registra un
                      pago.
                    </Alert>
                  )}
                  <Typography>
                    Importes Yape:{' '}
                    {parts
                      .filter((p) => p.method === 'YAPE')
                      .map((p) => `S/${p.amount || '0.00'}`)
                      .join(' + ')}
                    . Verifica visualmente el pago antes de confirmarlo. El QR
                    no incorpora este importe.
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={manual}
                        onChange={(e) => setManual(e.target.checked)}
                      />
                    }
                    label='Verifiqué visualmente la recepción del dinero'
                  />
                </>
              )}
              {manager && (
                <TextField
                  label='Motivo de excepción administrativa (si corresponde)'
                  value={adminReason}
                  onChange={(e) => setAdminReason(e.target.value)}
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={busy} onClick={() => setPayment(false)}>
              Volver
            </Button>
            <Button
              disabled={
                disabled ||
                !own ||
                data?.account.version !== payVersion ||
                parts.some((p) => !p.amount || !p.receivedAmount) ||
                (parts.some((p) => p.method === 'YAPE') && !manual)
              }
              onClick={() =>
                void run(
                  `${base}/${installment ? 'installments' : 'payments'}`,
                  {
                    expectedVersion: payVersion,
                    shiftId: own?.shift.id,
                    ...(courierCash ? { courierId } : {}),
                    payments: parts.map((p) => ({
                      ...p,
                      ...(p.method === 'YAPE'
                        ? { manuallyConfirmed: manual }
                        : {})
                    })),
                    ...(adminReason
                      ? { administrativeReason: adminReason }
                      : {}),
                    ...(lineIds.length ? { lineIds } : {})
                  }
                )
              }
            >
              Confirmar cobro manual
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}
