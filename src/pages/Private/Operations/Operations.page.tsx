import { useSearchParams, Link, Navigate } from 'react-router-dom';
import {
  TableRestaurantOutlined,
  EventAvailableOutlined,
  MenuBookOutlined,
  Inventory2Outlined,
  SoupKitchenOutlined
} from '@mui/icons-material';
import { reconcileAccounts } from './operationFeedback';
import { useWorkerAccess } from '@/hooks/useWorkerAccess';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import './operations.css';
import { useCallback, useContext, useRef, useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Button,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux';
import { SocketContext } from '@/context';
import { restauranteApi } from '@/api';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { CatalogWorkspace } from './CatalogWorkspace';
import { DailyMenuWorkspace } from './DailyMenuWorkspace';
import { AttentionWorkspace } from './AttentionWorkspace';
import { ReservationsWorkspace } from './ReservationsWorkspace';
import {
  Account,
  DailyMenu,
  Operator,
  Portion,
  Product,
  Reservation,
  Table
} from './types';
export type Run = (
  path: string,
  body: object,
  method?: 'post' | 'patch',
  onSuccess?: (data: unknown) => void,
  onError?: (message: string) => void
) => Promise<boolean>;
export function OperationsPage() {
  const user = useSelector(selectAuth).user;
  const can = useWorkerAccess();
  const allowReservations =
      user?.role.name !== 'COCINERO' && can('reservations'),
    allowClients = can('clients');
  const role = user?.role.name;
  const cook = role === 'COCINERO',
    manager = ['DUENO', 'ADMINISTRADOR'].includes(role || '');
  const [params] = useSearchParams();
  const initialTab = () =>
    cook
      ? params.get('tab') === 'catalog'
        ? 3
        : 2
      : params.get('tab') === 'reservations' && allowReservations
        ? 1
        : params.get('tab') === 'menu'
          ? 2
          : params.get('tab') === 'catalog'
            ? 3
            : 0;
  const [tab, setTab] = useState(initialTab);
  useEffect(() => {
    setTab(initialTab());
  }, [params, cook, allowReservations]);
  const [products, setProducts] = useState<Product[]>([]);
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [portions, setPortions] = useState<Portion[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clients, setClients] = useState<
    { id: string; person: { firstName: string; lastName: string } }[]
  >([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const lock = useRef(false);
  const accountEpoch = useRef(0);
  const retry = useRef<{ signature: string; key: string }>();
  const { online } = useContext(SocketContext);
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const refresh = useCallback(async () => {
    const readEpoch = accountEpoch.current;
    try {
      const [p, m, pol] = await Promise.all([
        restauranteApi.get<Product[]>('/products', { timeout: 15000 }),
        restauranteApi.get<DailyMenu[]>('/daily-menus', { timeout: 15000 }),
        restauranteApi.get<Portion[]>('/portion-policies', { timeout: 15000 })
      ]);
      setProducts(p.data);
      setMenus(m.data);
      setPortions(pol.data);
      if (!cook) {
        const [a, t, o, r, c] = await Promise.all([
          restauranteApi.get<Account[]>('/attention-accounts', {
            timeout: 15000
          }),
          restauranteApi.get<Table[]>('/tables', { timeout: 15000 }),
          restauranteApi.get<Operator[]>('/attention-accounts/operators', {
            timeout: 15000
          }),
          allowReservations
            ? restauranteApi.get<Reservation[]>('/reservations', {
                timeout: 15000
              })
            : Promise.resolve({ data: [] }),
          allowClients
            ? restauranteApi.get('/clients?limit=100', { timeout: 15000 })
            : Promise.resolve({ data: { clients: [] } })
        ]);
        if (readEpoch === accountEpoch.current)
          setAccounts((current) => reconcileAccounts(current, a.data));
        setTables(t.data);
        setOperators(o.data);
        setReservations(r.data);
        setClients(c.data.clients);
      }
      setLoaded(true);
      setError('');
      return true;
    } catch {
      setLoaded(false);
      setError(
        'No se pudieron actualizar los datos. Se reintentará automáticamente antes de operar.'
      );
      return false;
    }
  }, [cook, restaurant?.id, allowReservations, allowClients]);
  useLiveRefresh(refresh, [
    'catalog.changed',
    'attention.changed',
    'reservation.changed',
    'kitchen.changed',
    'finance.changed',
    'update-table'
  ]);
  const run: Run = async (path, body, method = 'post', onSuccess, onError) => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    const { expectedVersion: _version, ...intent } = body as Record<
      string,
      unknown
    >;
    void _version;
    const signature = JSON.stringify({ path, body: intent, method });
    const storageKey = `pending-operations:${restaurant?.id}:${user?.id}`;
    let pending: Record<string, string> = {};
    try {
      pending = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    } catch {
      /* Ignore invalid local cache. */
    }
    const key =
      retry.current?.signature === signature
        ? retry.current.key
        : pending[signature] || crypto.randomUUID();
    retry.current = { signature, key };
    pending[signature] = key;
    sessionStorage.setItem(storageKey, JSON.stringify(pending));
    try {
      const result = await restauranteApi.request({
        method,
        url: path,
        data: body,
        headers: { 'Idempotency-Key': key },
        timeout: 20000
      });
      retry.current = undefined;
      delete pending[signature];
      sessionStorage.setItem(storageKey, JSON.stringify(pending));
      const updated = result.data?.account || result.data;
      if (
        updated?.id &&
        Number.isInteger(updated.version) &&
        Array.isArray(updated.lines) &&
        Array.isArray(updated.tables)
      ) {
        accountEpoch.current++;
        setAccounts((current) =>
          reconcileAccounts(current, [
            ...current.filter((account) => account.id !== updated.id),
            updated as Account
          ])
        );
        // The mutation already returned the authoritative account. Catalog/presence refresh must not delay its feedback.
        void refresh();
      } else await refresh();
      onSuccess?.(result.data);
      setMessage(result.data?.warning || 'Operación guardada');
      return true;
    } catch (e) {
      const response = e as {
        status?: number;
        data?: { message?: string | string[] };
      };
      const msg = response?.data?.message;
      const detail = Array.isArray(msg) ? msg.join('. ') : msg;
      // A conflict never replays a write automatically. Reconcile the account before a deliberate retry.
      const reconciled = response.status === 409 ? await refresh() : false;
      const message =
        response.status === 409
          ? `${detail || 'La cuenta cambió en otro dispositivo'}. ${reconciled ? 'Datos actualizados; revise el pedido antes de reintentar.' : 'No se pudo actualizar la cuenta. Reintente la conexión antes de confirmar.'}`
          : detail ||
            'Sin confirmación del servidor. Reintente la misma operación; se conservará su clave para evitar duplicados.';
      setError(message);
      onError?.(message);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  if (cook && params.get('tab') === 'reservations')
    return <Navigate to='/unauthorized' replace />;
  return (
    <Container maxWidth='xl' className='operations-workspace'>
      <Stack spacing={1.5} py={0.5}>
        <Box className='operations-heading'>
          <Box>
            <Typography variant='overline' color='primary'>
              Servicio diario
            </Typography>
            <Typography variant='h4' component='h1'>
              {cook ? 'Menú y disponibilidad' : 'Atención del restaurante'}
            </Typography>
            <Typography color='text.secondary' mt={1}>
              {cook
                ? 'Menú del día, opciones y porciones disponibles.'
                : 'Mesas, pedidos y reservas en un solo lugar.'}
            </Typography>
          </Box>
          <Stack direction='row' gap={1} flexWrap='wrap' alignItems='center'>
            {cook && can('kitchen') && (
              <Button
                component={Link}
                to='/kitchen'
                variant='contained'
                startIcon={<SoupKitchenOutlined />}
              >
                Ver comandas
              </Button>
            )}
            <Chip
              size='small'
              variant='outlined'
              label={restaurant?.timeZone || 'Zona horaria del restaurante'}
            />
            <Chip
              size='small'
              color={online && loaded ? 'success' : 'warning'}
              label={online && loaded ? 'Conectado' : 'Revisar conexión'}
            />
            {!!error && (
              <Button
                variant='outlined'
                onClick={() => void refresh()}
                disabled={busy}
              >
                Reintentar conexión
              </Button>
            )}
          </Stack>
        </Box>
        {!cook && loaded && (
          <Box className='operations-metrics' aria-label='Resumen de atención'>
            <Box>
              <Typography color='text.secondary'>Cuentas abiertas</Typography>
              <Typography variant='h4'>
                {accounts.filter((a) => a.attentionStatus === 'OPEN').length}
              </Typography>
            </Box>
            <Box>
              <Typography color='text.secondary'>Mesas en atención</Typography>
              <Typography variant='h4'>
                {
                  tables.filter(
                    (t) =>
                      t.isActive &&
                      accounts.some(
                        (a) =>
                          a.attentionStatus === 'OPEN' &&
                          a.tables.some((x) => x.id === t.id)
                      )
                  ).length
                }
              </Typography>
            </Box>
            <Box>
              <Typography color='text.secondary'>
                Reservas pendientes
              </Typography>
              <Typography variant='h4'>
                {reservations.filter((r) => r.status === 'BOOKED').length}
              </Typography>
            </Box>
          </Box>
        )}
        {(busy || !loaded) && (
          <LinearProgress aria-label='Actualizando atención' />
        )}
        {(!online || !loaded) && (
          <Alert severity='warning'>
            Sin conexión en tiempo real o datos sin actualizar. Revise la
            conexión antes de operar.
          </Alert>
        )}
        {error && (
          <Alert severity='error' onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity='info' onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}
        <Tabs
          className='operations-tabs'
          aria-label='Secciones de atención'
          value={tab}
          onChange={(_, value: number) => setTab(value)}
          variant='scrollable'
          scrollButtons='auto'
        >
          <Tab
            icon={<TableRestaurantOutlined />}
            iconPosition='start'
            label='Cuentas y mesas'
            disabled={cook}
            sx={{ display: cook ? 'none' : undefined }}
          />
          <Tab
            icon={<EventAvailableOutlined />}
            iconPosition='start'
            label='Reservas'
            disabled={cook}
            sx={{ display: allowReservations ? undefined : 'none' }}
          />
          <Tab
            icon={<MenuBookOutlined />}
            iconPosition='start'
            label='Menú compuesto'
          />
          <Tab
            icon={<Inventory2Outlined />}
            iconPosition='start'
            label='Carta y disponibilidad'
          />
        </Tabs>
        <fieldset
          disabled={busy || !loaded}
          style={{ border: 0, padding: 0, minWidth: 0 }}
        >
          <Box
            className='operations-section'
            role='tabpanel'
            aria-label={
              [
                'Cuentas y mesas',
                'Reservas',
                'Menú compuesto',
                'Carta y disponibilidad'
              ][tab]
            }
          >
            {tab === 0 && !cook && (
              <AttentionWorkspace
                accounts={accounts}
                tables={tables}
                operators={operators}
                products={products}
                menus={menus}
                portions={portions}
                clients={clients}
                run={run}
              />
            )}
            {tab === 1 && !cook && allowReservations && (
              <ReservationsWorkspace
                reservations={reservations}
                accounts={accounts}
                tables={tables}
                operators={operators}
                run={run}
                zone={restaurant?.timeZone || 'America/Lima'}
              />
            )}
            {tab === 2 && (
              <DailyMenuWorkspace
                menus={menus}
                products={products}
                editable={(manager || cook) && can('catalog.manage')}
                run={run}
              />
            )}
            {tab === 3 && (
              <CatalogWorkspace
                products={products}
                portions={portions}
                manager={manager && can('catalog.manage')}
                availability={(manager || cook) && can('availability.manage')}
                run={run}
              />
            )}
          </Box>
        </fieldset>
      </Stack>
    </Container>
  );
}
