import { useWorkerAccess } from '@/hooks/useWorkerAccess';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import './operations.css';
import { useCallback, useContext, useRef, useState } from 'react';
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
  onSuccess?: (data: unknown) => void
) => Promise<boolean>;
export function OperationsPage() {
  const can = useWorkerAccess();
  const allowReservations = can('reservations'),
    allowClients = can('clients');
  const user = useSelector(selectAuth).user;
  const role = user?.role.name;
  const cook = role === 'COCINERO',
    manager = ['DUENO', 'ADMINISTRADOR'].includes(role || '');
  const [tab, setTab] = useState(cook ? 2 : 0);
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
  const retry = useRef<{ signature: string; key: string }>();
  const { online } = useContext(SocketContext);
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const refresh = useCallback(async () => {
    try {
      const [p, m, pol] = await Promise.all([
        restauranteApi.get<Product[]>('/products'),
        restauranteApi.get<DailyMenu[]>('/daily-menus'),
        restauranteApi.get<Portion[]>('/portion-policies')
      ]);
      setProducts(p.data);
      setMenus(m.data);
      setPortions(pol.data);
      if (!cook) {
        const [a, t, o, r, c] = await Promise.all([
          restauranteApi.get<Account[]>('/attention-accounts'),
          restauranteApi.get<Table[]>('/tables'),
          restauranteApi.get<Operator[]>('/attention-accounts/operators'),
          allowReservations
            ? restauranteApi.get<Reservation[]>('/reservations')
            : Promise.resolve({ data: [] }),
          allowClients
            ? restauranteApi.get('/clients?limit=100')
            : Promise.resolve({ data: { clients: [] } })
        ]);
        setAccounts(a.data);
        setTables(t.data);
        setOperators(o.data);
        setReservations(r.data);
        setClients(c.data.clients);
      }
      setLoaded(true);
      setError('');
    } catch {
      setLoaded(false);
      setError(
        'No se pudieron actualizar los datos. Se reintentará automáticamente antes de operar.'
      );
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
  const run: Run = async (path, body, method = 'post', onSuccess) => {
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
        headers: { 'Idempotency-Key': key }
      });
      retry.current = undefined;
      delete pending[signature];
      sessionStorage.setItem(storageKey, JSON.stringify(pending));
      await refresh();
      onSuccess?.(result.data);
      setMessage(result.data?.warning || 'Operación guardada');
      return true;
    } catch (e) {
      const response = e as { data?: { message?: string | string[] } };
      const msg = response?.data?.message;
      setError(
        Array.isArray(msg)
          ? msg.join('. ')
          : msg ||
              'Sin confirmación. Reintente la misma operación; no se duplicará.'
      );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Container maxWidth='xl' className='operations-workspace'>
      <Stack spacing={1.5} py={0.5}>
        <Box className='operations-heading'>
          <Box>
            <Typography variant='overline' color='primary'>
              Servicio diario
            </Typography>
            <Typography variant='h4' component='h1'>
              Atención del restaurante
            </Typography>
            <Typography color='text.secondary' mt={1}>
              Mesas, pedidos y reservas en un solo lugar.
            </Typography>
          </Box>
          <Stack direction='row' gap={1} flexWrap='wrap' alignItems='center'>
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
              <Typography color='text.secondary'>Mesas ocupadas</Typography>
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
          <Tab label='Cuentas y mesas' disabled={cook} />
          <Tab
            label='Reservas'
            disabled={cook}
            sx={{ display: allowReservations ? undefined : 'none' }}
          />
          <Tab label='Menú compuesto' />
          <Tab label='Carta y disponibilidad' />
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
