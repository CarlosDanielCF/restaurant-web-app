import { MoreOptions } from '@/components/operational/MoreOptions';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
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
  Paper,
  Chip
} from '@mui/material';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { selectAuth } from '@/redux';
import { restauranteApi } from '@/api';
import { useWorkerAccess } from '@/hooks/useWorkerAccess';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { AccountHistoryDialog } from './AccountHistoryDialog';
import { ReportPeriodControls } from './ReportPeriodControls';
import { monetaryColumns, reportColumns } from './reportColumns';
import {
  periodRange,
  reportAmount,
  reportError,
  reportGroups,
  reportNames,
  ReportPeriod,
  validReportRange
} from './reportView';
import './insights.css';
interface CatalogEntry {
  kind: string;
  description: string;
  filters: string[];
  states?: string[];
  types?: string[];
}
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
interface Option {
  id: string;
  name: string;
}
interface Options {
  truncated?: boolean;
  products: Option[];
  categories: Option[];
  tables: Option[];
}
const extraFilters = [
  'userId',
  'responsibleUserId',
  'method',
  'modality',
  'status',
  'movementType',
  'productId',
  'categoryId',
  'tableId',
  'productKind',
  'accountId'
] as const;
type Filters = { from: string; to: string } & Record<
  (typeof extraFilters)[number],
  string
>;
const cleanExtras = Object.fromEntries(
  extraFilters.map((key) => [key, ''])
) as Record<(typeof extraFilters)[number], string>;
export function ReportsPage() {
  const user = useSelector(selectAuth).user,
    restaurant = useRestaurantStore((s) => s.restaurant),
    role = user?.role.name;
  const administrative = role === 'DUENO' || role === 'ADMINISTRADOR',
    timeZone = restaurant?.timeZone || 'America/Lima';
  const can = useWorkerAccess();
  const [params, setParams] = useSearchParams();
  const initialRange =
    params.get('from') && params.get('to')
      ? { from: params.get('from')!, to: params.get('to')! }
      : periodRange('today', timeZone);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]),
    [catalogError, setCatalogError] = useState(''),
    [catalogRevision, setCatalogRevision] = useState(0);
  const [workers, setWorkers] = useState<
      (Option & { role: string; isActive: boolean })[]
    >([]),
    [options, setOptions] = useState<Options>({
      products: [],
      categories: [],
      tables: []
    });
  const [kind, setKind] = useState(''),
    [period, setPeriod] = useState<ReportPeriod>(
      params.get('from') ? 'custom' : 'today'
    );
  const [filters, setFilters] = useState<Filters>(() => ({
    ...initialRange,
    ...cleanExtras,
    ...Object.fromEntries(
      extraFilters
        .filter((key) => params.has(key))
        .map((key) => [key, params.get(key)!])
    )
  }));
  const [appliedFilters, setAppliedFilters] = useState(filters),
    [page, setPage] = useState(1),
    [revision, setRevision] = useState(0),
    [result, setResult] = useState<Result>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [filterError, setFilterError] = useState(''),
    [exporting, setExporting] = useState(false),
    [historyAccount, setHistoryAccount] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setCatalog([]);
    setKind('');
    setResult(undefined);
    setCatalogError('');
    setFilterError('');
    setWorkers([]);
    setOptions({ products: [], categories: [], tables: [] });
    setHistoryAccount(null);
    restauranteApi
      .get<CatalogEntry[]>('/operational-reports/catalog')
      .then((r) => {
        if (!active) return;
        setCatalog(r.data);
        const requested = params.get('kind'),
          selected = r.data.find((c) => c.kind === requested) || r.data[0];
        if (selected) {
          setKind(selected.kind);
          const next = { ...filters };
          extraFilters.forEach((key) => {
            if (!selected.filters.includes(key)) next[key] = '';
          });
          setFilters(next);
          setAppliedFilters(next);
        }
      })
      .catch((e) => {
        if (active)
          setCatalogError(
            reportError(e, 'No se pudieron cargar los reportes autorizados.')
          );
      });
    restauranteApi
      .get<(Option & { role: string; isActive: boolean })[]>(
        '/operational-reports/directory'
      )
      .then((r) => {
        if (active) setWorkers(r.data);
      })
      .catch(() => {
        if (active) {
          setWorkers([]);
          setFilterError(
            'No se pudo cargar alguna lista de filtros. Puedes consultar sin ese filtro o reintentar.'
          );
        }
      });
    if (administrative)
      restauranteApi
        .get<Options>('/operational-reports/options')
        .then((r) => {
          if (active) setOptions(r.data);
        })
        .catch(() => {
          if (active) {
            setOptions({ products: [], categories: [], tables: [] });
            setFilterError(
              'No se pudo cargar alguna lista de filtros. Puedes consultar sin ese filtro o reintentar.'
            );
          }
        });
    return () => {
      active = false;
    };
    // URL filters initialize this workspace; changing a report keeps its local input state.
  }, [restaurant?.id, user?.id, role, administrative, catalogRevision]);
  const definition = catalog.find((c) => c.kind === kind),
    allowed = (key: string) => definition?.filters.includes(key);
  useEffect(() => {
    if (!kind || !definition) return;
    let active = true;
    setBusy(true);
    setResult(undefined);
    setError('');
    const query = Object.fromEntries(
      Object.entries(appliedFilters).filter(([, v]) => v)
    );
    restauranteApi
      .get<Result>(`/operational-reports/${kind}`, {
        params: { ...query, page, limit: 25 }
      })
      .then((r) => {
        if (active) setResult(r.data);
      })
      .catch((e) => {
        if (active)
          setError(reportError(e, 'No se pudo consultar el reporte.'));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [kind, page, revision, restaurant?.id, appliedFilters, definition]);
  const apply = (next = filters) => {
    if (!validReportRange(next)) {
      setError('Selecciona un rango válido de hasta 366 días.');
      return;
    }
    setAppliedFilters({ ...next });
    setPage(1);
    setRevision((n) => n + 1);
    setParams(
      {
        kind,
        ...Object.fromEntries(Object.entries(next).filter(([, v]) => v))
      },
      { replace: true }
    );
  };
  const selectReport = (nextKind: string, extra: Partial<Filters> = {}) => {
    const nextDefinition = catalog.find((c) => c.kind === nextKind);
    if (!nextDefinition) return;
    const next = { ...filters, ...cleanExtras, ...extra };
    extraFilters.forEach((key) => {
      if (!nextDefinition.filters.includes(key)) next[key] = '';
    });
    setKind(nextKind);
    setPage(1);
    setFilters(next);
    setAppliedFilters(next);
    setResult(undefined);
    setParams(
      {
        kind: nextKind,
        ...Object.fromEntries(Object.entries(next).filter(([, v]) => v))
      },
      { replace: true }
    );
  };
  const update = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const exportCsv = async () => {
    setExporting(true);
    setError('');
    try {
      const response = await restauranteApi.get<Blob>(
        `/operational-reports/${kind}/export`,
        {
          params: Object.fromEntries(
            Object.entries(appliedFilters).filter(([, v]) => v)
          ),
          responseType: 'blob'
        }
      );
      const url = URL.createObjectURL(response.data),
        anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `point-${kind}-${appliedFilters.from}-${appliedFilters.to}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      const failure = e as { data?: Blob; response?: { data?: Blob } };
      const payload = failure.data ?? failure.response?.data;
      let message =
        'No se pudo exportar. Reduce el período o los filtros; la exportación admite hasta 10.000 filas completas.';
      if (payload instanceof Blob) {
        try {
          message = String(JSON.parse(await payload.text()).message || message);
        } catch {
          /* Keep the useful fallback if a proxy returned non-JSON. */
        }
      }
      setError(reportError(e, message));
    } finally {
      setExporting(false);
    }
  };
  const moneyReport = [
    'sales',
    'collections',
    'refunds',
    'tips',
    'debts',
    'installments',
    'top-products',
    'least-products',
    'products',
    'product-activity',
    'expenses',
    'waiter-results',
    'discounts'
  ].includes(kind);
  const columns = result?.rows.length
    ? Object.keys(result.rows[0]).filter(
        (k) =>
          (k !== 'amount' || moneyReport) &&
          ![
            'restaurantId',
            'id',
            'userId',
            'responsibleUserId',
            'productId',
            'categoryId',
            'tableId',
            'actorId'
          ].includes(k)
      )
    : [];
  const cell = (key: string, value: unknown, row: Record<string, unknown>) => {
    if (value == null) return '—';
    if (key === 'paymentMethods')
      return String(value)
        .split(',')
        .map((method) => operationalLabel(method.trim()))
        .join(' · ');
    if (key === 'accountId')
      return administrative ? (
        <Button size='small' onClick={() => setHistoryAccount(String(value))}>
          Ver historial
        </Button>
      ) : (
        'Atención asociada'
      );
    if (typeof value === 'object')
      return (
        <details>
          <summary>Ver detalle</summary>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              maxWidth: 480,
              overflowWrap: 'anywhere'
            }}
          >
            {JSON.stringify(value, null, 2)}
          </pre>
        </details>
      );
    if (monetaryColumns.has(key))
      return reportAmount(value, String(row.currency || 'PEN'));
    if (key.endsWith('At') && typeof value === 'string') {
      const date = new Date(value);
      return Number.isFinite(date.getTime())
        ? date.toLocaleString('es-PE', { timeZone: result?.timeZone })
        : value;
    }
    return operationalLabel(String(value));
  };
  const workerActions = (row: Record<string, unknown>) =>
    kind === 'waiter-results' && (
      <MoreOptions title='Ver detalle del trabajador'>
        <Stack direction='row' flexWrap='wrap' gap={0.5}>
          {[
            'collections',
            'accounts',
            'dispatches',
            'settlements',
            'tips',
            'cancellations',
            'substitutions',
            'audit'
          ]
            .filter((k) => catalog.some((c) => c.kind === k))
            .map((k) => (
              <Button
                key={k}
                onClick={() =>
                  selectReport(k, {
                    [k === 'accounts' ? 'responsibleUserId' : 'userId']: String(
                      row.userId || row.id
                    )
                  })
                }
              >
                {k === 'accounts'
                  ? 'Cuentas como responsable'
                  : k === 'dispatches'
                    ? 'Envíos confirmados'
                    : reportNames[k]}
              </Button>
            ))}
        </Stack>
      </MoreOptions>
    );
  const selectFilter = (
    key: keyof Filters,
    label: string,
    values: { value: string; label: string }[]
  ) =>
    allowed(key) && (
      <TextField
        key={key}
        size='small'
        select
        label={label}
        value={filters[key]}
        onChange={(e) => update(key, e.target.value)}
      >
        <MenuItem value=''>Todos</MenuItem>
        {values.map((v) => (
          <MenuItem key={v.value} value={v.value}>
            {v.label}
          </MenuItem>
        ))}
      </TextField>
    );
  return (
    <Container
      maxWidth='xl'
      className='final-page pos-reports point-report-center'
    >
      <nav className='pos-report-nav' aria-label='Reportes disponibles'>
        <Typography variant='overline'>Centro de reportes</Typography>
        {administrative && (
          <Button component={Link} to='/operational-overview'>
            Resumen operativo
          </Button>
        )}
        {reportGroups.map((group) => {
          const available = group.kinds.filter((k) =>
            catalog.some((c) => c.kind === k)
          );
          return (
            available.length > 0 && (
              <details
                key={group.label}
                open={available.includes(kind) || undefined}
              >
                <summary>{group.label}</summary>
                {available.map((k) => (
                  <Button
                    key={k}
                    aria-current={kind === k ? 'page' : undefined}
                    onClick={() => selectReport(k)}
                  >
                    {reportNames[k] || k}
                  </Button>
                ))}
              </details>
            )
          );
        })}
        {administrative && can('configuration') && (
          <Button component={Link} to='/supplies?view=stock'>
            Gestionar bebidas / compras
          </Button>
        )}
      </nav>
      <Stack spacing={1.5} className='pos-report-content'>
        <Typography variant='h4' component='h1'>
          Centro de reportes
        </Typography>
        {catalogError && (
          <Alert
            severity='error'
            action={
              <Button onClick={() => setCatalogRevision((n) => n + 1)}>
                Reintentar
              </Button>
            }
          >
            {catalogError}
          </Alert>
        )}
        {!catalog.length && !catalogError && (
          <CircularProgress
            size={24}
            aria-label='Cargando reportes autorizados'
          />
        )}
        {!!catalog.length && (
          <>
            <TextField
              select
              label='Reporte'
              className='pos-report-select'
              value={kind}
              onChange={(e) => selectReport(e.target.value)}
            >
              {catalog.map((c) => (
                <MenuItem key={c.kind} value={c.kind}>
                  {reportNames[c.kind] || c.kind}
                </MenuItem>
              ))}
            </TextField>
            <Stack
              direction='row'
              justifyContent='space-between'
              gap={1}
              flexWrap='wrap'
              alignItems='center'
            >
              <Typography variant='h5' component='h2'>
                <AssessmentOutlined sx={{ verticalAlign: 'middle', mr: 1 }} />
                {reportNames[kind] || kind}
              </Typography>
              <Button
                startIcon={<FileDownloadOutlined />}
                disabled={busy || exporting || !result?.total}
                onClick={() => void exportCsv()}
              >
                {exporting ? 'Exportando…' : 'Exportar CSV completo'}
              </Button>
            </Stack>
            <Typography className='report-description'>
              {definition?.description} · Zona horaria: {timeZone}
            </Typography>
            <ReportPeriodControls
              period={period}
              range={filters}
              timeZone={timeZone}
              onChange={(p, range) => {
                const next = { ...filters, ...range };
                setPeriod(p);
                setFilters(next);
                if (p !== 'custom') apply(next);
              }}
            />
            <MoreOptions title='Filtros adicionales'>
              {filterError && (
                <Alert
                  severity='warning'
                  action={
                    <Button onClick={() => setCatalogRevision((n) => n + 1)}>
                      Reintentar
                    </Button>
                  }
                >
                  {filterError}
                </Alert>
              )}
              {options.truncated && (
                <Typography variant='caption' color='text.secondary'>
                  Se muestran las primeras 1.000 opciones por lista. El reporte
                  sin ese filtro sigue incluyendo todos los resultados.
                </Typography>
              )}
              <div className='report-filter-grid'>
                {role !== 'MOZO' &&
                  selectFilter(
                    'userId',
                    kind === 'waiter-results' ? 'Cobrador' : 'Usuario / actor',
                    workers.map((w) => ({
                      value: w.id,
                      label: `${w.name}${!w.isActive ? ' (inactivo)' : ''}`
                    }))
                  )}
                {selectFilter(
                  'responsibleUserId',
                  'Responsable',
                  workers.map((w) => ({ value: w.id, label: w.name }))
                )}
                {selectFilter(
                  'method',
                  'Método',
                  ['CASH', 'YAPE', 'CARD'].map((m) => ({
                    value: m,
                    label: operationalLabel(m)
                  }))
                )}
                {selectFilter(
                  'modality',
                  'Modalidad',
                  [
                    'TABLE',
                    'TAKE_AWAY',
                    'OWN_DELIVERY',
                    'EXTERNAL_COURIER'
                  ].map((m) => ({ value: m, label: operationalLabel(m) }))
                )}
                {definition?.states &&
                  selectFilter(
                    'status',
                    'Estado',
                    definition.states.map((s) => ({
                      value: s,
                      label: operationalLabel(s)
                    }))
                  )}
                {definition?.types
                  ? selectFilter(
                      'movementType',
                      'Movimiento',
                      definition.types.map((s) => ({
                        value: s,
                        label: operationalLabel(s)
                      }))
                    )
                  : allowed('movementType') && (
                      <TextField
                        size='small'
                        label='Acción / movimiento'
                        value={filters.movementType}
                        onChange={(e) => update('movementType', e.target.value)}
                      />
                    )}
                {selectFilter(
                  'productId',
                  'Producto',
                  options.products.map((p) => ({ value: p.id, label: p.name }))
                )}
                {selectFilter(
                  'categoryId',
                  'Categoría',
                  options.categories.map((p) => ({
                    value: p.id,
                    label: p.name
                  }))
                )}
                {selectFilter(
                  'tableId',
                  'Mesa',
                  options.tables.map((p) => ({ value: p.id, label: p.name }))
                )}
                {selectFilter('productKind', 'Tipo de producto', [
                  { value: 'FOOD', label: 'Platos' },
                  { value: 'DRINK', label: 'Bebidas' }
                ])}
              </div>
            </MoreOptions>
            <Stack direction='row' flexWrap='wrap' gap={1} alignItems='center'>
              <Button
                startIcon={<FilterAltOutlined />}
                variant='contained'
                disabled={busy || !validReportRange(filters)}
                onClick={() => apply()}
              >
                Aplicar filtros
              </Button>
              <Button
                onClick={() => {
                  const next = { ...filters, ...cleanExtras };
                  setFilters(next);
                  apply(next);
                }}
              >
                Limpiar filtros adicionales
              </Button>
              {filters.accountId && (
                <Chip
                  label='Filtrado por cuenta'
                  onDelete={() => {
                    const next = { ...filters, accountId: '' };
                    setFilters(next);
                    apply(next);
                  }}
                />
              )}
            </Stack>
            {!validReportRange(filters) && (
              <Alert severity='warning'>
                Elige un rango de fechas válido de hasta 366 días.
              </Alert>
            )}
          </>
        )}
        {busy && (
          <CircularProgress size={24} aria-label='Consultando reporte' />
        )}
        {error && (
          <Alert
            severity='error'
            action={
              <Button disabled={busy} onClick={() => setRevision((n) => n + 1)}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        {result && (
          <>
            <Typography variant='body2' color='text.secondary'>
              {result.total} resultados · {appliedFilters.from} —{' '}
              {appliedFilters.to} · consultado{' '}
              {new Date(result.capturedAt).toLocaleString('es-PE', {
                timeZone: result.timeZone
              })}
            </Typography>
            <Stack direction='row' flexWrap='wrap' gap={1}>
              {result.totals.map((t, i) => (
                <Paper key={i} variant='outlined' sx={{ p: 1.5 }}>
                  <Typography variant='caption'>
                    {operationalLabel(t.movementType)} · {t.records} registros
                  </Typography>
                  <Typography fontWeight={700}>
                    {moneyReport
                      ? reportAmount(t.amount, t.currency)
                      : `${t.records} movimientos`}
                  </Typography>
                </Paper>
              ))}
            </Stack>
            {!result.rows.length ? (
              <WorkspaceEmpty
                title='Sin movimientos para estos filtros'
                description='Ajusta las fechas o los filtros para consultar otro período.'
              />
            ) : (
              <>
                <TableContainer
                  component={Paper}
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    maxWidth: '100%'
                  }}
                >
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        {columns.map((k) => (
                          <TableCell key={k}>
                            {reportColumns[k] || operationalLabel(k)}
                          </TableCell>
                        ))}
                        {kind === 'waiter-results' && (
                          <TableCell>Detalle</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.rows.map((r, i) => (
                        <TableRow
                          key={`${String(r.id || r.productId || i)}-${String(r.currency || '')}`}
                        >
                          {columns.map((k) => (
                            <TableCell
                              key={k}
                              sx={{
                                minWidth: 100,
                                maxWidth: 400,
                                overflowWrap: 'anywhere'
                              }}
                            >
                              {cell(k, r[k], r)}
                            </TableCell>
                          ))}
                          {kind === 'waiter-results' && (
                            <TableCell>{workerActions(r)}</TableCell>
                          )}
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
                      key={`${String(r.id || r.productId || i)}-${String(r.currency || '')}`}
                      className='report-mobile-card'
                    >
                      <dl>
                        {columns.slice(0, 4).map((k) => (
                          <div key={k}>
                            <dt>{reportColumns[k] || operationalLabel(k)}</dt>
                            <dd>{cell(k, r[k], r)}</dd>
                          </div>
                        ))}
                      </dl>
                      {columns.length > 4 && (
                        <MoreOptions title='Ver todos los datos del movimiento'>
                          <dl>
                            {columns.slice(4).map((k) => (
                              <div key={k}>
                                <dt>
                                  {reportColumns[k] || operationalLabel(k)}
                                </dt>
                                <dd>{cell(k, r[k], r)}</dd>
                              </div>
                            ))}
                          </dl>
                        </MoreOptions>
                      )}
                      {workerActions(r)}
                    </Paper>
                  ))}
                </Stack>
              </>
            )}
            {result.total > 0 && (
              <Stack
                direction='row'
                alignItems='center'
                justifyContent='space-between'
              >
                <Button
                  disabled={busy || page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Typography>
                  Página {page} de {Math.ceil(result.total / result.limit)}
                </Typography>
                <Button
                  disabled={busy || page * result.limit >= result.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </Stack>
            )}
          </>
        )}
        <AccountHistoryDialog
          key={historyAccount || 'no-account'}
          accountId={historyAccount}
          onClose={() => setHistoryAccount(null)}
        />
      </Stack>
    </Container>
  );
}
