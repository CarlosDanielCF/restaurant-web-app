import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { restauranteApi } from '@/api';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { MoreOptions } from '@/components/operational/MoreOptions';
import { WorkspaceEmpty } from '@/components/operational/WorkspaceEmpty';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { presentationLabel } from '../Operations/presentationLabel';
import { cents } from '../Finance/displayMoney';
import {
  Page,
  Stock,
  StockMovement,
  SupplyProduct,
  Expense,
  Recoverable
} from './types';
import { purchasePreview, wholeUnits } from './previews';
import './Supplies.css';

type View = 'stock' | 'expenses' | 'movements';
type Action =
  | 'configure'
  | 'purchase'
  | 'opening'
  | 'adjust'
  | 'count'
  | 'recover'
  | 'expense';
const emptyPage = <T,>(): Page<T> => ({
  rows: [],
  total: 0,
  page: 1,
  pageSize: 25
});
const labels: Record<string, string> = {
  OPENING: 'Stock inicial',
  INITIAL: 'Stock inicial',
  PURCHASE: 'Compra de bebidas',
  SALE: 'Consumo confirmado',
  CANCELLATION_RECOVERY: 'Recuperación de cancelación',
  MANUAL_ADJUSTMENT: 'Ajuste manual',
  PHYSICAL_COUNT: 'Conteo físico',
  MARKET: 'Compra de mercado',
  BEVERAGE: 'Compra de bebidas',
  OTHER: 'Otro egreso'
};
const titles: Record<Action, string> = {
  configure: 'Configurar control de bebidas',
  purchase: 'Ingresar bebidas',
  opening: 'Registrar stock inicial',
  adjust: 'Ajustar unidades',
  count: 'Registrar conteo físico',
  recover: 'Recuperar bebida cancelada',
  expense: 'Registrar gasto'
};
const stockLabel = (stock: Pick<Stock, 'productName' | 'optionName'>) =>
  `${stock.productName}${stock.optionName ? ` · ${presentationLabel(stock.optionName)}` : ''}`;
function apiError(error: unknown) {
  const value = error as { data?: { message?: string | string[] } };
  const message = value.data?.message;
  return Array.isArray(message)
    ? message.join('. ')
    : message ||
        'No se obtuvo confirmación. Actualiza el estado y reintenta; se conserva la clave de la misma operación.';
}
function Pager({
  page,
  total,
  size,
  busy,
  change
}: {
  page: number;
  total: number;
  size: number;
  busy: boolean;
  change: (page: number) => void;
}) {
  return (
    <Stack direction='row' gap={1} alignItems='center' justifyContent='center'>
      <Button disabled={busy || page <= 1} onClick={() => change(page - 1)}>
        Anterior
      </Button>
      <Typography variant='body2'>
        {total} registros · Página {page}
      </Typography>
      <Button
        disabled={busy || page * size >= total}
        onClick={() => change(page + 1)}
      >
        Siguiente
      </Button>
    </Stack>
  );
}
export function SuppliesPage() {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const [params] = useSearchParams();
  const timeZone = restaurant?.timeZone || 'America/Lima';
  const currency =
    restaurant?.currency === 'PEN' ? 'S/' : restaurant?.currency || 'PEN';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone }).format(
    new Date()
  );
  const initialView = params.get('view');
  const [view, setView] = useState<View>(
    initialView === 'expenses' || initialView === 'movements'
      ? initialView
      : 'stock'
  );
  const [search, setSearch] = useState(''),
    [query, setQuery] = useState('');
  const [page, setPage] = useState(1),
    [from, setFrom] = useState(params.get('from') || today),
    [to, setTo] = useState(params.get('to') || today),
    [dates, setDates] = useState({ from, to });
  const [stockId, setStockId] = useState(params.get('stockId') || '');
  const [stocks, setStocks] = useState(emptyPage<Stock>()),
    [movements, setMovements] = useState(emptyPage<StockMovement>()),
    [expenses, setExpenses] = useState(emptyPage<Expense>());
  const [busy, setBusy] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [formError, setFormError] = useState('');
  const [action, setAction] = useState<Action>(),
    [selected, setSelected] = useState<Stock>();
  const [values, setValues] = useState<Record<string, string>>({});
  const [catalog, setCatalog] = useState(emptyPage<SupplyProduct>()),
    [catalogSearch, setCatalogSearch] = useState(''),
    [catalogPage, setCatalogPage] = useState(1),
    [catalogBusy, setCatalogBusy] = useState(false);
  const [product, setProduct] = useState<SupplyProduct>(),
    [optionId, setOptionId] = useState(0),
    [factory, setFactory] = useState(false);
  const [recoverable, setRecoverable] = useState(emptyPage<Recoverable>()),
    [recoverPage, setRecoverPage] = useState(1);
  const generation = useRef(0),
    lock = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const refresh = useCallback(async () => {
    const ticket = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const response = await restauranteApi.get(
        `/supplies/${view === 'stock' ? 'stocks' : view}`,
        {
          params: {
            page,
            pageSize: 25,
            ...(view === 'stock'
              ? { search: query }
              : {
                  ...dates,
                  ...(stockId && view === 'movements' ? { stockId } : {})
                })
          }
        }
      );
      if (ticket !== generation.current) return;
      if (view === 'stock') setStocks(response.data);
      else if (view === 'expenses') setExpenses(response.data);
      else setMovements(response.data);
    } catch (e) {
      if (ticket === generation.current) setError(apiError(e));
    } finally {
      if (ticket === generation.current) setBusy(false);
    }
  }, [restaurant?.id, view, page, query, dates, stockId]);
  useLiveRefresh(refresh, [
    'catalog.changed',
    'finance.changed',
    'attention.changed'
  ]);
  useEffect(() => {
    setStocks(emptyPage());
    setExpenses(emptyPage());
    setMovements(emptyPage());
    return () => {
      generation.current++;
    };
  }, [restaurant?.id]);
  useEffect(() => {
    if (action !== 'configure') return;
    let current = true;
    const timer = setTimeout(() => {
      setCatalogBusy(true);
      restauranteApi
        .get<Page<SupplyProduct>>('/supplies/catalog', {
          params: { search: catalogSearch, page: catalogPage, pageSize: 20 }
        })
        .then((r) => {
          if (current) setCatalog(r.data);
        })
        .catch((e) => {
          if (current) setFormError(apiError(e));
        })
        .finally(() => {
          if (current) setCatalogBusy(false);
        });
    }, 200);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [action, catalogSearch, catalogPage, restaurant?.id]);
  useEffect(() => {
    if (action !== 'recover' || !selected) return;
    let current = true;
    restauranteApi
      .get<Page<Recoverable>>('/supplies/recoverable', {
        params: { stockId: selected.id, page: recoverPage, pageSize: 20 }
      })
      .then((r) => {
        if (current) setRecoverable(r.data);
      })
      .catch((e) => {
        if (current) setFormError(apiError(e));
      });
    return () => {
      current = false;
    };
  }, [action, selected?.id, recoverPage, restaurant?.id]);
  const open = (next: Action, stock?: Stock) => {
    setAction(next);
    setSelected(stock);
    setValues({
      quantity: '',
      unitCost: '',
      category: 'MARKET',
      operatingDate: today
    });
    setFormError('');
    setFactory(false);
    setProduct(undefined);
    setOptionId(0);
    setCatalogPage(1);
    setCatalogSearch('');
    setRecoverPage(1);
  };
  const update = (key: string, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  const preview = purchasePreview(values.quantity || '', values.unitCost || '');
  const recovery = recoverable.rows.find((row) => row.lineId === values.lineId);
  const validation = () => {
    if (action === 'configure') return product && factory;
    if (action === 'expense')
      return (
        !!values.concept?.trim() &&
        (cents(values.amount || '') ?? BigInt(0)) > BigInt(0)
      );
    if (action === 'purchase') return preview !== null;
    if (action === 'adjust')
      return (
        /^-?\d{1,9}$/.test(values.delta || '') &&
        Number(values.delta) !== 0 &&
        values.reason?.trim().length >= 2
      );
    if (action === 'count')
      return (
        wholeUnits(values.quantity || '', true) &&
        values.reason?.trim().length >= 2 &&
        Number(values.quantity) !== Number(selected?.quantity)
      );
    if (action === 'opening')
      return (
        wholeUnits(values.quantity || '', true) &&
        values.reason?.trim().length >= 2
      );
    if (action === 'recover')
      return (
        recovery &&
        /^\d{1,9}(\.\d{1,3})?$/.test(values.quantity || '') &&
        Number(values.quantity) > 0 &&
        Number(values.quantity) <= Number(recovery.quantityRecoverable) &&
        values.reason?.trim().length >= 2
      );
    return false;
  };
  const submit = async () => {
    if (lock.current || !action || !validation()) return;
    lock.current = true;
    setSaving(true);
    setFormError('');
    setNotice('');
    let path = '',
      body: Record<string, unknown> = {};
    if (action === 'configure') {
      path = '/supplies/stocks/configure';
      body = {
        productId: product!.id,
        ...(optionId ? { optionId } : {}),
        controlStock: true,
        factoryPackaged: true
      };
    } else if (action === 'expense') {
      path = '/supplies/expenses';
      body = {
        category: values.category,
        amount: values.amount,
        concept: values.concept.trim(),
        ...(values.operatingDate
          ? { operatingDate: values.operatingDate }
          : {}),
        ...(values.note ? { note: values.note } : {})
      };
    } else if (action === 'recover') {
      path = '/supplies/recover';
      body = {
        lineId: values.lineId,
        stockId: selected!.id,
        quantity: Number(values.quantity),
        reason: values.reason,
        expectedVersion: recovery!.accountVersion
      };
    } else if (selected) {
      const expectedVersion = selected.version;
      if (action === 'purchase') {
        path = '/supplies/purchases';
        body = {
          stockId: selected.id,
          quantity: Number(values.quantity),
          unitCost: values.unitCost,
          expectedVersion,
          ...(values.operatingDate
            ? { operatingDate: values.operatingDate }
            : {}),
          ...(values.note ? { note: values.note } : {})
        };
      } else {
        path = `/supplies/stocks/${selected.id}/${action}`;
        body = {
          expectedVersion,
          ...(action === 'adjust'
            ? { delta: Number(values.delta) }
            : { quantity: Number(values.quantity) }),
          reason: values.reason || ''
        };
      }
    }
    try {
      await restauranteApi.post(path, body);
      setAction(undefined);
      setNotice(
        'Operación confirmada. El historial y los importes fueron registrados por el servidor.'
      );
      await refresh();
    } catch (e) {
      setFormError(apiError(e));
      // Preserve the form and pending logical key. Fetch authoritative version for a safe explicit retry.
      if (selected) {
        try {
          const r = await restauranteApi.get<Page<Stock>>('/supplies/stocks', {
            params: { stockId: selected.id, page: 1, pageSize: 1 }
          });
          const current = r.data.rows.find((s) => s.id === selected.id);
          if (current) setSelected(current);
        } catch {
          /* Original error stays visible; no mutation is replayed. */
        }
      }
      await refresh();
    } finally {
      setSaving(false);
      lock.current = false;
    }
  };
  const toggleStock = async (stock: Stock) => {
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      await restauranteApi.post('/supplies/stocks/configure', {
        productId: stock.productId,
        ...(stock.optionId ? { optionId: stock.optionId } : {}),
        controlStock: !stock.controlStock,
        factoryPackaged: true,
        expectedVersion: stock.version
      });
      setNotice(
        'Configuración guardada. Se conserva el historial del producto.'
      );
      await refresh();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
      lock.current = false;
    }
  };
  const changeView = (next: View) => {
    setView(next);
    setPage(1);
    setError('');
  };
  const displayDate = (value: string) =>
    new Date(value).toLocaleString('es-PE', { timeZone });
  const currentPage =
    view === 'stock' ? stocks : view === 'expenses' ? expenses : movements;
  return (
    <Container maxWidth='xl' className='final-page supplies-page'>
      <Stack spacing={2}>
        <div className='supplies-toolbar'>
          <div>
            <Typography variant='h4' component='h1'>
              Compras y bebidas
            </Typography>
            <Typography color='text.secondary'>
              Unidades comerciales, gastos del día e historial auditable.
            </Typography>
          </div>
          <Button component={Link} to='/operational-overview'>
            Ver resultado operativo
          </Button>
        </div>
        <nav className='supplies-tabs' aria-label='Compras y bebidas'>
          <Button
            startIcon={<Inventory2Outlined />}
            aria-current={view === 'stock' ? 'page' : undefined}
            onClick={() => changeView('stock')}
          >
            Bebidas
          </Button>
          <Button
            startIcon={<ReceiptLongOutlined />}
            aria-current={view === 'expenses' ? 'page' : undefined}
            onClick={() => changeView('expenses')}
          >
            Compras del día
          </Button>
          <Button
            startIcon={<HistoryOutlined />}
            aria-current={view === 'movements' ? 'page' : undefined}
            onClick={() => changeView('movements')}
          >
            Kardex
          </Button>
        </nav>
        {notice && (
          <Alert severity='success' onClose={() => setNotice('')}>
            {notice}
          </Alert>
        )}
        {error && (
          <Alert
            severity='error'
            action={
              <Button color='inherit' onClick={() => void refresh()}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        {busy && <LinearProgress />}
        {view === 'stock' ? (
          <>
            <div className='supplies-toolbar'>
              <TextField
                label='Buscar bebida'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size='small'
              />
              <Button
                variant='contained'
                startIcon={<AddOutlined />}
                onClick={() => open('configure')}
              >
                Configurar bebida
              </Button>
            </div>
            <Alert severity='info'>
              Solo se controla stock de bebidas envasadas de fábrica
              configuradas aquí. Las bebidas preparadas y la disponibilidad por
              porciones conservan su propio funcionamiento.
            </Alert>
            {!busy && !stocks.rows.length && (
              <WorkspaceEmpty
                title='Sin bebidas configuradas'
                description='Selecciona productos reales de la carta. Registra el stock inicial solo después de conocer el conteo; no se asignan existencias de demostración.'
              />
            )}
            <div className='supplies-grid'>
              {stocks.rows.map((stock) => (
                <Card className='supplies-stock' key={stock.id}>
                  <Stack
                    direction='row'
                    gap={1}
                    justifyContent='space-between'
                    alignItems='flex-start'
                  >
                    <Typography variant='h6' component='h3'>
                      {stockLabel(stock)}
                    </Typography>
                    <Chip
                      size='small'
                      color={
                        stock.controlStock
                          ? Number(stock.quantity)
                            ? 'success'
                            : 'warning'
                          : 'default'
                      }
                      label={
                        stock.controlStock
                          ? Number(stock.quantity)
                            ? 'Con control'
                            : 'Sin unidades'
                          : 'Control desactivado'
                      }
                    />
                  </Stack>
                  <div>
                    <span className='supplies-stock-count'>
                      {Number(stock.quantity)}
                    </span>{' '}
                    <Typography component='span' color='text.secondary'>
                      unidades esperadas
                    </Typography>
                  </div>
                  {Number(stock.quantity) === 0 && stock.controlStock && (
                    <Typography variant='caption' color='text.secondary'>
                      Registra saldo inicial o compra con cantidades reales
                      antes de confirmar consumos.
                    </Typography>
                  )}
                  <div className='supplies-stock-actions'>
                    <Button
                      variant='contained'
                      startIcon={<AddOutlined />}
                      disabled={saving || !stock.controlStock}
                      onClick={() => open('purchase', stock)}
                    >
                      Ingresar bebidas
                    </Button>
                    <Button
                      startIcon={<HistoryOutlined />}
                      onClick={() => {
                        setStockId(stock.id);
                        changeView('movements');
                      }}
                    >
                      Historial
                    </Button>
                  </div>
                  <MoreOptions title='Conteo y más opciones'>
                    <Stack spacing={1}>
                      <Button
                        disabled={saving}
                        onClick={() => open('count', stock)}
                      >
                        Registrar conteo físico
                      </Button>
                      <Button
                        disabled={saving}
                        onClick={() => open('adjust', stock)}
                      >
                        Ajuste con motivo
                      </Button>
                      <Button
                        disabled={saving}
                        onClick={() => open('opening', stock)}
                      >
                        Stock inicial (sin movimientos previos)
                      </Button>
                      <Button
                        disabled={saving}
                        onClick={() => open('recover', stock)}
                      >
                        Recuperar cancelación
                      </Button>
                      <Button
                        disabled={saving}
                        onClick={() => void toggleStock(stock)}
                      >
                        {stock.controlStock
                          ? 'Desactivar control'
                          : 'Activar control'}
                      </Button>
                    </Stack>
                  </MoreOptions>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className='supplies-toolbar'>
              <Stack direction='row' flexWrap='wrap' gap={1}>
                <TextField
                  size='small'
                  type='date'
                  label='Desde'
                  InputLabelProps={{ shrink: true }}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
                <TextField
                  size='small'
                  type='date'
                  label='Hasta'
                  InputLabelProps={{ shrink: true }}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
                <Button
                  disabled={!from || !to || from > to}
                  onClick={() => {
                    setDates({ from, to });
                    setPage(1);
                  }}
                >
                  Aplicar fechas
                </Button>
                {view === 'movements' && stockId && (
                  <Button
                    onClick={() => {
                      setStockId('');
                      setPage(1);
                    }}
                  >
                    Ver todas las bebidas
                  </Button>
                )}
              </Stack>
              {view === 'expenses' && (
                <Button
                  variant='contained'
                  startIcon={<AddOutlined />}
                  onClick={() => open('expense')}
                >
                  Registrar gasto
                </Button>
              )}
            </div>
            {view === 'expenses' ? (
              <>
                <Alert severity='info'>
                  El ingreso de bebidas registra su compra una sola vez. Aquí
                  registra mercado u otros egresos; no repitas el costo de las
                  bebidas.
                </Alert>
                {!busy && !expenses.rows.length && (
                  <WorkspaceEmpty
                    title='Sin compras ni gastos en el período'
                    description='Los ingresos de bebidas y los gastos confirmados aparecerán con su fecha operativa.'
                  />
                )}
                {expenses.rows.map((expense) => (
                  <Card key={expense.id} className='supplies-list-card'>
                    <header>
                      <div>
                        <Typography variant='h6' component='h3'>
                          {expense.concept}
                        </Typography>
                        <Chip
                          size='small'
                          label={labels[expense.category] || expense.category}
                        />
                      </div>
                      <Typography variant='h6'>
                        {expense.currency} {expense.amount}
                      </Typography>
                    </header>
                    <dl>
                      <div>
                        <dt>Fecha operativa</dt>
                        <dd>{expense.operatingDate}</dd>
                      </div>
                      <div>
                        <dt>Registrado por</dt>
                        <dd>{expense.actorName}</dd>
                      </div>
                      <div>
                        <dt>Registro del servidor</dt>
                        <dd>{displayDate(expense.createdAt)}</dd>
                      </div>
                    </dl>
                    {expense.note && (
                      <Typography variant='body2' sx={{ mt: 1 }}>
                        {expense.note}
                      </Typography>
                    )}
                  </Card>
                ))}
              </>
            ) : (
              <>
                {!busy && !movements.rows.length && (
                  <WorkspaceEmpty
                    title='Sin movimientos para estos filtros'
                    description='Compras, consumos confirmados, recuperaciones y ajustes conservan su trazabilidad aquí.'
                  />
                )}
                {movements.rows.map((movement) => (
                  <Card key={movement.id} className='supplies-list-card'>
                    <header>
                      <div>
                        <Typography variant='h6'>
                          {stockLabel(movement)}
                        </Typography>
                        <Chip
                          size='small'
                          label={labels[movement.type] || movement.type}
                        />
                      </div>
                      <Typography variant='h6'>
                        {Number(movement.quantityDelta) > 0 ? '+' : ''}
                        {Number(movement.quantityDelta)} uds.
                      </Typography>
                    </header>
                    <dl>
                      <div>
                        <dt>Anterior → posterior</dt>
                        <dd>
                          {Number(movement.stockBefore)} →{' '}
                          {Number(movement.stockAfter)}
                        </dd>
                      </div>
                      <div>
                        <dt>Responsable del movimiento</dt>
                        <dd>{movement.actorName}</dd>
                      </div>
                      <div>
                        <dt>Fecha</dt>
                        <dd>{displayDate(movement.createdAt)}</dd>
                      </div>
                    </dl>
                    {movement.reason && (
                      <Typography variant='body2' sx={{ mt: 1 }}>
                        {movement.reason}
                      </Typography>
                    )}
                    {movement.accountId && (
                      <Button
                        component={Link}
                        to={`/operational-reports?kind=accounts&accountId=${movement.accountId}`}
                      >
                        Ver historial de cuenta
                      </Button>
                    )}
                  </Card>
                ))}
              </>
            )}
          </>
        )}
        {currentPage.total > 0 && (
          <Pager
            page={page}
            total={currentPage.total}
            size={currentPage.pageSize}
            busy={busy}
            change={setPage}
          />
        )}
      </Stack>
      <Dialog
        open={!!action}
        onClose={() => {
          if (!saving) setAction(undefined);
        }}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>
          {action ? titles[action] : ''}
          {selected && (
            <Typography color='text.secondary'>
              {stockLabel(selected)} · {Number(selected.quantity)} unidades
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <div className='supplies-form'>
            {formError && <Alert severity='error'>{formError}</Alert>}
            {action === 'configure' ? (
              <>
                <Alert severity='info'>
                  Selecciona la unidad comercial exacta. Activar el control no
                  agrega stock ni inventa un costo histórico.
                </Alert>
                {!product ? (
                  <>
                    <TextField
                      autoFocus
                      label='Buscar producto de la carta'
                      value={catalogSearch}
                      onChange={(e) => {
                        setCatalogSearch(e.target.value);
                        setCatalogPage(1);
                      }}
                    />
                    {catalogBusy && <LinearProgress />}
                    {catalog.rows.map((item) => (
                      <Button
                        className='supplies-product-option'
                        key={item.id}
                        variant='outlined'
                        onClick={() => setProduct(item)}
                      >
                        {item.name}
                      </Button>
                    ))}
                    {!catalogBusy && !catalog.rows.length && (
                      <Typography>
                        No hay productos para esta búsqueda.
                      </Typography>
                    )}
                    {catalog.total > 0 && (
                      <Pager
                        page={catalogPage}
                        total={catalog.total}
                        size={catalog.pageSize}
                        busy={catalogBusy}
                        change={setCatalogPage}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <Typography variant='h6'>{product.name}</Typography>
                    <Button
                      onClick={() => {
                        setProduct(undefined);
                        setOptionId(0);
                      }}
                    >
                      Cambiar producto
                    </Button>
                    {product.options.length > 0 && (
                      <TextField
                        select
                        label='Unidad / presentación'
                        value={optionId}
                        onChange={(e) => setOptionId(Number(e.target.value))}
                      >
                        <MenuItem value={0}>
                          Sin presentación (solo consumos sin variante)
                        </MenuItem>
                        {product.options.map((option, i) => (
                          <MenuItem key={option.id} value={option.id}>
                            {presentationLabel(option.name, i)}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={factory}
                          onChange={(e) => setFactory(e.target.checked)}
                        />
                      }
                      label='Confirmo que esta unidad es una bebida embotellada o envasada de fábrica.'
                    />
                  </>
                )}
              </>
            ) : action === 'expense' ? (
              <>
                <TextField
                  autoFocus
                  label='Monto'
                  inputProps={{ inputMode: 'decimal' }}
                  value={values.amount || ''}
                  onChange={(e) => update('amount', e.target.value)}
                />
                <TextField
                  label='Concepto'
                  value={values.concept || ''}
                  onChange={(e) => update('concept', e.target.value)}
                />
                <TextField
                  select
                  label='Tipo de egreso'
                  value={values.category || 'MARKET'}
                  onChange={(e) => update('category', e.target.value)}
                >
                  <MenuItem value='MARKET'>Compra de mercado</MenuItem>
                  <MenuItem value='OTHER'>Otro egreso operativo</MenuItem>
                </TextField>
              </>
            ) : (
              <>
                {action === 'recover' && (
                  <>
                    <Alert severity='info'>
                      La recuperación es explícita y solo incluye cantidades
                      canceladas que el servidor permite recuperar. Una
                      devolución financiera no restituye existencias
                      automáticamente.
                    </Alert>
                    <TextField
                      select
                      label='Consumo cancelado'
                      value={values.lineId || ''}
                      onChange={(e) => update('lineId', e.target.value)}
                    >
                      <MenuItem value=''>Seleccionar consumo</MenuItem>
                      {recoverable.rows.map((row) => (
                        <MenuItem
                          key={row.lineId}
                          value={row.lineId}
                          disabled={Number(row.quantityRecoverable) <= 0}
                        >
                          {row.accountLabel} · {row.productName} · recuperable:{' '}
                          {row.quantityRecoverable}
                        </MenuItem>
                      ))}
                    </TextField>
                    {!recoverable.rows.length && (
                      <Typography>
                        No hay cancelaciones recuperables para esta bebida.
                      </Typography>
                    )}
                    {recoverable.total > 20 && (
                      <Pager
                        page={recoverPage}
                        total={recoverable.total}
                        size={recoverable.pageSize}
                        busy={false}
                        change={setRecoverPage}
                      />
                    )}
                  </>
                )}
                {action === 'adjust' ? (
                  <TextField
                    label='Ajuste de unidades (+ / −)'
                    inputProps={{ inputMode: 'numeric' }}
                    value={values.delta || ''}
                    onChange={(e) => update('delta', e.target.value)}
                  />
                ) : (
                  <TextField
                    autoFocus
                    label={
                      action === 'count'
                        ? 'Unidades contadas físicamente'
                        : action === 'recover'
                          ? 'Cantidad del consumo cancelado'
                          : 'Cantidad de unidades'
                    }
                    inputProps={{
                      inputMode: action === 'recover' ? 'decimal' : 'numeric'
                    }}
                    helperText={
                      action === 'recover'
                        ? 'Si es un combo, indica cantidad de ese consumo. Solo se recupera la bebida seleccionada, en botellas enteras.'
                        : undefined
                    }
                    value={values.quantity || ''}
                    onChange={(e) => update('quantity', e.target.value)}
                  />
                )}
                {action === 'purchase' ? (
                  <>
                    <TextField
                      label='Costo unitario'
                      inputProps={{ inputMode: 'decimal' }}
                      value={values.unitCost || ''}
                      onChange={(e) => update('unitCost', e.target.value)}
                    />
                    <div className='supplies-preview'>
                      <Typography>Costo total de la compra</Typography>
                      <Typography variant='h5'>
                        {preview === null ? '—' : `${currency} ${preview}`}
                      </Typography>
                      <Typography variant='caption'>
                        Se registra una vez como egreso. El servidor confirma el
                        importe.
                      </Typography>
                    </div>
                  </>
                ) : (
                  <TextField
                    label='Motivo obligatorio'
                    value={values.reason || ''}
                    onChange={(e) => update('reason', e.target.value)}
                    multiline
                    minRows={2}
                  />
                )}
                {action === 'count' &&
                  wholeUnits(values.quantity || '', true) && (
                    <Alert
                      severity={
                        Number(values.quantity) === Number(selected?.quantity)
                          ? 'success'
                          : 'warning'
                      }
                    >
                      Diferencia:{' '}
                      {Number(values.quantity) - Number(selected?.quantity)}{' '}
                      unidades.{' '}
                      {Number(values.quantity) === Number(selected?.quantity)
                        ? 'El conteo coincide; no hace falta ajuste.'
                        : 'Confirmar conserva el movimiento histórico.'}
                    </Alert>
                  )}
                {action === 'opening' && (
                  <Alert severity='info'>
                    Solo puede registrarse antes de cualquier movimiento. Usa el
                    conteo real; no se crea una compra ni un egreso ficticio.
                  </Alert>
                )}
              </>
            )}
            {(action === 'expense' || action === 'purchase') && (
              <MoreOptions title='Fecha y observación opcional'>
                <Stack spacing={2}>
                  <TextField
                    type='date'
                    label='Fecha operativa'
                    InputLabelProps={{ shrink: true }}
                    value={values.operatingDate || today}
                    onChange={(e) => update('operatingDate', e.target.value)}
                  />
                  <TextField
                    label='Observación'
                    value={values.note || ''}
                    onChange={(e) => update('note', e.target.value)}
                    multiline
                    minRows={2}
                  />
                </Stack>
              </MoreOptions>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setAction(undefined)}>
            Volver
          </Button>
          <Button
            variant='contained'
            disabled={saving || !validation()}
            onClick={() => void submit()}
            startIcon={action === 'configure' ? <TuneOutlined /> : undefined}
          >
            {saving
              ? 'Confirmando…'
              : action === 'purchase'
                ? 'Registrar ingreso'
                : action === 'expense'
                  ? 'Guardar gasto'
                  : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
