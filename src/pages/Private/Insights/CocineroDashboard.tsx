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
import SoupKitchenRoundedIcon from '@mui/icons-material/SoupKitchenRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TvRoundedIcon from '@mui/icons-material/TvRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { restauranteApi } from '@/api';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { Board, Dispatch } from '../Operations/fulfillment.types';
import { Portion } from '../Operations/types';
import './insights.css';

export function CocineroDashboard({ previewRoleSelector }: { previewRoleSelector?: React.ReactNode } = {}) {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const timeZone = restaurant?.timeZone || 'America/Lima';

  const [board, setBoard] = useState<Board | null>(null);
  const [portions, setPortions] = useState<Portion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState(Date.now());

  const generation = useRef(0);

  const load = useCallback(async () => {
    const ticket = ++generation.current;
    setBusy(true);
    setError('');

    try {
      const [boardRes, portionRes] = await Promise.allSettled([
        restauranteApi.get<Board>('/kitchen/board', { timeout: 12000 }),
        restauranteApi.get<Portion[]>('/portion-policies', { timeout: 12000 })
      ]);

      if (ticket !== generation.current) return;

      if (boardRes.status === 'fulfilled') {
        setBoard(boardRes.value.data || null);
      } else {
        setError('No se pudo conectar con la cola de pedidos de cocina.');
      }

      if (portionRes.status === 'fulfilled') {
        setPortions(portionRes.value.data || []);
      }
      setLastSync(Date.now());
    } catch {
      if (ticket === generation.current) {
        setError('Error al actualizar las métricas de cocina.');
      }
    } finally {
      if (ticket === generation.current) setBusy(false);
    }
  }, []);

  useLiveRefresh(load, ['kitchen.changed', 'attention.changed']);

  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);

  // Production metrics calculation
  const serverNowTime = board ? Date.parse(board.serverNow) : Date.now();
  const pendingDispatches = board ? board.dispatches.filter((d) => d.pending) : [];
  const totalPendingComandas = pendingDispatches.length;

  const totalPendingUnits = pendingDispatches.reduce(
    (acc, d) =>
      acc +
      d.items.reduce(
        (sum, item) => sum + (item.kitchenPending || 0),
        0
      ),
    0
  );

  const dispatches12m = pendingDispatches.filter((d) => {
    const diff = (serverNowTime - Date.parse(d.confirmedAt)) / 60000;
    return diff >= 12 && diff < 15;
  }).length;

  const dispatches15m = pendingDispatches.filter((d) => {
    const diff = (serverNowTime - Date.parse(d.confirmedAt)) / 60000;
    return diff >= 15;
  }).length;

  const waitTimesMinutes = pendingDispatches.map((d) =>
    Math.max(0, Math.floor((serverNowTime - Date.parse(d.confirmedAt)) / 60000))
  );

  const oldestWaitMinutes = waitTimesMinutes.length
    ? Math.max(...waitTimesMinutes)
    : 0;

  const averageWaitMinutes = waitTimesMinutes.length
    ? Math.round(
        waitTimesMinutes.reduce((a, b) => a + b, 0) / waitTimesMinutes.length
      )
    : 0;

  // Portions / Stock availability
  const exhaustedPortions = portions.filter(
    (p) => p.isActive && p.availabilityUnits === 0
  );
  const criticalPortions = portions.filter(
    (p) => p.isActive && p.availabilityUnits > 0 && p.availabilityUnits <= 5
  );

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
              Dashboard de Cocina y Producción
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Control de comandas, velocidad y disponibilidad de platos
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
              to='/kitchen'
              variant='contained'
              size='small'
              startIcon={<SoupKitchenRoundedIcon />}
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                borderRadius: '8px',
                bgcolor: '#0d9488',
                '&:hover': { bgcolor: '#0f766e' },
                textTransform: 'none',
                fontWeight: 700,
                px: 2
              }}
            >
              Abrir Pantalla Cocina (KDS)
            </Button>
          </Stack>
        </Stack>

        {busy && <LinearProgress aria-label='Actualizando métricas de producción' sx={{ borderRadius: 1 }} />}

        {error && <Alert severity='warning'>{error}</Alert>}

        {/* Quick KDS Touch Action Banner for Tablet & Mobile */}
        <Card className='cook-quick-cta-card'>
          <div className='cook-cta-content'>
            <div className='cook-cta-icon'>
              <TvRoundedIcon fontSize='large' />
            </div>
            <div className='cook-cta-text'>
              <Typography variant='subtitle1' fontWeight={700}>
                Pantalla Táctil de Despachos
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {board?.presence.screens || 1} pantalla(s) activa(s) • Toca para gestionar salidas en tiempo real
              </Typography>
            </div>
          </div>
          <Button
            component={Link}
            to='/kitchen'
            variant='contained'
            sx={{
              borderRadius: '8px',
              bgcolor: '#0d9488',
              '&:hover': { bgcolor: '#0f766e' },
              textTransform: 'none',
              fontWeight: 700,
              minHeight: '44px'
            }}
          >
            Ir a Cocina
          </Button>
        </Card>

        {/* Production KPIs Grid */}
        <div className='dashboard-kpi-grid'>
          {/* Comandas pendientes */}
          <Card className='dash-kpi-card highlight-turquoise'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Comandas Pendientes</span>
              <div className='dash-kpi-icon-wrap turquoise'>
                <SoupKitchenRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className='dash-kpi-value'>{totalPendingComandas}</div>
            <div className='dash-kpi-footer'>
              <span className='badge-pill turquoise'>
                {pendingDispatches.length ? 'En cola de preparación' : 'Cocina al día'}
              </span>
            </div>
          </Card>

          {/* Platos / Unidades pendientes */}
          <Card className='dash-kpi-card'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Platos / Unidades por Salir</span>
              <div className='dash-kpi-icon-wrap blue'>
                <RestaurantMenuRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className='dash-kpi-value'>{totalPendingUnits}</div>
            <div className='dash-kpi-footer'>
              <span>Raciones pendientes totales</span>
            </div>
          </Card>

          {/* Demoras >12 min */}
          <Card className='dash-kpi-card'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Aviso de Tiempo (&gt;12m)</span>
              <div className={`dash-kpi-icon-wrap ${dispatches12m > 0 ? 'amber' : 'green'}`}>
                <AccessTimeRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className={`dash-kpi-value ${dispatches12m > 0 ? 'text-warning' : 'text-success'}`}>
              {dispatches12m}
            </div>
            <div className='dash-kpi-footer'>
              {dispatches12m > 0 ? (
                <span className='badge-pill amber'>Próximas a límite crítico</span>
              ) : (
                <span className='text-muted'>Sin avisos intermedios</span>
              )}
            </div>
          </Card>

          {/* Demoras críticas >15 min */}
          <Card className='dash-kpi-card'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Demoradas Críticas (&gt;15m)</span>
              <div className={`dash-kpi-icon-wrap ${dispatches15m > 0 ? 'red' : 'green'}`}>
                <WarningAmberRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className={`dash-kpi-value ${dispatches15m > 0 ? 'text-danger' : 'text-success'}`}>
              {dispatches15m}
            </div>
            <div className='dash-kpi-footer'>
              {dispatches15m > 0 ? (
                <span className='badge-pill red'>¡Atención inmediata requerida!</span>
              ) : (
                <span className='badge-pill green'>Conforme (&lt;15 min)</span>
              )}
            </div>
          </Card>
        </div>

        {/* Tiempos de Cocina y Disponibilidad de Platos */}
        <div className='dashboard-charts-grid'>
          {/* Tiempos de Cocina */}
          <Card className='dash-section-card'>
            <div className='dash-card-header'>
              <div>
                <Typography variant='subtitle1' fontWeight={700} color='#0f172a'>
                  Tiempos de Cocina
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Velocidad actual de respuesta y preparación
                </Typography>
              </div>
              <Link to='/operational-reports' className='dash-link'>
                Reporte histórico →
              </Link>
            </div>

            <div className='cook-times-box'>
              <div className='cook-time-stat'>
                <span className='time-label'>Espera máxima actual</span>
                <span className={`time-val ${oldestWaitMinutes >= 15 ? 'red' : oldestWaitMinutes >= 12 ? 'amber' : 'green'}`}>
                  {oldestWaitMinutes} min
                </span>
                <span className='time-caption'>Comanda más antigua en espera</span>
              </div>

              <div className='cook-time-stat'>
                <span className='time-label'>Tiempo promedio en cola</span>
                <span className='time-val text-primary'>
                  {averageWaitMinutes} min
                </span>
                <span className='time-caption'>Promedio comandas pendientes</span>
              </div>
            </div>
          </Card>

          {/* Disponibilidad y Platos Agotados */}
          <Card className='dash-section-card'>
            <div className='dash-card-header'>
              <div>
                <Typography variant='subtitle1' fontWeight={700} color='#0f172a'>
                  Disponibilidad de Platos y Menú
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Políticas de porciones y agotados
                </Typography>
              </div>
              <Link to='/attention' className='dash-link'>
                Editar menú →
              </Link>
            </div>

            <div className='cook-portions-list'>
              {portions.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Sin límites de porciones configurados actualmente.
                  </Typography>
                </Box>
              ) : (
                <>
                  {exhaustedPortions.length > 0 && (
                    <div className='cook-portion-group'>
                      <span className='group-title red'>Platos Agotados (0 porciones):</span>
                      <div className='chips-wrap'>
                        {exhaustedPortions.map((p) => (
                          <Chip
                            key={p.id}
                            label={p.name}
                            size='small'
                            sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {criticalPortions.length > 0 && (
                    <div className='cook-portion-group'>
                      <span className='group-title amber'>Porciones Críticas (≤5 u):</span>
                      <div className='chips-wrap'>
                        {criticalPortions.map((p) => (
                          <Chip
                            key={p.id}
                            label={`${p.name}: ${p.availabilityUnits} u`}
                            size='small'
                            sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 600 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {exhaustedPortions.length === 0 && criticalPortions.length === 0 && (
                    <div className='dash-empty-stock-ok'>
                      <span className='stock-ok-icon'>✓</span>
                      <span>Todos los platos controlados tienen disponibilidad suficiente.</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Footer timestamp */}
        <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center', pt: 1 }}>
          Actualizado: {new Date(lastSync).toLocaleTimeString('es-PE', { timeZone })}
        </Typography>
      </Stack>
    </Container>
  );
}
