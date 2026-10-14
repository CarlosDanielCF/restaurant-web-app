import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
  debts: { id: string; principal: string }[];
  debtBalance: string;
  tips: Tip[];
  yapeQr: string;
}
interface Shift {
  shift: { id: string; workerId: string; status: string; version: number };
  expectedCash: string;
  shortage: string;
  overage: string;
  settlement: {
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
  const { socket, online } = useContext(SocketContext);
  const [accounts, setAccounts] = useState<Account[]>([]),
    [selected, setSelected] = useState(''),
    [data, setData] = useState<Financial>(),
    [shifts, setShifts] = useState<Shift[]>([]);
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
  const [people, setPeople] = useState('2');
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
    void refresh();
    return () => {
      generation.current++;
    };
  }, [refresh]);
  useEffect(() => {
    const update = () => {
      void refresh();
    };
    for (const event of ['finance.changed', 'attention.changed', 'connect'])
      socket?.on(event, update);
    const interval = setInterval(update, 15000);
    return () => {
      clearInterval(interval);
      for (const event of ['finance.changed', 'attention.changed', 'connect'])
        socket?.off(event, update);
    };
  }, [socket, refresh]);
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
    <Container maxWidth='lg' sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Typography variant='h3'>Cobros y rendición</Typography>
        <Alert severity='info'>
          Registro manual de dinero recibido o entregado. No ejecuta
          transferencias Yape ni operaciones del POS. Pagar no libera la mesa.
        </Alert>
        {!online && (
          <Alert severity='warning'>
            Sin sincronización en tiempo real. Consulte el estado antes de
            operar; el servidor volverá a validar el saldo.
          </Alert>
        )}
        {error && <Alert severity='error'>{error}</Alert>}
        {notice && <Alert severity='success'>{notice}</Alert>}
        <Button onClick={() => void refresh()} disabled={busy}>
          Actualizar información
        </Button>
        <TextField
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
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant='h4'>
                Consumo S/{data.account.grossTotal} · descuentos S/
                {data.account.discountTotal} · total S/{data.account.total}
              </Typography>
              <Typography>
                Saldo S/{data.account.balance} · {data.account.paymentStatus} ·
                deuda vigente S/{data.debtBalance}
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
              <Typography variant='h5'>Pagos anteriores</Typography>
              {data.payments.map((p) => (
                <Typography key={p.id}>
                  {new Date(p.confirmedAt).toLocaleString('es-PE', {
                    timeZone: restaurant?.timeZone || 'America/Lima'
                  })}{' '}
                  · {p.method} · aplicado S/{p.appliedAmount} · recibido S/
                  {p.receivedAmount} · vuelto S/{p.changeAmount} · reembolsado
                  S/{p.refunded}
                </Typography>
              ))}
              {data.refunds.map((r) => (
                <Typography key={r.id}>
                  Devolución {r.method}: S/{r.amount} · {r.reason}
                </Typography>
              ))}
              {data.tips.map((t) => (
                <Typography key={t.id}>
                  Propina {t.kind}: S/{t.amount} · entregado S/{t.paidOut}
                </Typography>
              ))}
            </Stack>
          </Paper>
        )}
        <Typography variant='h4'>Turnos y rendiciones</Typography>
        <Button
          disabled={disabled || !!own}
          onClick={() => void run('/finance/shifts', { workerId: user?.id })}
        >
          Abrir mi turno
        </Button>
        {shifts.map((s) => (
          <Paper key={s.shift.id} sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Typography>
                Trabajador{' '}
                {s.shift.workerId === user?.id ? 'Yo' : s.shift.workerId} ·{' '}
                {s.shift.status}
              </Typography>
              <Typography>
                Efectivo calculado S/{s.expectedCash} · abonos incluidos en
                cobros S/{s.installmentsIncludedInPayments}
              </Typography>
              {s.payments.map((p) => (
                <Typography key={p.method}>
                  {p.method}: S/{p.amount}
                </Typography>
              ))}
              {s.settlement && (
                <Typography>
                  Rendición {s.settlement.status}: esperado S/
                  {s.settlement.expectedCash} · entregado S/
                  {s.settlement.deliveredCash} · faltante S/{s.shortage} ·
                  sobrante S/{s.overage}
                </Typography>
              )}
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
            <Stack spacing={2} sx={{ pt: 1 }}>
              {action?.explanation && (
                <Alert severity='info'>{action.explanation}</Alert>
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
              Confirmar registro
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={payment}
          onClose={() => !busy && setPayment(false)}
          fullWidth
        >
          <DialogTitle>Confirmar dinero recibido</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {data?.account.version !== payVersion && (
                <Alert severity='warning'>
                  La cuenta cambió. Cierre este formulario y revise el saldo
                  antes de confirmar.
                </Alert>
              )}
              {parts.map((part, i) => (
                <Stack key={i} spacing={1}>
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
                </Stack>
              ))}
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
                    . Verifique el dinero recibido; el QR no incorpora este
                    importe.
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
