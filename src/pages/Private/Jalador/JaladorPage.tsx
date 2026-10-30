import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { restauranteApi } from '@/api';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import './jalador.css';

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

function errorMessage(error: unknown): string {
  const candidate = error as {
    response?: { data?: { message?: string | string[] } };
    data?: { message?: string | string[] };
  };
  const response = candidate.response ?? candidate;
  const message = response?.data?.message;
  if (Array.isArray(message)) return message.join('. ');
  if (message) {
    if (/ocupad/i.test(message))
      return 'La mesa ya está ocupada. Elige otra mesa.';
    if (/mesa no encontrada/i.test(message))
      return 'La mesa ya no está disponible. Actualiza la lista.';
    return message;
  }
  return 'No se pudo registrar la llegada. Revisa tu conexión e inténtalo nuevamente.';
}

export function JaladorPage() {
  const [tables, setTables] = useState<CaptureTable[]>([]);
  const [metrics, setMetrics] = useState<CaptureMetrics>({
    captations: 0,
    totalPeople: 0,
    tables: 0
  });
  const [selected, setSelected] = useState<CaptureTable[]>([]);
  const [partySize, setPartySize] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const requestLock = useRef(false);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const [tableResponse, metricsResponse] = await Promise.all([
        restauranteApi.get<CaptureTable[]>('/client-captures/tables', {
          timeout: 15000
        }),
        restauranteApi.get<CaptureMetrics>('/client-captures/metrics', {
          timeout: 15000
        })
      ]);
      setTables(tableResponse.data);
      setSelected((current) =>
        current.filter((selectedTable) =>
          tableResponse.data.some(
            (table) => table.id === selectedTable.id && table.status === 'libre'
          )
        )
      );
      setMetrics(metricsResponse.data);
      setError('');
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useLiveRefresh(refresh, ['attention.changed']);

  const submit = async () => {
    const count = Number(partySize);
    if (
      !selected.length ||
      !Number.isInteger(count) ||
      count < 1 ||
      requestLock.current
    )
      return;
    requestLock.current = true;
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      await restauranteApi.post('/client-captures', {
        tableIds: selected.map((table) => table.id),
        partySize: count
      });
      setNotice(
        `Llegada registrada para ${selected.map((table) => table.name).join(' + ')}.`
      );
      setSelected([]);
      setPartySize('');
      await refresh(true);
    } catch (reason) {
      const message = errorMessage(reason);
      await refresh(true);
      setError(message);
    } finally {
      requestLock.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Box component='main' className='jalador-page'>
      <Box className='jalador-heading'>
        <Box>
          <Typography variant='h4' component='h1' fontWeight={800}>
            Bienvenido, Jalador
          </Typography>
          <Typography color='text.secondary'>
            Registra una llegada en pocos pasos.
          </Typography>
        </Box>
        <Button
          startIcon={
            refreshing ? <CircularProgress size={16} /> : <RefreshRoundedIcon />
          }
          onClick={() => void refresh(true)}
          disabled={refreshing || loading}
          aria-label='Actualizar mesas y resumen'
          sx={{ minHeight: 44 }}
        >
          Actualizar
        </Button>
      </Box>

      <section aria-label='Resumen de hoy' className='jalador-summary'>
        <Card variant='outlined' className='jalador-stat'>
          <CardContent>
            <Typography variant='body2' color='text.secondary'>
              Captaciones de hoy
            </Typography>
            <Typography variant='h4' fontWeight={800}>
              {loading ? '—' : metrics.captations}
            </Typography>
          </CardContent>
        </Card>
        <Card variant='outlined' className='jalador-stat'>
          <CardContent>
            <Typography variant='body2' color='text.secondary'>
              Personas captadas hoy
            </Typography>
            <Typography variant='h4' fontWeight={800}>
              {loading ? '—' : metrics.totalPeople}
            </Typography>
          </CardContent>
        </Card>
      </section>

      {error && (
        <Alert severity='error' role='alert' onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert
          severity='success'
          role='status'
          icon={<CheckCircleOutlineRoundedIcon />}
          onClose={() => setNotice('')}
        >
          {notice}
        </Alert>
      )}

      <section aria-labelledby='jalador-tables-title'>
        <Box className='jalador-section-heading'>
          <Box>
            <Typography
              id='jalador-tables-title'
              variant='h5'
              component='h2'
              fontWeight={800}
            >
              Mesas
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Selecciona una mesa o une varias mesas libres.
            </Typography>
          </Box>
          <Typography variant='body2' color='text.secondary'>
            {tables.length} mesas
          </Typography>
        </Box>
        {loading ? (
          <Box className='jalador-loading'>
            <CircularProgress aria-label='Cargando mesas' />
          </Box>
        ) : tables.length === 0 ? (
          <Alert severity='info'>
            No hay mesas disponibles en este restaurante.
          </Alert>
        ) : (
          <Box className='jalador-table-grid'>
            {tables.map((table) => {
              const occupied = table.status === 'ocupada';
              const active = selected.some((item) => item.id === table.id);
              return (
                <Card
                  key={table.id}
                  variant='outlined'
                  className={`jalador-table-card${active ? ' is-selected' : ''}${occupied ? ' is-occupied' : ''}`}
                >
                  <CardActionArea
                    disabled={occupied}
                    onClick={() => {
                      if (occupied) return;
                      setSelected((current) =>
                        active
                          ? current.filter((item) => item.id !== table.id)
                          : [...current, table]
                      );
                      setError('');
                      setNotice('');
                    }}
                    aria-pressed={active}
                    aria-label={`Mesa ${table.name}, ${occupied ? 'ocupada' : 'libre'}${occupied ? '' : ', seleccionar'}`}
                    sx={{ height: '100%' }}
                  >
                    <CardContent>
                      <Typography
                        className='jalador-table-name'
                        variant='h5'
                        component='span'
                      >
                        {table.name}
                      </Typography>
                      <span
                        className={`jalador-status ${occupied ? 'occupied' : 'available'}`}
                      >
                        <span aria-hidden='true'>{occupied ? '●' : '○'}</span>
                        {occupied ? 'Ocupada' : 'Libre'}
                      </span>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        )}
      </section>

      {!!selected.length && (
        <Card
          component='section'
          variant='outlined'
          className='jalador-capture-card'
          aria-labelledby='capture-title'
        >
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography id='capture-title' variant='h6' fontWeight={800}>
                  Registrar llegada ·{' '}
                  {selected.length === 1 ? 'Mesa ' : 'Mesas '}
                  {selected.map((table) => table.name).join(' + ')}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  La disponibilidad se actualizará desde el sistema.
                </Typography>
              </Box>
              <TextField
                label='Cantidad de personas'
                type='number'
                value={partySize}
                onChange={(event) => setPartySize(event.target.value)}
                inputProps={{
                  min: 1,
                  step: 1,
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  'aria-label': 'Cantidad de personas'
                }}
                error={
                  partySize !== '' &&
                  (!Number.isInteger(Number(partySize)) ||
                    Number(partySize) < 1)
                }
                helperText={
                  partySize !== '' &&
                  (!Number.isInteger(Number(partySize)) ||
                    Number(partySize) < 1)
                    ? 'Ingresa al menos 1 persona.'
                    : 'Mínimo 1 persona.'
                }
                fullWidth
                autoFocus
              />
              <Button
                variant='contained'
                size='large'
                fullWidth
                disabled={
                  submitting ||
                  !selected.length ||
                  !Number.isInteger(Number(partySize)) ||
                  Number(partySize) < 1
                }
                onClick={() => void submit()}
                sx={{ minHeight: 52, fontWeight: 800 }}
              >
                {submitting ? (
                  <>
                    <CircularProgress
                      size={20}
                      color='inherit'
                      sx={{ mr: 1 }}
                    />
                    Registrando…
                  </>
                ) : (
                  'Registrar llegada'
                )}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
