import { MoreOptions } from '@/components/operational/MoreOptions';
import {
  FilterAltOutlined,
  TodayOutlined,
  RestartAltOutlined,
  AssessmentOutlined
} from '@mui/icons-material';
import { WorkspaceEmpty } from '@/components/operational/WorkspaceEmpty';
import { operationalLabel } from './labels';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux';
import { restauranteApi } from '@/api';
import { useRestaurantStore } from '../Common/store/restaurantStore';
const kinds: Record<string, string> = {
  sales: 'Ventas confirmadas',
  collections: 'Cobros y métodos',
  settlements: 'Rendiciones',
  'top-products': 'Productos más vendidos',
  slow: 'Comandas >15 minutos',
  discounts: 'Descuentos',
  portions: 'Porciones especiales',
  cancellations: 'Cancelaciones / sustituciones',
  refunds: 'Reembolsos',
  courtesies: 'Cortesías',
  tips: 'Propinas',
  staff: 'Consumo de personal',
  debts: 'Deudas',
  installments: 'Cuotas',
  audit: 'Historial operativo',
  delivery: 'Delivery / para llevar',
  custody: 'Recepción de efectivo courier'
};
const columns: Record<string, string> = {
  occurredAt: 'Fecha',
  userName: 'Usuario',
  userId: 'Usuario ID',
  accountId: 'Atención',
  resourceId: 'Recurso',
  product: 'Producto',
  quantity: 'Cantidad',
  amount: 'Importe',
  currency: 'Moneda',
  method: 'Método',
  modality: 'Modalidad',
  status: 'Estado',
  movementType: 'Movimiento',
  reason: 'Motivo',
  originalUnitPrice: 'Precio original',
  appliedUnitPrice: 'Precio aplicado',
  availabilityUnitsPerItem: 'Consumo de disponibilidad',
  beneficiaryName: 'Beneficiario',
  historicalValue: 'Valor histórico (no venta)',
  initialPayments: 'Pagos iniciales',
  installments: 'Cuotas cobradas',
  remainingPrincipal: 'Principal pendiente',
  outstanding: 'Deuda exigible',
  pendingFoodUnits: 'Comida pendiente de salida',
  dispatchedAt: 'Último despacho registrado',
  deliveredAt: 'Última entrega registrada',
  accountOutstanding: 'Saldo de cuenta',
  pendingDigital: 'Pendiente digital',
  liveExpectedCash: 'Efectivo esperado actual',
  recordedExpectedCash: 'Esperado al rendir',
  deliveredCash: 'Entregado',
  shortage: 'Faltante',
  overage: 'Sobrante',
  seconds: 'Segundos',
  courierCash: 'Efectivo courier',
  courierReceived: 'Efectivo recibido del courier',
  clientName: 'Cliente',
  paymentStatus: 'Estado de pago',
  differenceReason: 'Motivo de diferencia',
  courierName: 'Courier',
  beforeData: 'Antes',
  afterData: 'Después'
};
interface Result {
  kind: string;
  description: string;
  timeZone: string;
  rows: Record<string, unknown>[];
  totals: {
    movementType: string;
    currency: string;
    amount: string;
    records: number;
  }[];
  total: number;
  page: number;
  limit: number;
  capturedAt: string;
}
export function ReportsPage() {
  const user = useSelector(selectAuth).user,
    restaurant = useRestaurantStore((s) => s.restaurant),
    role = user?.role.name;
  const available = Object.keys(kinds).filter((k) =>
    role === 'MOZO'
      ? ['settlements', 'tips', 'audit'].includes(k)
      : role === 'COCINERO'
        ? k === 'slow'
        : true
  );
  const [workers, setWorkers] = useState<
    { id: string; name: string; role: string; isActive: boolean }[]
  >([]);
  useEffect(() => {
    let active = true;
    restauranteApi
      .get<typeof workers>('/operational-reports/directory')
      .then((r) => {
        if (active) setWorkers(r.data);
      })
      .catch(() => {
        if (active) setWorkers([]);
      });
    return () => {
      active = false;
    };
  }, [restaurant?.id]);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: restaurant?.timeZone || 'America/Lima'
  }).format(new Date());
  const [kind, setKind] = useState(available[0] || 'sales'),
    [filters, setFilters] = useState({
      from: today.slice(0, 8) + '01',
      to: today,
      userId: '',
      responsibleUserId: '',
      method: '',
      modality: '',
      status: '',
      movementType: ''
    }),
    [page, setPage] = useState(1),
    [revision, setRevision] = useState(0),
    [result, setResult] = useState<Result>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [appliedFilters, setAppliedFilters] = useState(filters);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setResult(undefined);
    setError('');
    restauranteApi
      .get<Result>(`/operational-reports/${kind}`, {
        params: {
          ...Object.fromEntries(
            Object.entries(appliedFilters).filter(([, v]) => v)
          ),
          page,
          limit: 25
        }
      })
      .then((r) => {
        if (active) setResult(r.data);
      })
      .catch((e) => {
        if (active)
          setError(
            String(
              e.response?.data?.message || 'No se pudo consultar el reporte'
            )
          );
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [kind, page, revision, restaurant?.id, appliedFilters]);
  const methodKinds = ['collections', 'refunds', 'tips', 'installments'],
    noModality = ['settlements', 'audit'],
    states: Record<string, string[]> = {
      settlements: ['OPEN', 'SUBMITTED', 'CLOSED'],
      slow: ['CONFIRMED', 'VOIDED'],
      discounts: ['APPLIED', 'INACTIVE'],
      portions: ['ACTIVE', 'CANCELLED'],
      courtesies: ['ACTIVE', 'CANCELLED'],
      staff: ['ACTIVE', 'CANCELLED'],
      debts: ['OUTSTANDING', 'PAID'],
      delivery: [
        'PREPARING',
        'READY',
        'DISPATCHED',
        'IN_TRANSIT',
        'DELIVERED',
        'CANCELLED'
      ]
    };
  const types: Record<string, string[]> = {
    collections: ['COLLECTION', 'INSTALLMENT'],
    tips: ['DIRECT', 'DIGITAL_RECEIPT', 'DIGITAL_PAYOUT'],
    cancellations: [
      'attention.cancel',
      'attention.cancel-draft',
      'attention.replace',
      'attention.return-consumption'
    ]
  };
  const update = (key: keyof typeof filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const visibleColumns = result?.rows.length
    ? Object.keys(result.rows[0]).filter(
        (k) =>
          !['restaurantId', 'id', 'userId', 'responsibleUserId'].includes(k)
      )
    : [];
  const cell = (key: string, value: unknown) =>
    value === null ? (
      '—'
    ) : typeof value === 'object' ? (
      <details>
        <summary>Ver detalle</summary>
        <pre style={{ whiteSpace: 'pre-wrap', maxWidth: 480 }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    ) : key.endsWith('At') && typeof value === 'string' ? (
      new Date(value).toLocaleString('es-PE', { timeZone: result?.timeZone })
    ) : (
      operationalLabel(String(value))
    );
  const selectReport = (nextKind: string) => {
    setKind(nextKind);
    setPage(1);
    const next = {
      ...filters,
      method: '',
      modality: '',
      status: '',
      movementType: '',
      userId: '',
      responsibleUserId: ''
    };
    setFilters(next);
    setAppliedFilters(next);
  };
  return (
    <Container maxWidth='xl' className='final-page pos-reports'>
      <nav className='pos-report-nav' aria-label='Reportes disponibles'>
        <Typography variant='overline'>Reportes</Typography>
        {available.map((k) => (
          <Button
            key={k}
            aria-current={kind === k ? 'page' : undefined}
            onClick={() => selectReport(k)}
          >
            {kinds[k]}
          </Button>
        ))}
      </nav>
      <Stack spacing={2} className='pos-report-content'>
        <Typography variant='h4'>Reportes operativos</Typography>
        <Typography variant='h6'>
          <AssessmentOutlined sx={{ verticalAlign: 'middle', mr: 1 }} />
          {kinds[kind]}
        </Typography>
        <Alert severity='info'>
          Venta, cobro, deuda, cuota, reembolso, propina y custodia son
          conceptos distintos. Los importes se calculan en servidor. Zona
          horaria: {restaurant?.timeZone}.
        </Alert>
        <TextField
          select
          label='Reporte'
          className='pos-report-select'
          value={kind}
          onChange={(e) => selectReport(e.target.value)}
        >
          {available.map((k) => (
            <MenuItem key={k} value={k}>
              {kinds[k]}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction='row' gap={1} flexWrap='wrap'>
          <Button
            startIcon={<TodayOutlined />}
            disabled={busy}
            onClick={() => {
              const next = { ...filters, from: today, to: today };
              setFilters(next);
              setAppliedFilters(next);
              setPage(1);
              setRevision((n) => n + 1);
            }}
          >
            Hoy
          </Button>
          <Button
            startIcon={<RestartAltOutlined />}
            disabled={busy}
            onClick={() => {
              const next = {
                from: today.slice(0, 8) + '01',
                to: today,
                userId: '',
                responsibleUserId: '',
                method: '',
                modality: '',
                status: '',
                movementType: ''
              };
              setFilters(next);
              setAppliedFilters(next);
              setPage(1);
              setRevision((n) => n + 1);
            }}
          >
            Este mes · limpiar filtros
          </Button>
        </Stack>
        <Stack
          className='report-filters'
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          flexWrap='wrap'
        >
          <TextField
            type='date'
            label='Desde'
            InputLabelProps={{ shrink: true }}
            value={filters.from}
            onChange={(e) => update('from', e.target.value)}
          />
          <TextField
            type='date'
            label='Hasta'
            InputLabelProps={{ shrink: true }}
            value={filters.to}
            onChange={(e) => update('to', e.target.value)}
          />
          <MoreOptions title='Filtros adicionales: usuario, método, modalidad y estado'>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              gap={1}
              flexWrap='wrap'
            >
              {role !== 'MOZO' && (
                <TextField
                  select
                  label='Usuario (opcional)'
                  value={filters.userId}
                  onChange={(e) => update('userId', e.target.value)}
                >
                  <MenuItem value=''>Todos</MenuItem>
                  {workers.map((w) => (
                    <MenuItem key={w.id} value={w.id}>
                      {w.name}
                      {!w.isActive ? ' (inactivo)' : ''}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {!noModality.includes(kind) && role !== 'MOZO' && (
                <TextField
                  select
                  label='Responsable (opcional)'
                  value={filters.responsibleUserId}
                  onChange={(e) => update('responsibleUserId', e.target.value)}
                >
                  <MenuItem value=''>Todos</MenuItem>
                  {workers.map((w) => (
                    <MenuItem key={w.id} value={w.id}>
                      {w.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {methodKinds.includes(kind) && (
                <TextField
                  select
                  label='Método'
                  value={filters.method}
                  onChange={(e) => update('method', e.target.value)}
                >
                  <MenuItem value=''>Todos</MenuItem>
                  {['CASH', 'YAPE', 'CARD'].map((m) => (
                    <MenuItem key={m} value={m}>
                      {operationalLabel(m)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {!noModality.includes(kind) && (
                <TextField
                  select
                  label='Modalidad'
                  value={filters.modality}
                  onChange={(e) => update('modality', e.target.value)}
                >
                  <MenuItem value=''>Todas</MenuItem>
                  {[
                    'TABLE',
                    'TAKE_AWAY',
                    'OWN_DELIVERY',
                    'EXTERNAL_COURIER'
                  ].map((m) => (
                    <MenuItem key={m} value={m}>
                      {operationalLabel(m)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {states[kind] && (
                <TextField
                  select
                  label='Estado'
                  value={filters.status}
                  onChange={(e) => update('status', e.target.value)}
                >
                  <MenuItem value=''>Todos</MenuItem>
                  {states[kind].map((s) => (
                    <MenuItem key={s} value={s}>
                      {operationalLabel(s)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {types[kind] && (
                <TextField
                  select
                  label='Tipo de movimiento'
                  value={filters.movementType}
                  onChange={(e) => update('movementType', e.target.value)}
                >
                  <MenuItem value=''>Todos</MenuItem>
                  {types[kind].map((s) => (
                    <MenuItem key={s} value={s}>
                      {operationalLabel(s)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {kind === 'audit' && (
                <TextField
                  label='Acción (opcional)'
                  value={filters.movementType}
                  onChange={(e) => update('movementType', e.target.value)}
                />
              )}
            </Stack>
          </MoreOptions>
          <Button
            startIcon={<FilterAltOutlined />}
            variant='contained'
            disabled={busy}
            onClick={() => {
              setPage(1);
              setAppliedFilters({ ...filters });
              setRevision((n) => n + 1);
            }}
          >
            Aplicar filtros
          </Button>
        </Stack>
        {busy && <CircularProgress size={24} />}{' '}
        {error && <Alert severity='error'>{error}</Alert>}
        {result && (
          <>
            <Alert severity='info'>{result.description}</Alert>
            <Typography>
              {result.total} resultados · consulta{' '}
              {new Date(result.capturedAt).toLocaleString('es-PE', {
                timeZone: result.timeZone
              })}
            </Typography>
            {result.totals.map((t, i) => (
              <Typography key={i} className='report-total'>
                {operationalLabel(t.movementType)}: {t.amount} {t.currency} ·{' '}
                {t.records} registros
              </Typography>
            ))}
            {!result.rows.length ? (
              <WorkspaceEmpty
                title='Sin movimientos para estos filtros'
                description='Ajusta las fechas o los filtros para consultar otro período.'
              />
            ) : (
              <>
                <TableContainer
                  component={Paper}
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        {visibleColumns.map((k) => (
                          <TableCell key={k}>{columns[k] || k}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.rows.map((r, i) => (
                        <TableRow key={String(r.id || r.productId || i)}>
                          {visibleColumns.map((k) => (
                            <TableCell
                              key={k}
                              sx={{
                                minWidth: 100,
                                maxWidth: 480,
                                overflowWrap: 'anywhere'
                              }}
                            >
                              {cell(k, r[k])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack
                  spacing={1}
                  sx={{ display: { xs: 'flex', sm: 'none' } }}
                  aria-label='Resultados del reporte'
                >
                  {result.rows.map((r, i) => (
                    <Paper
                      key={String(r.id || r.productId || i)}
                      className='report-mobile-card'
                    >
                      <dl>
                        {visibleColumns.slice(0, 4).map((k) => (
                          <div key={k}>
                            <dt>{columns[k] || k}</dt>
                            <dd>{cell(k, r[k])}</dd>
                          </div>
                        ))}
                      </dl>
                      {visibleColumns.length > 4 && (
                        <MoreOptions title='Ver todos los datos del movimiento'>
                          <dl>
                            {visibleColumns.slice(4).map((k) => (
                              <div key={k}>
                                <dt>{columns[k] || k}</dt>
                                <dd>{cell(k, r[k])}</dd>
                              </div>
                            ))}
                          </dl>
                        </MoreOptions>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </>
            )}
            <Stack direction='row'>
              <Button
                disabled={busy || page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Typography>Página {page}</Typography>
              <Button
                disabled={busy || page * 25 >= result.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Container>
  );
}
