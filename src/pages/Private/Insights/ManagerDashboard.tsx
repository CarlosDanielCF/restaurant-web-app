import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  LinearProgress,
  Stack,
  Typography,
  Tooltip
} from '@mui/material';
import { Link } from 'react-router-dom';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import TableBarRoundedIcon from '@mui/icons-material/TableBarRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ShoppingBagRoundedIcon from '@mui/icons-material/ShoppingBagRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import LocalBarRoundedIcon from '@mui/icons-material/LocalBarRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
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
import { Stock, Page } from '../Supplies/types';
import './insights.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

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

interface ProductResult {
  productId: string;
  product: string;
  quantity: string;
  amount: string;
  currency: string;
}

interface TableStatus {
  id: string;
  name: string;
  isActive: boolean;
  isAvailable: boolean;
}

interface SalesEvolutionRow {
  paidAt?: string;
  recordedAt?: string;
  createdAt?: string;
  operatingDate?: string;
  consumption?: string | number;
  netConsumption?: string | number;
  collected?: string | number;
}

interface Props {
  previewRoleSelector?: React.ReactNode;
}

export function ManagerDashboard({ previewRoleSelector }: Props) {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const timeZone = restaurant?.timeZone || 'America/Lima';
  const can = useWorkerAccess();

  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [range, setRange] = useState<DateRange>(() =>
    periodRange('today', timeZone)
  );
  const [appliedRange, setAppliedRange] = useState(range);
  const [data, setData] = useState<Overview>();
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [lowStocks, setLowStocks] = useState<Stock[]>([]);
  const [salesRows, setSalesRows] = useState<SalesEvolutionRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const generation = useRef(0);

  const load = useCallback(async () => {
    const ticket = ++generation.current;
    setBusy(true);
    setError('');

    try {
      const [
        overviewRes,
        rankingRes,
        tablesRes,
        stocksRes,
        salesRes
      ] = await Promise.allSettled([
        restauranteApi.get<Overview>('/operational-reports/overview', {
          params: appliedRange
        }),
        restauranteApi.get<{ rows: ProductResult[] }>(
          '/operational-reports/top-products',
          { params: { ...appliedRange, page: 1, limit: 6 } }
        ),
        restauranteApi.get<TableStatus[]>('/tables', { timeout: 10000 }),
        restauranteApi.get<Page<Stock>>('/supplies/stocks', {
          params: { page: 1, pageSize: 50 },
          timeout: 10000
        }),
        restauranteApi.get<{ rows: SalesEvolutionRow[] }>(
          '/operational-reports/sales',
          { params: { ...appliedRange, page: 1, limit: 100 }, timeout: 12000 }
        )
      ]);

      if (ticket !== generation.current) return;

      if (overviewRes.status === 'fulfilled') {
        setData(overviewRes.value.data);
      } else {
        setError('No se pudo actualizar el resumen operativo general.');
      }

      if (rankingRes.status === 'fulfilled') {
        setProducts(rankingRes.value.data.rows || []);
      }

      if (tablesRes.status === 'fulfilled') {
        setTables(tablesRes.value.data || []);
      }

      if (stocksRes.status === 'fulfilled') {
        const rows = stocksRes.value.data.rows || [];
        setLowStocks(
          rows.filter((s) => s.controlStock && Number(s.quantity) <= 5)
        );
      }

      if (salesRes.status === 'fulfilled') {
        setSalesRows(salesRes.value.data.rows || []);
      }
    } catch {
      if (ticket === generation.current) {
        setError('Error al conectar con los servicios de datos.');
      }
    } finally {
      if (ticket === generation.current) setBusy(false);
    }
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

  const defaultFinancial: FinancialSummary = {
    currency: 'PEN',
    netSales: '0.00',
    grossCollections: '0.00',
    refunds: '0.00',
    netCollections: '0.00',
    cash: '0.00',
    yape: '0.00',
    card: '0.00',
    marketPurchases: '0.00',
    beveragePurchases: '0.00',
    totalExpenses: '0.00',
    operatingResult: '0.00'
  };
  const f = data?.financial?.[0] || defaultFinancial;
  const currency = f.currency || 'PEN';

  // Metrics calculations
  const activeTables = tables.filter((t) => t.isActive);
  const occupiedTables = activeTables.filter((t) => !t.isAvailable).length;
  const availableTables = activeTables.filter((t) => t.isAvailable).length;
  const occupancyPercent = activeTables.length
    ? Math.round((occupiedTables / activeTables.length) * 100)
    : 0;

  const totalAccounts = data?.counts?.accounts || 0;
  const netSalesAmount = Number(f?.netSales) || 0;
  const avgTicket =
    totalAccounts > 0 ? (netSalesAmount / totalAccounts).toFixed(2) : '0.00';

  const cashAmount = Number(f?.cash) || 0;
  const yapeAmount = Number(f?.yape) || 0;
  const cardAmount = Number(f?.card) || 0;
  const totalMethods = cashAmount + yapeAmount + cardAmount;

  // Donut chart config
  const doughnutData = {
    labels: ['Efectivo', 'Yape / Plin', 'Tarjeta / POS'],
    datasets: [
      {
        data:
          totalMethods > 0
            ? [cashAmount, yapeAmount, cardAmount]
            : [0, 0, 0],
        backgroundColor: ['#10b981', '#8b5cf6', '#0284c7'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: { size: 11, family: 'Inter, system-ui, sans-serif' },
          padding: 12
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.parsed || 0;
            const pct =
              totalMethods > 0 ? Math.round((val / totalMethods) * 100) : 0;
            return ` ${context.label}: ${reportAmount(val.toFixed(2), currency)} (${pct}%)`;
          }
        }
      }
    },
    cutout: '68%'
  };

  // Evolution chart calculation
  const isSingleDay =
    appliedRange.from.split('T')[0] === appliedRange.to.split('T')[0];

  const evolutionPoints = (() => {
    if (isSingleDay) {
      // Group by hours 08:00 to 23:00
      const hours = [
        '08', '09', '10', '11', '12', '13', '14', '15',
        '16', '17', '18', '19', '20', '21', '22', '23'
      ];
      const sums: Record<string, number> = {};
      hours.forEach((h) => (sums[h] = 0));

      salesRows.forEach((r) => {
        const rawDate = r.paidAt || r.recordedAt || r.createdAt;
        if (!rawDate) return;
        try {
          const d = new Date(rawDate);
          const hStr = d.getHours().toString().padStart(2, '0');
          if (sums[hStr] !== undefined) {
            const amt = Number(r.collected || r.netConsumption || r.consumption || 0);
            sums[hStr] += amt;
          }
        } catch {
          // ignore date parse errors
        }
      });

      return {
        labels: hours.map((h) => `${h}:00`),
        values: hours.map((h) => sums[h])
      };
    } else {
      // Group by date
      const dateMap = new Map<string, number>();
      salesRows.forEach((r) => {
        const rawDate = r.paidAt || r.recordedAt || r.createdAt || r.operatingDate;
        if (!rawDate) return;
        const key = rawDate.split('T')[0];
        const amt = Number(r.collected || r.netConsumption || r.consumption || 0);
        dateMap.set(key, (dateMap.get(key) || 0) + amt);
      });

      const sortedDates = Array.from(dateMap.keys()).sort();
      if (!sortedDates.length) {
        return {
          labels: [appliedRange.from.split('T')[0], appliedRange.to.split('T')[0]],
          values: [0, 0]
        };
      }
      return {
        labels: sortedDates.map((d) => d.slice(5)), // MM-DD
        values: sortedDates.map((d) => dateMap.get(d) || 0)
      };
    }
  })();

  const evolutionChartData = {
    labels: evolutionPoints.labels,
    datasets: [
      {
        label: 'Ventas acumuladas (S/)',
        data: evolutionPoints.values,
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#0d9488',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6
      }
    ]
  };

  const evolutionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            ` Ventas: ${reportAmount(context.parsed.y.toFixed(2), currency)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { size: 10 },
          callback: (val: any) => `S/${val}`
        }
      }
    }
  };

  // Top products max for relative bar calculation
  const maxProductQty = Math.max(
    ...products.map((p) => Number(p.quantity) || 0),
    1
  );

  return (
    <Container maxWidth='xl' className='final-page pos-overview point-insights'>
      <Stack spacing={2}>
        {/* Header toolbar */}
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
          flexWrap='wrap'
          gap={1.5}
        >
          <Box>
            <Typography variant='h5' component='h1' fontWeight={700} color='#0f172a'>
              Dashboard Ejecutivo
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Control operativo y financiero en tiempo real • {timeZone}
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
          </Stack>
        </Stack>

        {/* Date period controls */}
        <Box className='insights-period'>
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
              size='small'
              disabled={busy || !validReportRange(range)}
              onClick={() => updateRange(range)}
            >
              Aplicar rango
            </Button>
          )}
        </Box>

        {busy && <LinearProgress aria-label='Cargando datos del dashboard' sx={{ borderRadius: 1 }} />}

        {error && (
          <Alert
            severity='warning'
            action={
              <Button size='small' disabled={busy} onClick={() => void load()}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {data && (
          <>
            {/* Primary Executive KPIs Grid */}
            <div className='dashboard-kpi-grid'>
              {/* Ventas Netas */}
              <Card className='dash-kpi-card highlight-turquoise'>
                <div className='dash-kpi-header'>
                  <span className='dash-kpi-title'>Ventas Netas</span>
                  <div className='dash-kpi-icon-wrap turquoise'>
                    <AttachMoneyRoundedIcon fontSize='small' />
                  </div>
                </div>
                <div className='dash-kpi-value'>
                  {reportAmount(f.netSales, currency)}
                </div>
                <div className='dash-kpi-footer'>
                  <span>Cobranzas netas: {reportAmount(f.netCollections, currency)}</span>
                  <Link to={reportLink('sales', appliedRange)} className='dash-link'>
                    Ver detalle →
                  </Link>
                </div>
              </Card>

              {/* Pedidos & Cuentas */}
              <Card className='dash-kpi-card'>
                <div className='dash-kpi-header'>
                  <span className='dash-kpi-title'>Pedidos del día</span>
                  <div className='dash-kpi-icon-wrap blue'>
                    <ReceiptLongRoundedIcon fontSize='small' />
                  </div>
                </div>
                <div className='dash-kpi-value'>{data.counts.accounts}</div>
                <div className='dash-kpi-footer'>
                  <span className='badge-pill turquoise'>
                    {data.counts.openAccounts} abiertas ahora
                  </span>
                  <Link to='/attention' className='dash-link'>
                    Mesas →
                  </Link>
                </div>
              </Card>

              {/* Mesas salón */}
              <Card className='dash-kpi-card'>
                <div className='dash-kpi-header'>
                  <span className='dash-kpi-title'>Mesas Salón</span>
                  <div className='dash-kpi-icon-wrap amber'>
                    <TableBarRoundedIcon fontSize='small' />
                  </div>
                </div>
                <div className='dash-kpi-value'>
                  {occupiedTables} <span className='unit'>/ {activeTables.length}</span>
                </div>
                <div className='dash-kpi-footer'>
                  <span className={`badge-pill ${occupancyPercent > 70 ? 'amber' : 'green'}`}>
                    {occupancyPercent}% ocupadas ({availableTables} libres)
                  </span>
                </div>
              </Card>

              {/* Ticket Promedio */}
              <Card className='dash-kpi-card'>
                <div className='dash-kpi-header'>
                  <span className='dash-kpi-title'>Ticket Promedio</span>
                  <div className='dash-kpi-icon-wrap purple'>
                    <TrendingUpRoundedIcon fontSize='small' />
                  </div>
                </div>
                <div className='dash-kpi-value'>
                  {reportAmount(avgTicket, currency)}
                </div>
                <div className='dash-kpi-footer'>
                  <span>Por comanda facturada</span>
                </div>
              </Card>

              {/* Pedidos demorados >15m */}
              <Card className='dash-kpi-card'>
                <div className='dash-kpi-header'>
                  <span className='dash-kpi-title'>Demoras Cocina (&gt;15m)</span>
                  <div className={`dash-kpi-icon-wrap ${data.counts.lateDispatches > 0 ? 'red' : 'green'}`}>
                    <AccessTimeRoundedIcon fontSize='small' />
                  </div>
                </div>
                <div className={`dash-kpi-value ${data.counts.lateDispatches > 0 ? 'text-danger' : 'text-success'}`}>
                  {data.counts.lateDispatches}
                </div>
                <div className='dash-kpi-footer'>
                  {data.counts.warningDispatches > 0 ? (
                    <span className='badge-pill amber'>{data.counts.warningDispatches} en aviso (12-15m)</span>
                  ) : (
                    <span className='text-muted'>Sin demoras críticas</span>
                  )}
                  <Link to='/kitchen' className='dash-link'>
                    Cocina →
                  </Link>
                </div>
              </Card>

              {/* Compras / Egresos */}
              <Card className='dash-kpi-card'>
                <div className='dash-kpi-header'>
                  <span className='dash-kpi-title'>Egresos Operativos</span>
                  <div className='dash-kpi-icon-wrap amber'>
                    <ShoppingBagRoundedIcon fontSize='small' />
                  </div>
                </div>
                <div className='dash-kpi-value'>
                  {reportAmount(f.totalExpenses, currency)}
                </div>
                <div className='dash-kpi-footer'>
                  <span>Mercado: {reportAmount(f.marketPurchases, currency)}</span>
                  <span>Bebidas: {reportAmount(f.beveragePurchases, currency)}</span>
                </div>
              </Card>

              {/* Resultado Operativo */}
              <Card
                className={`dash-kpi-card ${
                  f.operatingResult.startsWith('-')
                    ? 'highlight-negative'
                    : 'highlight-positive'
                }`}
              >
                <div className='dash-kpi-header'>
                  <span className='dash-kpi-title'>Resultado Operativo</span>
                  <div className='dash-kpi-icon-wrap emerald'>
                    <AccountBalanceWalletRoundedIcon fontSize='small' />
                  </div>
                </div>
                <div
                  className={`dash-kpi-value ${
                    f.operatingResult.startsWith('-')
                      ? 'text-danger'
                      : 'text-success'
                  }`}
                >
                  {reportAmount(f.operatingResult, currency)}
                </div>
                <div className='dash-kpi-footer'>
                  <span>Cobranzas netas - Egresos</span>
                  <Tooltip title='Cobranzas netas menos compras del período. No representa utilidad contable.'>
                    <span className='dash-info-badge'>?</span>
                  </Tooltip>
                </div>
              </Card>
            </div>

            {/* Visual Charts Section: Evolución + Formas de Pago */}
            <div className='dashboard-charts-grid'>
              {/* Sales Evolution Chart */}
              <Card className='dash-chart-card'>
                <div className='dash-card-header'>
                  <div>
                    <Typography variant='subtitle1' fontWeight={700} color='#0f172a'>
                      Evolución de Ventas
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {isSingleDay ? 'Comportamiento horario de ventas' : 'Tendencia diaria del período'}
                    </Typography>
                  </div>
                  <Chip
                    size='small'
                    label={isSingleDay ? 'Por Hora' : 'Por Día'}
                    sx={{ bgcolor: '#f0fdfa', color: '#0d9488', fontWeight: 600, fontSize: '0.75rem' }}
                  />
                </div>
                <div className='dash-chart-wrapper'>
                  {salesRows.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography variant='body2' color='text.secondary'>
                        Sin ventas registradas en el período para graficar
                      </Typography>
                    </Box>
                  ) : (
                    <Line data={evolutionChartData} options={evolutionChartOptions} />
                  )}
                </div>
              </Card>

              {/* Payment Methods Donut */}
              <Card className='dash-chart-card'>
                <div className='dash-card-header'>
                  <div>
                    <Typography variant='subtitle1' fontWeight={700} color='#0f172a'>
                      Ventas por Forma de Pago
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Distribución de cobranzas registradas
                    </Typography>
                  </div>
                  <Link to={reportLink('collections', appliedRange)} className='dash-link'>
                    Ver detalle →
                  </Link>
                </div>
                <div className='dash-chart-wrapper donut-box'>
                  {totalMethods === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography variant='body2' color='text.secondary'>
                        Sin cobros registrados en este período
                      </Typography>
                    </Box>
                  ) : (
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  )}
                </div>
                <div className='dash-donut-legend-row'>
                  <div className='dash-legend-item'>
                    <span className='dash-legend-dot' style={{ background: '#10b981' }} />
                    <span className='dash-legend-label'>Efectivo</span>
                    <strong className='dash-legend-val'>{reportAmount(f.cash, currency)}</strong>
                  </div>
                  <div className='dash-legend-item'>
                    <span className='dash-legend-dot' style={{ background: '#8b5cf6' }} />
                    <span className='dash-legend-label'>Yape / Plin</span>
                    <strong className='dash-legend-val'>{reportAmount(f.yape, currency)}</strong>
                  </div>
                  <div className='dash-legend-item'>
                    <span className='dash-legend-dot' style={{ background: '#0284c7' }} />
                    <span className='dash-legend-label'>Tarjeta / POS</span>
                    <strong className='dash-legend-val'>{reportAmount(f.card, currency)}</strong>
                  </div>
                </div>
              </Card>
            </div>

            {/* Ranking + Stock + Operational Alerts */}
            <div className='dashboard-bottom-grid'>
              {/* Ranking Platos y Productos más vendidos */}
              <Card className='dash-section-card'>
                <div className='dash-card-header'>
                  <div>
                    <Typography variant='subtitle1' fontWeight={700} color='#0f172a'>
                      Platos y Productos Más Vendidos
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Consumos confirmados del período
                    </Typography>
                  </div>
                  <Link to={reportLink('top-products', appliedRange)} className='dash-link'>
                    Ranking completo →
                  </Link>
                </div>
                <div className='dash-ranking-list'>
                  {products.length === 0 ? (
                    <WorkspaceEmpty
                      title='Sin productos vendidos'
                      description='Los platos y bebidas más consumidos aparecerán aquí automáticamente.'
                    />
                  ) : (
                    products.slice(0, 5).map((p, idx) => {
                      const qty = Number(p.quantity) || 0;
                      const pct = Math.round((qty / maxProductQty) * 100);
                      return (
                        <div key={`${p.productId}-${idx}`} className='dash-ranking-item'>
                          <div className={`dash-rank-badge rank-${idx + 1}`}>
                            #{idx + 1}
                          </div>
                          <div className='dash-rank-info'>
                            <div className='dash-rank-title-row'>
                              <span className='dash-rank-name'>{p.product}</span>
                              <strong className='dash-rank-amount'>
                                {reportAmount(p.amount, p.currency)}
                              </strong>
                            </div>
                            <div className='dash-rank-bar-bg'>
                              <div
                                className='dash-rank-bar-fill'
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className='dash-rank-units'>{p.quantity} unidades vendidas</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Stock Bajo Bebidas Directas + Alertas Operativas */}
              <div className='dash-alerts-stack'>
                {/* Stock Bajo Bebidas */}
                <Card className='dash-section-card'>
                  <div className='dash-card-header'>
                    <div>
                      <Typography variant='subtitle1' fontWeight={700} color='#0f172a'>
                        Stock Bajo Bebidas Directas
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Existencias críticas en barra / almacén
                      </Typography>
                    </div>
                    {can('configuration') && (
                      <Link to='/supplies' className='dash-link'>
                        Gestionar stock →
                      </Link>
                    )}
                  </div>
                  <div className='dash-stock-list'>
                    {lowStocks.length === 0 ? (
                      <div className='dash-empty-stock-ok'>
                        <span className='stock-ok-icon'>✓</span>
                        <span>Todas las bebidas directas tienen stock suficiente (&gt;5 u).</span>
                      </div>
                    ) : (
                      lowStocks.map((s) => {
                        const qty = Number(s.quantity);
                        const isDepleted = qty <= 0;
                        return (
                          <div key={s.id} className='dash-stock-row'>
                            <div className='dash-stock-name-box'>
                              <LocalBarRoundedIcon
                                fontSize='small'
                                sx={{ color: isDepleted ? '#ef4444' : '#f59e0b' }}
                              />
                              <span className='dash-stock-name'>
                                {s.productName}
                                {s.optionName ? ` (${s.optionName})` : ''}
                              </span>
                            </div>
                            <span
                              className={`badge-pill ${
                                isDepleted ? 'red' : qty <= 2 ? 'amber' : 'yellow'
                              }`}
                            >
                              {isDepleted ? 'AGOTADO (0 u)' : `${qty} unidades`}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

                {/* Alertas e Incidencias Operativas */}
                <Card className='dash-section-card'>
                  <div className='dash-card-header'>
                    <div>
                      <Typography variant='subtitle1' fontWeight={700} color='#0f172a'>
                        Alertas Operativas del Período
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Incidencias, diferencias y revisiones pendientes
                      </Typography>
                    </div>
                  </div>
                  <div className='dash-incidents-grid'>
                    <div className='dash-incident-item'>
                      <span className='dash-inc-label'>Cancelaciones</span>
                      <strong className={`dash-inc-val ${data.incidents.cancellations > 0 ? 'alert' : ''}`}>
                        {data.incidents.cancellations}
                      </strong>
                    </div>
                    <div className='dash-incident-item'>
                      <span className='dash-inc-label'>Devoluciones</span>
                      <strong className={`dash-inc-val ${data.incidents.returns > 0 ? 'alert' : ''}`}>
                        {data.incidents.returns}
                      </strong>
                    </div>
                    <div className='dash-incident-item'>
                      <span className='dash-inc-label'>Descuentos</span>
                      <strong className='dash-inc-val'>
                        {data.incidents.discounts}
                      </strong>
                    </div>
                    <div className='dash-incident-item'>
                      <span className='dash-inc-label'>Diferencias stock</span>
                      <strong className={`dash-inc-val ${data.counts.stockDifferences > 0 ? 'alert' : ''}`}>
                        {data.counts.stockDifferences}
                      </strong>
                    </div>
                    <div className='dash-incident-item'>
                      <span className='dash-inc-label'>Rendiciones pendientes</span>
                      <strong className={`dash-inc-val ${data.counts.pendingSettlements > 0 ? 'alert' : ''}`}>
                        {data.counts.pendingSettlements}
                      </strong>
                    </div>
                    <div className='dash-incident-item'>
                      <span className='dash-inc-label'>Comandas aviso (12m)</span>
                      <strong className='dash-inc-val'>
                        {data.counts.warningDispatches}
                      </strong>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Footer timestamp & notice */}
            <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center', pt: 1 }}>
              Datos oficiales calculados por el servidor • Actualizado:{' '}
              {new Date(data.capturedAt).toLocaleTimeString('es-PE', {
                timeZone: data.timeZone
              })}
            </Typography>
          </>
        )}
      </Stack>
    </Container>
  );
}
