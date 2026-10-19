import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Container,
  LinearProgress,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer
} from '@mui/material';
import { Link } from 'react-router-dom';
import { restauranteApi } from '@/api';
import { useWorkerAccess } from '@/hooks/useWorkerAccess';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { WorkspaceEmpty } from '@/components/operational/WorkspaceEmpty';
import { MoreOptions } from '@/components/operational/MoreOptions';
import {
  DateRange,
  periodRange,
  reportAmount,
  reportLink,
  ReportPeriod,
  validReportRange
} from './reportView';
import { ReportPeriodControls } from './ReportPeriodControls';
import './insights.css';
interface FinancialSummary {
  currency: string;
  netSales: string;
  grossCollections: string;
  refunds: string;
  netCollections: string;
  cash: string;
  yape: string;
  card: string;
  marketPurchases: string;
  beveragePurchases: string;
  otherExpenses: string;
  totalExpenses: string;
  operatingResult: string;
}
interface Overview {
  from: string;
  to: string;
  timeZone: string;
  capturedAt: string;
  financial: FinancialSummary[];
  counts: {
    accounts: number;
    dispatches: number;
    lateDispatches: number;
    warningDispatches: number;
    openAccounts: number;
    pendingSettlements: number;
    stockDifferences: number;
    settlementDifferences: number;
  };
  incidents: {
    cancellations: number;
    substitutions: number;
    returns: number;
    refunds: number;
    discounts: number;
    specialPrices: number;
    courtesies: number;
    debts: number;
  };
  products: { foodQuantity: string; drinkQuantity: string };
}
interface WorkerResult {
  id: string;
  userId: string;
  userName: string;
  currency: string;
  cash: string;
  yape: string;
  card: string;
  amount: string;
}
interface ProductResult {
  productId: string;
  product: string;
  quantity: string;
  amount: string;
  currency: string;
}
export function OverviewPage() {
  const restaurant = useRestaurantStore((s) => s.restaurant),
    timeZone = restaurant?.timeZone || 'America/Lima';
  const can = useWorkerAccess();
  const [period, setPeriod] = useState<ReportPeriod>('today'),
    [range, setRange] = useState<DateRange>(() =>
      periodRange('today', timeZone)
    );
  const [appliedRange, setAppliedRange] = useState(range),
    [data, setData] = useState<Overview>(),
    [workers, setWorkers] = useState<WorkerResult[]>([]),
    [products, setProducts] = useState<ProductResult[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [detailError, setDetailError] = useState('');
  const generation = useRef(0);
  const load = useCallback(async () => {
    const ticket = ++generation.current;
    setBusy(true);
    setError('');
    setDetailError('');
    const responses = await Promise.allSettled([
      restauranteApi.get<Overview>('/operational-reports/overview', {
        params: appliedRange
      }),
      restauranteApi.get<{ rows: WorkerResult[] }>(
        '/operational-reports/waiter-results',
        { params: { ...appliedRange, page: 1, limit: 5 } }
      ),
      restauranteApi.get<{ rows: ProductResult[] }>(
        '/operational-reports/top-products',
        { params: { ...appliedRange, page: 1, limit: 5 } }
      )
    ]);
    if (ticket !== generation.current) return;
    const [overview, collectors, ranking] = responses;
    if (overview.status === 'fulfilled') setData(overview.value.data);
    else
      setError(
        'No se pudo actualizar el resumen. Reintenta; los datos anteriores, si existen, pueden estar desactualizados.'
      );
    setWorkers(
      collectors.status === 'fulfilled' ? collectors.value.data.rows : []
    );
    setProducts(ranking.status === 'fulfilled' ? ranking.value.data.rows : []);
    if (collectors.status === 'rejected' || ranking.status === 'rejected')
      setDetailError(
        'No se pudo consultar alguno de los detalles de trabajadores o productos. Puedes reintentar la consulta.'
      );
    setBusy(false);
  }, [restaurant?.id, appliedRange]);
  useEffect(() => {
    setData(undefined);
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);
  const updateRange = (next: DateRange) => {
    if (validReportRange(next)) setAppliedRange({ ...next });
  };
  const details = (kind: string, label = 'Ver detalle') => (
    <Button component={Link} to={reportLink(kind, appliedRange)} size='small'>
      {label}
    </Button>
  );
  const metric = (
    label: string,
    value: string | number,
    kind: string,
    href?: string
  ) => (
    <Link key={label} to={href || reportLink(kind, appliedRange)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </Link>
  );
  const breakdown = (label: string, value: string, currency: string) => (
    <div className='insights-breakdown' key={label}>
      <span>{label}</span>
      <strong>{reportAmount(value, currency)}</strong>
    </div>
  );
  return (
    <Container maxWidth='xl' className='final-page pos-overview point-insights'>
      <Stack spacing={1.5}>
        <Stack
          direction='row'
          justifyContent='space-between'
          gap={1}
          flexWrap='wrap'
          alignItems='center'
        >
          <div>
            <Typography variant='h4' component='h1'>
              Resumen operativo
            </Typography>
            <Typography color='text.secondary'>
              Ventas, cobranzas y egresos del restaurante · {timeZone}
            </Typography>
          </div>
          <Button onClick={() => void load()} disabled={busy}>
            Actualizar resumen
          </Button>
        </Stack>
        <div className='insights-period'>
          <ReportPeriodControls
            period={period}
            range={range}
            timeZone={timeZone}
            onChange={(p, next) => {
              setPeriod(p);
              setRange(next);
              if (p !== 'custom') updateRange(next);
            }}
          />
          {period === 'custom' && (
            <Button
              sx={{ mt: 1 }}
              variant='contained'
              disabled={busy || !validReportRange(range)}
              onClick={() => updateRange(range)}
            >
              Consultar período
            </Button>
          )}
          {!validReportRange(range) && (
            <Typography color='error'>
              Selecciona un rango válido de hasta 366 días.
            </Typography>
          )}
        </div>
        {busy && <LinearProgress aria-label='Actualizando resumen' />}
        {error && (
          <Alert
            severity='warning'
            action={
              <Button disabled={busy} onClick={() => void load()}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        {detailError && <Alert severity='warning'>{detailError}</Alert>}
        {data && (
          <>
            <Typography variant='body2' color='text.secondary'>
              Período consultado: {data.from} — {data.to}
            </Typography>
            {!data.financial.length && (
              <WorkspaceEmpty
                title='Sin movimientos financieros en este período'
                description='Las ventas, cobranzas y gastos registrados se mostrarán por separado cuando existan.'
              />
            )}
            {data.financial.map((f) => (
              <Stack spacing={1.5} key={f.currency}>
                <div className='insights-financial-grid'>
                  <Card className='insights-stat'>
                    <Typography color='text.secondary'>Ventas netas</Typography>
                    <Typography component='h3' variant='h4'>
                      {reportAmount(f.netSales, f.currency)}
                    </Typography>
                    <Typography variant='caption'>
                      Consumo confirmado neto de descuentos.
                    </Typography>
                    <div>{details('sales')}</div>
                  </Card>
                  <Card className='insights-stat'>
                    <Typography color='text.secondary'>
                      Cobranzas netas
                    </Typography>
                    <Typography component='h3' variant='h4'>
                      {reportAmount(f.netCollections, f.currency)}
                    </Typography>
                    <Typography variant='caption'>
                      Incluye abonos; descuenta reembolsos.
                    </Typography>
                    <div>{details('collections')}</div>
                  </Card>
                  <Card className='insights-stat'>
                    <Typography color='text.secondary'>
                      Egresos operativos
                    </Typography>
                    <Typography component='h3' variant='h4'>
                      {reportAmount(f.totalExpenses, f.currency)}
                    </Typography>
                    <Typography variant='caption'>
                      Mercado + bebidas + otros egresos.
                    </Typography>
                    <div>{details('expenses')}</div>
                  </Card>
                  <Card
                    className={`insights-stat insights-stat--result${f.operatingResult.startsWith('-') ? ' insights-stat--negative' : ''}`}
                  >
                    <Typography color='text.secondary'>
                      Resultado sobre cobranzas
                    </Typography>
                    <Typography component='h3' variant='h4'>
                      {reportAmount(f.operatingResult, f.currency)}
                    </Typography>
                    <Typography variant='caption'>
                      Cobranzas netas menos egresos operativos.
                    </Typography>
                  </Card>
                </div>
                <div className='insights-detail-grid'>
                  <Card className='insights-section'>
                    <Stack direction='row' justifyContent='space-between'>
                      <Typography component='h2' variant='h6'>
                        Cómo se cobró
                      </Typography>
                      {details('collections')}
                    </Stack>
                    <Typography variant='caption'>
                      Medios cobrados antes de reembolsos. Cada componente mixto
                      se cuenta una vez.
                    </Typography>
                    {breakdown('Efectivo', f.cash, f.currency)}
                    {breakdown('Yape', f.yape, f.currency)}
                    {breakdown('Tarjeta / POS', f.card, f.currency)}
                    {breakdown('Total cobrado', f.grossCollections, f.currency)}
                    {breakdown('Reembolsos del período', f.refunds, f.currency)}
                    {breakdown('Cobranza neta', f.netCollections, f.currency)}
                  </Card>
                  <Card className='insights-section'>
                    <Stack direction='row' justifyContent='space-between'>
                      <Typography component='h2' variant='h6'>
                        En qué se gastó
                      </Typography>
                      {details('expenses')}
                    </Stack>
                    {breakdown(
                      'Compras de mercado',
                      f.marketPurchases,
                      f.currency
                    )}
                    {breakdown(
                      'Compras de bebidas',
                      f.beveragePurchases,
                      f.currency
                    )}
                    {breakdown('Otros egresos', f.otherExpenses, f.currency)}
                    {can('configuration') && (
                      <Button
                        component={Link}
                        to={`/supplies?${new URLSearchParams({ view: 'expenses', ...appliedRange })}`}
                      >
                        Compras y bebidas
                      </Button>
                    )}
                    <MoreOptions title='Cómo se obtiene el resultado'>
                      <Typography variant='body2'>
                        Resultado operativo sobre cobranzas = cobranzas del
                        período (pagos y abonos) − reembolsos del período −
                        compras de mercado − compras de bebidas − otros egresos.
                        Las propinas y la entrega de efectivo del courier no son
                        ventas ni un segundo cobro. Las ventas fiadas se
                        reconocen como venta; sus abonos son cobranzas
                        posteriores.
                      </Typography>
                    </MoreOptions>
                  </Card>
                </div>
              </Stack>
            ))}
            <Card className='insights-section'>
              <Typography component='h2' variant='h6' sx={{ mb: 1 }}>
                Operación del período
              </Typography>
              <div className='insights-metric-list'>
                {metric(
                  'Cuentas abiertas en el período',
                  data.counts.accounts,
                  'accounts'
                )}
                {metric(
                  'Comandas confirmadas',
                  data.counts.dispatches,
                  'dispatches'
                )}
                {metric(
                  'Platos vendidos',
                  data.products.foodQuantity,
                  'products',
                  reportLink('products', appliedRange, { productKind: 'FOOD' })
                )}
                {metric(
                  'Bebidas vendidas',
                  data.products.drinkQuantity,
                  'products',
                  reportLink('products', appliedRange, { productKind: 'DRINK' })
                )}
                {metric(
                  'Envíos con demora >15 min',
                  data.counts.lateDispatches,
                  'slow'
                )}
                {metric(
                  'Cuentas abiertas actualmente',
                  data.counts.openAccounts,
                  'accounts',
                  '/attention'
                )}
              </div>
              <MoreOptions title='Incidencias y pendientes'>
                <div className='insights-metric-list'>
                  {metric(
                    'Cancelaciones',
                    data.incidents.cancellations,
                    'cancellations'
                  )}
                  {metric(
                    'Sustituciones',
                    data.incidents.substitutions,
                    'substitutions'
                  )}
                  {metric(
                    'Devoluciones de consumo',
                    data.incidents.returns,
                    'returns'
                  )}
                  {metric('Reembolsos', data.incidents.refunds, 'refunds')}
                  {metric('Descuentos', data.incidents.discounts, 'discounts')}
                  {metric(
                    'Precios especiales',
                    data.incidents.specialPrices,
                    'special-prices'
                  )}
                  {metric('Cortesías', data.incidents.courtesies, 'courtesies')}
                  {metric('Deudas registradas', data.incidents.debts, 'debts')}
                  {metric(
                    'Diferencias de stock',
                    data.counts.stockDifferences,
                    'stock-movements',
                    reportLink('stock-movements', appliedRange, {
                      movementType: 'MANUAL_ADJUSTMENT'
                    })
                  )}
                  {metric(
                    'Rendiciones por revisar actualmente',
                    data.counts.pendingSettlements,
                    'settlements',
                    '/finance?view=shifts'
                  )}
                  {metric(
                    'Diferencias de rendición',
                    data.counts.settlementDifferences,
                    'settlements'
                  )}
                  {metric(
                    'Comandas desde 12 min',
                    data.counts.warningDispatches,
                    'dispatches'
                  )}
                </div>
              </MoreOptions>
            </Card>
            <div className='insights-detail-grid'>
              <Card className='insights-section'>
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  alignItems='center'
                  gap={1}
                >
                  <Typography component='h2' variant='h6'>
                    Cobranzas por trabajador
                  </Typography>
                  {details('waiter-results', 'Ver todos')}
                </Stack>
                <Typography variant='caption'>
                  Atribuidas a quien cobró, incluidos abonos; las propinas se
                  consultan aparte.
                </Typography>
                {!workers.length ? (
                  <WorkspaceEmpty
                    title='Sin cobranzas registradas'
                    description='Los cobros del período aparecerán atribuidos a su cobrador real.'
                  />
                ) : (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Trabajador</TableCell>
                          <TableCell>Efectivo</TableCell>
                          <TableCell>Yape</TableCell>
                          <TableCell>Tarjeta</TableCell>
                          <TableCell>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {workers.map((w) => (
                          <TableRow key={`${w.userId}-${w.currency}`}>
                            <TableCell>
                              <Button
                                component={Link}
                                to={reportLink('waiter-results', appliedRange, {
                                  userId: w.userId
                                })}
                              >
                                {w.userName}
                              </Button>
                            </TableCell>
                            <TableCell>
                              {reportAmount(w.cash, w.currency)}
                            </TableCell>
                            <TableCell>
                              {reportAmount(w.yape, w.currency)}
                            </TableCell>
                            <TableCell>
                              {reportAmount(w.card, w.currency)}
                            </TableCell>
                            <TableCell>
                              {reportAmount(w.amount, w.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
              <Card className='insights-section'>
                <Stack direction='row' justifyContent='space-between' gap={1}>
                  <Typography component='h2' variant='h6'>
                    Productos más vendidos
                  </Typography>
                  {details('top-products')}
                </Stack>
                {!products.length ? (
                  <WorkspaceEmpty
                    title='Sin productos vendidos'
                    description='El ranking utiliza consumos confirmados del período.'
                  />
                ) : (
                  products.map((p) => (
                    <div
                      className='insights-breakdown'
                      key={`${p.productId}-${p.currency}`}
                    >
                      <div>
                        <Typography fontWeight={600}>{p.product}</Typography>
                        <Typography variant='caption'>
                          {p.quantity} unidades
                        </Typography>
                      </div>
                      <strong>{reportAmount(p.amount, p.currency)}</strong>
                    </div>
                  ))
                )}
              </Card>
            </div>
            <Typography variant='caption' color='text.secondary'>
              Consultado:{' '}
              {new Date(data.capturedAt).toLocaleString('es-PE', {
                timeZone: data.timeZone
              })}
              . Resultado operativo sobre cobranzas; no representa utilidad
              contable ni costo de recetas.
            </Typography>
          </>
        )}
      </Stack>
    </Container>
  );
}
