import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  LinearProgress,
  Stack,
  Typography,
  Chip
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux';
import { restauranteApi } from '@/api';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { Account, Line } from '../Operations/types';
import { Board, Dispatch } from '../Operations/fulfillment.types';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SoupKitchenRoundedIcon from '@mui/icons-material/SoupKitchenRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import './insights.css';

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
}

export function MozoDashboard({ previewRoleSelector }: { previewRoleSelector?: React.ReactNode } = {}) {
  const user = useSelector(selectAuth).user;
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const timeZone = restaurant?.timeZone || 'America/Lima';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState(Date.now());

  const generation = useRef(0);

  const load = useCallback(async () => {
    const ticket = ++generation.current;
    setBusy(true);
    setError('');

    try {
      const [accRes, boardRes, shiftsRes] = await Promise.allSettled([
        restauranteApi.get<Account[]>('/attention-accounts', { timeout: 12000 }),
        restauranteApi.get<Board>('/kitchen/board', { timeout: 12000 }),
        restauranteApi.get<Shift[]>('/finance/shifts', { timeout: 12000 })
      ]);

      if (ticket !== generation.current) return;

      if (accRes.status === 'fulfilled') {
        setAccounts(accRes.value.data || []);
      }
      if (boardRes.status === 'fulfilled') {
        setBoard(boardRes.value.data || null);
      }
      if (shiftsRes.status === 'fulfilled') {
        setShifts(shiftsRes.value.data || []);
      }

      if (accRes.status === 'rejected' && boardRes.status === 'rejected') {
        setError('No se pudo conectar con el servidor para actualizar los datos operativos.');
      }
      setLastSync(Date.now());
    } catch {
      if (ticket === generation.current) {
        setError('Error al actualizar las métricas de atención.');
      }
    } finally {
      if (ticket === generation.current) setBusy(false);
    }
  }, []);

  useLiveRefresh(load, ['attention.changed', 'kitchen.changed', 'finance.changed']);

  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);

  // Waiter-specific calculations (strictly scoped to this user)
  const myOpenAccounts = accounts.filter(
    (a) => a.responsibleUserId === user?.id && a.attentionStatus === 'OPEN'
  );

  const myTablesMap = new Map<string, string>();
  myOpenAccounts.forEach((acc) => {
    acc.tables.forEach((t) => myTablesMap.set(t.id, t.name));
  });
  const myTableNames = Array.from(myTablesMap.values());

  const myActiveLines: Line[] = myOpenAccounts.flatMap((acc) =>
    acc.lines.filter((l) => l.status === 'ACTIVE')
  );

  // Kitchen dispatches for waiter's open accounts
  const serverNowTime = board ? Date.parse(board.serverNow) : Date.now();
  const myDispatches: Dispatch[] = board
    ? board.dispatches.filter((d) =>
        myOpenAccounts.some((acc) => acc.id === d.accountId)
      )
    : [];

  const myReadyDispatches = myDispatches.filter((d) =>
    d.items.some((i) => Number(i.kitchenExited) > 0)
  );

  const myReadyItemsCount = myDispatches.reduce(
    (acc, d) =>
      acc +
      d.items.reduce(
        (sum, item) => sum + (Number(item.kitchenExited) || 0),
        0
      ),
    0
  );

  const myDelayedDispatches = myDispatches.filter((d) => {
    if (!d.pending) return false;
    const diffMin = (serverNowTime - Date.parse(d.confirmedAt)) / 60000;
    return diffMin >= 15;
  });

  // Waiter's own shift & collections
  const ownShift =
    shifts.find(
      (s) => s.shift.workerId === user?.id && s.shift.status === 'OPEN'
    ) || shifts.find((s) => s.shift.workerId === user?.id);

  const payments = ownShift?.payments || [];
  let waiterCash = 0;
  let waiterYape = 0;
  let waiterCard = 0;
  payments.forEach((p) => {
    const amt = Number(p.amount) || 0;
    if (p.method === 'CASH') waiterCash += amt;
    else if (p.method === 'YAPE') waiterYape += amt;
    else if (p.method === 'CARD') waiterCard += amt;
  });
  const totalWaiterCollected = waiterCash + waiterYape + waiterCard;

  const isShiftOpen = ownShift?.shift.status === 'OPEN';
  const expectedCash = Number(ownShift?.expectedCash) || 0;
  const deliveredCash = ownShift?.settlement?.deliveredCash
    ? Number(ownShift.settlement.deliveredCash)
    : null;

  return (
    <Container maxWidth='xl' className='final-page pos-overview point-insights'>
      <Stack spacing={2}>
        {/* Header */}
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
          flexWrap='wrap'
          gap={1.5}
        >
          <Box>
            <Typography variant='h5' component='h1' fontWeight={700} color='#0f172a'>
              Dashboard de Atención
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Mozo: <strong>{user?.person ? `${user.person.firstName} ${user.person.lastName}` : user?.username}</strong> • Resumen operativo de tu turno
            </Typography>
          </Box>
          <Stack direction='row' alignItems='center' gap={1} flexWrap='wrap'>
            {previewRoleSelector}
            <Button
              variant='outlined'
              size='small'
              startIcon={<RefreshRoundedIcon />}
              onClick={() => void load()}
              disabled={busy}
              sx={{
                borderRadius: '8px',
                borderColor: '#cbd5e1',
                color: '#334155',
                textTransform: 'none'
              }}
            >
              Actualizar
            </Button>
            <Button
              component={Link}
              to='/attention'
              variant='contained'
              size='small'
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                borderRadius: '8px',
                bgcolor: '#0d9488',
                '&:hover': { bgcolor: '#0f766e' },
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Ir a Atención
            </Button>
          </Stack>
        </Stack>

        {busy && <LinearProgress aria-label='Actualizando métricas operativas' sx={{ borderRadius: 1 }} />}

        {error && <Alert severity='warning'>{error}</Alert>}

        {/* Waiter Operational KPIs Grid */}
        <div className='dashboard-kpi-grid'>
          {/* Mesas a cargo */}
          <Card className='dash-kpi-card highlight-turquoise'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Mesas bajo tu cargo</span>
              <div className='dash-kpi-icon-wrap turquoise'>
                <TableRestaurantRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className='dash-kpi-value'>{myTableNames.length}</div>
            <div className='dash-kpi-footer'>
              {myTableNames.length > 0 ? (
                <span className='badge-pill turquoise'>
                  {myTableNames.join(', ')}
                </span>
              ) : (
                <span className='text-muted'>Sin mesas asignadas</span>
              )}
            </div>
          </Card>

          {/* Cuentas abiertas */}
          <Card className='dash-kpi-card'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Cuentas Abiertas</span>
              <div className='dash-kpi-icon-wrap blue'>
                <ReceiptLongRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className='dash-kpi-value'>{myOpenAccounts.length}</div>
            <div className='dash-kpi-footer'>
              <span>{myActiveLines.length} productos en atención</span>
              <Link to='/attention' className='dash-link'>
                Ver mesas →
              </Link>
            </div>
          </Card>

          {/* Pedidos listos de cocina */}
          <Card className='dash-kpi-card highlight-positive'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Salidos de Cocina</span>
              <div className='dash-kpi-icon-wrap emerald'>
                <CheckCircleRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className='dash-kpi-value text-success'>
              {myReadyItemsCount}
            </div>
            <div className='dash-kpi-footer'>
              {myReadyItemsCount > 0 ? (
                <span className='badge-pill green'>Listos para llevar a la mesa</span>
              ) : (
                <span className='text-muted'>Sin platos pendientes de entrega</span>
              )}
            </div>
          </Card>

          {/* Alertas de demora */}
          <Card className='dash-kpi-card'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Comandas con Demora</span>
              <div className={`dash-kpi-icon-wrap ${myDelayedDispatches.length > 0 ? 'red' : 'green'}`}>
                <WarningAmberRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className={`dash-kpi-value ${myDelayedDispatches.length > 0 ? 'text-danger' : 'text-success'}`}>
              {myDelayedDispatches.length}
            </div>
            <div className='dash-kpi-footer'>
              {myDelayedDispatches.length > 0 ? (
                <span className='badge-pill red'>&gt;15 min en preparación</span>
              ) : (
                <span className='text-muted'>Cocina al día con tus comandas</span>
              )}
            </div>
          </Card>
        </div>

        {/* Waiter Settlements & Details */}
        <div className='dashboard-charts-grid'>
          {/* Cobros Realizados por el Mozo */}
          <Card className='dash-section-card'>
            <div className='dash-card-header'>
              <div>
                <Typography variant='subtitle1' fontWeight={700} color='#0f172a'>
                  Cobros Realizados por Ti
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Atribuidos directamente a tu turno actual
                </Typography>
              </div>
              <Link to='/finance?view=shifts' className='dash-link'>
                Cobros y turnos →
              </Link>
            </div>

            <div className='waiter-money-summary'>
              <div className='waiter-money-total'>
                <span className='label'>Total cobrado por ti</span>
                <span className='amount'>S/ {totalWaiterCollected.toFixed(2)}</span>
              </div>

              <div className='waiter-methods-grid'>
                <div className='waiter-method-item'>
                  <span className='dot green' />
                  <div className='method-text'>
                    <span className='name'>Efectivo</span>
                    <strong className='val'>S/ {waiterCash.toFixed(2)}</strong>
                  </div>
                </div>

                <div className='waiter-method-item'>
                  <span className='dot purple' />
                  <div className='method-text'>
                    <span className='name'>Yape / Plin</span>
                    <strong className='val'>S/ {waiterYape.toFixed(2)}</strong>
                  </div>
                </div>

                <div className='waiter-method-item'>
                  <span className='dot blue' />
                  <div className='method-text'>
                    <span className='name'>Tarjeta</span>
                    <strong className='val'>S/ {waiterCard.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Rendición Propia de Turno */}
          <Card className='dash-section-card'>
            <div className='dash-card-header'>
              <div>
                <Typography variant='subtitle1' fontWeight={700} color='#0f172a'>
                  Rendición Propia
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Estado de tu turno y entrega de efectivo
                </Typography>
              </div>
              <span className={`badge-pill ${isShiftOpen ? 'green' : 'amber'}`}>
                {isShiftOpen ? 'Turno Abierto' : ownShift ? 'Turno Cerrado' : 'Sin Turno'}
              </span>
            </div>

            <div className='waiter-settlement-body'>
              {!ownShift ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                    No tienes un turno abierto en este momento.
                  </Typography>
                  <Button
                    component={Link}
                    to='/finance?view=shifts'
                    variant='outlined'
                    size='small'
                    sx={{ textTransform: 'none' }}
                  >
                    Abrir mi turno en Finanzas
                  </Button>
                </Box>
              ) : (
                <div className='waiter-shift-stats'>
                  <div className='stat-row'>
                    <span>Efectivo esperado por entregar:</span>
                    <strong>S/ {expectedCash.toFixed(2)}</strong>
                  </div>

                  {deliveredCash !== null && (
                    <div className='stat-row'>
                      <span>Efectivo entregado registrado:</span>
                      <strong>S/ {deliveredCash.toFixed(2)}</strong>
                    </div>
                  )}

                  {ownShift.shortage && Number(ownShift.shortage) > 0 && (
                    <div className='stat-row alert-row red'>
                      <span>Diferencia (Faltante):</span>
                      <strong>S/ {ownShift.shortage}</strong>
                    </div>
                  )}

                  {ownShift.overage && Number(ownShift.overage) > 0 && (
                    <div className='stat-row alert-row green'>
                      <span>Diferencia (Sobrante):</span>
                      <strong>S/ {ownShift.overage}</strong>
                    </div>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Button
                      component={Link}
                      to='/finance?view=shifts'
                      variant='outlined'
                      fullWidth
                      size='small'
                      sx={{ textTransform: 'none', borderRadius: '8px' }}
                    >
                      Ir a Rendición de Turno
                    </Button>
                  </Box>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Mesas y Cuentas Activas del Mozo */}
        <Card className='dash-section-card'>
          <div className='dash-card-header'>
            <div>
              <Typography variant='subtitle1' fontWeight={700} color='#0f172a'>
                Tus Cuentas Activas en Salón
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Mesas bajo tu atención en curso
              </Typography>
            </div>
            <Link to='/attention' className='dash-link'>
              Abrir nueva mesa →
            </Link>
          </div>

          <div className='waiter-accounts-list'>
            {myOpenAccounts.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant='body2' color='text.secondary'>
                  No tienes cuentas abiertas a tu cargo en este momento.
                </Typography>
              </Box>
            ) : (
              myOpenAccounts.map((acc) => {
                const tableLabel =
                  acc.tables.map((t) => t.name).join(', ') || 'Sin mesa';
                const itemsCount = acc.lines.filter(
                  (l) => l.status === 'ACTIVE'
                ).length;
                return (
                  <div key={acc.id} className='waiter-account-card'>
                    <div className='acc-main-row'>
                      <div className='acc-table-badge'>Mesa {tableLabel}</div>
                      <strong className='acc-total'>S/ {Number(acc.total).toFixed(2)}</strong>
                    </div>
                    <div className='acc-sub-row'>
                      <span>{itemsCount} productos activos</span>
                      <span className='badge-pill gray'>
                        {acc.paymentStatus === 'PAID' ? 'PAGADO' : 'PENDIENTE PAGO'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Footer timestamp */}
        <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center', pt: 1 }}>
          Actualizado: {new Date(lastSync).toLocaleTimeString('es-PE', { timeZone })}
        </Typography>
      </Stack>
    </Container>
  );
}
