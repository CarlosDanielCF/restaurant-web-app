import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
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
  method?: 'post' | 'patch'
) => Promise<boolean>;
export function OperationsPage() {
  const role = useSelector(selectAuth).user?.role.name;
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
  const { socket, online } = useContext(SocketContext);
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
          restauranteApi.get<Reservation[]>('/reservations'),
          restauranteApi.get('/clients?limit=100')
        ]);
        setAccounts(a.data);
        setTables(t.data);
        setOperators(o.data);
        setReservations(r.data);
        setClients(c.data.clients);
      }
      setLoaded(true);
    } catch {
      setLoaded(false);
      setError(
        'No se pudieron actualizar los datos. Recargue antes de operar.'
      );
    }
  }, [cook, restaurant?.id]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const changed = () => {
      setMessage('Información actualizada por otro dispositivo');
      void refresh();
    };
    for (const event of [
      'catalog.changed',
      'attention.changed',
      'reservation.changed',
      'connect'
    ])
      socket?.on(event, changed);
    return () => {
      for (const event of [
        'catalog.changed',
        'attention.changed',
        'reservation.changed',
        'connect'
      ])
        socket?.off(event, changed);
    };
  }, [socket, refresh]);
  const run: Run = async (path, body, method = 'post') => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    const signature = JSON.stringify({ path, body, method });
    const key =
      retry.current?.signature === signature
        ? retry.current.key
        : crypto.randomUUID();
    retry.current = { signature, key };
    try {
      await restauranteApi.request({
        method,
        url: path,
        data: body,
        headers: { 'Idempotency-Key': key }
      });
      retry.current = undefined;
      await refresh();
      setMessage('Operación guardada');
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
    <Container maxWidth='lg'>
      <Stack spacing={2} py={2}>
        <Typography variant='h4'>Atención del restaurante</Typography>
        <Typography>
          Zona horaria: {restaurant?.timeZone}. Los consumos son borradores;
          todavía no se envían a cocina ni generan cobros.
        </Typography>
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
        <Button onClick={() => void refresh()} disabled={busy}>
          Actualizar datos
        </Button>
        <Tabs
          value={tab}
          onChange={(_, value: number) => setTab(value)}
          variant='scrollable'
          scrollButtons='auto'
        >
          <Tab label='Cuentas y mesas' disabled={cook} />
          <Tab label='Reservas' disabled={cook} />
          <Tab label='Menú compuesto' />
          <Tab label='Carta y disponibilidad' />
        </Tabs>
        <fieldset
          disabled={busy || !loaded}
          style={{ border: 0, padding: 0, minWidth: 0 }}
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
          {tab === 1 && !cook && (
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
              editable={manager || cook}
              run={run}
            />
          )}
          {tab === 3 && (
            <CatalogWorkspace
              products={products}
              portions={portions}
              manager={manager}
              availability={manager || cook}
              run={run}
            />
          )}
        </fieldset>
      </Stack>
    </Container>
  );
}
