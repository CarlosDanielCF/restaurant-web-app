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
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { restauranteApi } from '@/api';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import './insights.css';

interface CaptureTable {
  id: string;
  name: string;
  status: 'libre' | 'ocupada';
}

interface CaptureMetrics {
  captations: number;
  totalPeople: number;
  tables: number;
}

export function JaladorDashboard({ previewRoleSelector }: { previewRoleSelector?: React.ReactNode } = {}) {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const timeZone = restaurant?.timeZone || 'America/Lima';

  const [tables, setTables] = useState<CaptureTable[]>([]);
  const [metrics, setMetrics] = useState<CaptureMetrics>({
    captations: 0,
    totalPeople: 0,
    tables: 0
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState(Date.now());

  const generation = useRef(0);

  const load = useCallback(async () => {
    const ticket = ++generation.current;
    setBusy(true);
    setError('');

    try {
      const [tableRes, metricsRes] = await Promise.allSettled([
        restauranteApi.get<CaptureTable[]>('/client-captures/tables', {
          timeout: 12000
        }),
        restauranteApi.get<CaptureMetrics>('/client-captures/metrics', {
          timeout: 12000
        })
      ]);

      if (ticket !== generation.current) return;

      if (tableRes.status === 'fulfilled') {
        setTables(tableRes.value.data || []);
      } else {
        setError('No se pudo consultar el estado actual de las mesas.');
      }

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data || { captations: 0, totalPeople: 0, tables: 0 });
      }
      setLastSync(Date.now());
    } catch {
      if (ticket === generation.current) {
        setError('Error al actualizar las métricas de captación.');
      }
    } finally {
      if (ticket === generation.current) setBusy(false);
    }
  }, []);

  useLiveRefresh(load, ['attention.changed']);

  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);

  const freeTables = tables.filter((t) => t.status === 'libre');
  const occupiedTables = tables.filter((t) => t.status === 'ocupada');
  const totalTables = tables.length;
  const occupancyPercent = totalTables
    ? Math.round((occupiedTables.length / totalTables) * 100)
    : 0;

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
              Dashboard de Captación
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Disponibilidad de mesas y registro de comensales en puerta
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
              to='/jalador'
              variant='contained'
              size='small'
              startIcon={<HowToRegRoundedIcon />}
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
              Registrar llegada
            </Button>
          </Stack>
        </Stack>

        {busy && <LinearProgress aria-label='Actualizando disponibilidad de mesas' sx={{ borderRadius: 1 }} />}

        {error && <Alert severity='warning'>{error}</Alert>}

        {/* Quick CTA Banner */}
        <Card className='cook-quick-cta-card'>
          <div className='cook-cta-content'>
            <div className='cook-cta-icon'>
              <HowToRegRoundedIcon fontSize='large' />
            </div>
            <div className='cook-cta-text'>
              <Typography variant='subtitle1' fontWeight={700}>
                Registrar Comensales al Instante
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Selecciona mesa libre y número de personas con un solo toque
              </Typography>
            </div>
          </div>
          <Button
            component={Link}
            to='/jalador'
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
            Abrir Registro
          </Button>
        </Card>

        {/* Jalador KPIs */}
        <div className='dashboard-kpi-grid'>
          {/* Mesas disponibles */}
          <Card className='dash-kpi-card highlight-positive'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Mesas Disponibles</span>
              <div className='dash-kpi-icon-wrap emerald'>
                <TableRestaurantRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className='dash-kpi-value text-success'>
              {freeTables.length} <span className='unit'>/ {totalTables}</span>
            </div>
            <div className='dash-kpi-footer'>
              <span className='badge-pill green'>
                Listas para asignar a clientes
              </span>
            </div>
          </Card>

          {/* Mesas ocupadas */}
          <Card className='dash-kpi-card'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Mesas Ocupadas</span>
              <div className='dash-kpi-icon-wrap amber'>
                <TableRestaurantRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className='dash-kpi-value'>
              {occupiedTables.length}
            </div>
            <div className='dash-kpi-footer'>
              <span className={`badge-pill ${occupancyPercent > 75 ? 'amber' : 'turquoise'}`}>
                {occupancyPercent}% ocupación del salón
              </span>
            </div>
          </Card>

          {/* Personas captadas hoy */}
          <Card className='dash-kpi-card highlight-turquoise'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Personas Captadas Hoy</span>
              <div className='dash-kpi-icon-wrap turquoise'>
                <PeopleAltRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className='dash-kpi-value'>{metrics.totalPeople}</div>
            <div className='dash-kpi-footer'>
              <span>Clientes ingresados hoy</span>
            </div>
          </Card>

          {/* Captaciones del día */}
          <Card className='dash-kpi-card'>
            <div className='dash-kpi-header'>
              <span className='dash-kpi-title'>Grupos / Captaciones</span>
              <div className='dash-kpi-icon-wrap purple'>
                <CheckCircleRoundedIcon fontSize='small' />
              </div>
            </div>
            <div className='dash-kpi-value'>{metrics.captations}</div>
            <div className='dash-kpi-footer'>
              <span>{metrics.tables} mesas asignadas</span>
            </div>
          </Card>
        </div>

        {/* Mesas Disponibles Quick List */}
        <Card className='dash-section-card'>
          <div className='dash-card-header'>
            <div>
              <Typography variant='subtitle1' fontWeight={700} color='#0f172a'>
                Mesas Libres para Asignar
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Toca cualquier mesa para registrar la llegada
              </Typography>
            </div>
            <Link to='/jalador' className='dash-link'>
              Ver panel completo →
            </Link>
          </div>

          <div className='jalador-tables-grid'>
            {freeTables.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center', width: '100%' }}>
                <Typography variant='body2' color='text.secondary'>
                  En este momento todas las mesas están ocupadas.
                </Typography>
              </Box>
            ) : (
              freeTables.map((t) => (
                <Link key={t.id} to='/jalador' className='jalador-table-badge'>
                  <span className='table-icon'>🪑</span>
                  <span className='table-num'>Mesa {t.name}</span>
                  <span className='table-state green'>LIBRE</span>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Footer timestamp */}
        <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center', pt: 1 }}>
          Actualizado: {new Date(lastSync).toLocaleTimeString('es-PE', { timeZone })}
        </Typography>
      </Stack>
    </Container>
  );
}
