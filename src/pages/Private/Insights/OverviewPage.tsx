import { operationalLabel } from './labels';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import TableRestaurantOutlined from '@mui/icons-material/TableRestaurantOutlined';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import { WorkspaceEmpty } from '@/components/operational/WorkspaceEmpty';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Container,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import { Link } from 'react-router-dom';
import { restauranteApi } from '@/api';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { Account } from '../Operations/types';
interface Overview {
  accounts: Account[];
  slow: number;
  settlements: number;
  sales: { amount: string; currency: string }[];
  captured: string;
}
export function OverviewPage() {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const [data, setData] = useState<Overview>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const generation = useRef(0);
  const load = useCallback(async () => {
    const ticket = ++generation.current;
    setData(undefined);
    setBusy(true);
    setError('');
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: restaurant?.timeZone || 'America/Lima'
    }).format(new Date());
    try {
      const [a, k, s, v] = await Promise.all([
        restauranteApi.get<Account[]>('/attention-accounts'),
        restauranteApi.get<{
          serverNow: string;
          dispatches: { confirmedAt: string }[];
        }>('/kitchen/board'),
        restauranteApi.get<{ shift: { status: string } }[]>('/finance/shifts'),
        restauranteApi.get<{
          totals: { amount: string; currency: string }[];
          capturedAt: string;
        }>('/operational-reports/sales', {
          params: { from: date, to: date, page: 1, limit: 1 }
        })
      ]);
      if (ticket !== generation.current) return;
      setData({
        accounts: a.data,
        slow: k.data.dispatches.filter(
          (d) =>
            new Date(k.data.serverNow).getTime() -
              new Date(d.confirmedAt).getTime() >
            900000
        ).length,
        settlements: s.data.filter((x) => x.shift.status === 'SUBMITTED')
          .length,
        sales: v.data.totals,
        captured: v.data.capturedAt
      });
    } catch {
      if (ticket === generation.current)
        setError(
          'No se pudo actualizar el resumen. Los datos anteriores pueden estar desactualizados.'
        );
    } finally {
      if (ticket === generation.current) setBusy(false);
    }
  }, [restaurant?.id, restaurant?.timeZone]);
  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);
  return (
    <Container maxWidth='xl' className='final-page pos-overview'>
      <Stack spacing={2}>
        <Stack direction='row' justifyContent='space-between'>
          <Typography variant='h4'>Resumen operativo</Typography>
          <Button onClick={() => void load()} disabled={busy}>
            Actualizar resumen
          </Button>
        </Stack>
        <Typography>
          Hoy · {restaurant?.timeZone}. Ventas por confirmación de consumo, no
          por cobro.
        </Typography>
        {busy && <LinearProgress />}
        {error && <Alert severity='warning'>{error}</Alert>}
        {data && (
          <>
            <div className='overview-grid'>
              <Card className='point-kpi point-kpi--green'>
                <AccountBalanceWalletOutlined
                  className='point-kpi-icon'
                  aria-hidden='true'
                />
                <Typography>Ventas confirmadas hoy</Typography>
                {data.sales.length ? (
                  data.sales.map((v, i) => (
                    <Typography key={i} variant='h4'>
                      {v.currency} {v.amount}
                    </Typography>
                  ))
                ) : (
                  <Typography variant='h4'>Sin ventas confirmadas</Typography>
                )}
                <Button component={Link} to='/operational-reports'>
                  Ver reportes
                </Button>
              </Card>
              <Card className='point-kpi point-kpi--blue'>
                <TableRestaurantOutlined
                  className='point-kpi-icon'
                  aria-hidden='true'
                />
                <Typography>Cuentas abiertas</Typography>
                <Typography variant='h4'>
                  {
                    data.accounts.filter((a) => a.attentionStatus === 'OPEN')
                      .length
                  }
                </Typography>
                <Button component={Link} to='/attention'>
                  Atender
                </Button>
              </Card>
              <Card className='point-kpi point-kpi--red'>
                <AccessTimeOutlined
                  className='point-kpi-icon'
                  aria-hidden='true'
                />
                <Typography>Envíos pendientes con demora &gt;15 min</Typography>
                <Typography variant='h4'>{data.slow}</Typography>
                <Button component={Link} to='/kitchen'>
                  Ver cocina
                </Button>
              </Card>
              <Card className='point-kpi point-kpi--amber'>
                <FactCheckOutlined
                  className='point-kpi-icon'
                  aria-hidden='true'
                />
                <Typography>Rendiciones pendientes de revisión</Typography>
                <Typography variant='h4'>{data.settlements}</Typography>
                <Button component={Link} to='/finance'>
                  Revisar
                </Button>
              </Card>
            </div>
            <Card className='point-overview-attentions'>
              <Typography variant='h5' component='h2'>
                Atenciones recientes
              </Typography>
              <Typography color='text.secondary'>
                Últimas cuentas dentro del alcance de la consulta actual.
              </Typography>
              {!data.accounts.length ? (
                <WorkspaceEmpty
                  title='Aún no hay atenciones'
                  description='Las cuentas registradas aparecerán aquí. Las ventas y los cobros se consultan por separado.'
                />
              ) : (
                [...data.accounts]
                  .sort((a, b) =>
                    (b.createdAt || '').localeCompare(a.createdAt || '')
                  )
                  .slice(0, 5)
                  .map((a) => (
                    <div className='point-recent-account' key={a.id}>
                      <div>
                        <strong>
                          {a.tables.map((t) => t.name).join(' + ') ||
                            operationalLabel(a.modality)}
                        </strong>
                        <small>
                          {a.id.slice(0, 8)} ·{' '}
                          {operationalLabel(a.attentionStatus)}
                        </small>
                      </div>
                      <span>
                        Consumo <strong>S/ {a.total}</strong>
                      </span>
                      <span>
                        Saldo <strong>S/ {a.balance}</strong>
                      </span>
                    </div>
                  ))
              )}
              <Button component={Link} to='/attention'>
                Ver atenciones
              </Button>
            </Card>
            <Typography variant='caption'>
              Consultado:{' '}
              {new Date(data.captured).toLocaleString('es-PE', {
                timeZone: restaurant?.timeZone
              })}
              . Cuentas: alcance de las 500 más recientes del contrato actual.
            </Typography>
            <Alert severity='info'>
              Deudas y abonos se consultan en Cobros. Una deuda no equivale a
              efectivo recibido; las propinas y la custodia courier no son
              ventas.
            </Alert>
          </>
        )}
      </Stack>
    </Container>
  );
}
