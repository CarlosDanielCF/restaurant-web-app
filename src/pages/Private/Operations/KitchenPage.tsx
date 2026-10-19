import { commandLabel } from './operationFeedback';
import VolumeUpOutlined from '@mui/icons-material/VolumeUpOutlined';
import VolumeOffOutlined from '@mui/icons-material/VolumeOffOutlined';
import { presentationLabel } from './presentationLabel';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import RestaurantMenuOutlined from '@mui/icons-material/RestaurantMenuOutlined';
import './cycle2.css';
import { modalityLabel } from './OffsitePanel';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Skeleton,
  Chip,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import { Link } from 'react-router-dom';
import { restauranteApi } from '@/api';
import { SocketContext } from '@/context';
import {
  KitchenSoundTracker,
  playKitchenTone,
  announceIncoming
} from './kitchenSound';
import { Board, KitchenSnapshot } from './fulfillment.types';
function details(s: KitchenSnapshot) {
  return [
    s.option?.name ? presentationLabel(s.option.name) : '',
    ...(s.modifiers || []).map((m) => m.name),
    ...(s.components || []).map((c) => `${c.quantity || 1} × ${c.name}`),
    s.portionKind === 'SPECIAL'
      ? `Porción especial · consumo ${s.availabilityUnitsPerItem}`
      : ''
  ]
    .filter(Boolean)
    .join(' · ');
}
export function KitchenPage() {
  const zone =
    useRestaurantStore((s) => s.restaurant?.timeZone) || 'America/Lima';
  const { socket, online } = useContext(SocketContext),
    wide = useMediaQuery('(min-width:1200px)');
  const [board, setBoard] = useState<Board | null>(null),
    [failed, setFailed] = useState(false),
    [tick, setTick] = useState(Date.now()),
    [lastSync, setLastSync] = useState(0),
    [offset, setOffset] = useState(0),
    [page, setPage] = useState(0),
    [limit, setLimit] = useState(3),
    [sound, setSound] = useState(false),
    [busy, setBusy] = useState(false);
  const audio = useRef<AudioContext | null>(null),
    tracker = useRef(new KitchenSoundTracker()),
    soundEnabled = useRef(false),
    connectionEpoch = useRef(0),
    sentinel = useRef<HTMLDivElement | null>(null),
    inFlight = useRef(false);
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const epoch = connectionEpoch.current;
    try {
      const { data } = await restauranteApi.get<Board>('/kitchen/board', {
        timeout: 15000
      });
      if (epoch !== connectionEpoch.current) return;
      const fresh = tracker.current.observeChanges(
        data.dispatches.map((d) => d.id),
        data.notices.map((n) => n.id)
      );
      if (soundEnabled.current && audio.current) {
        for (let n = 0; n < fresh.dispatches; n++) {
          playKitchenTone(audio.current, () => {
            if (
              soundEnabled.current &&
              audio.current?.state === 'running' &&
              typeof speechSynthesis !== 'undefined'
            )
              announceIncoming(
                speechSynthesis,
                () => new SpeechSynthesisUtterance()
              );
          });
        }
        if (fresh.notices > 0) playKitchenTone(audio.current);
      }
      setBoard(data);
      setOffset(new Date(data.serverNow).getTime() - Date.now());
      setLastSync(Date.now());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      if (epoch !== connectionEpoch.current) void refresh();
    }
  }, []);
  useLiveRefresh(refresh, ['kitchen.changed', 'attention.changed']);
  useEffect(() => {
    const resetSoundBaseline = () => {
      connectionEpoch.current++;
      tracker.current.reset();
    };
    const watch = () => {
      resetSoundBaseline();
      socket?.emit('kitchen.watch', true);
    };

    socket?.on('connect', watch);
    socket?.on('disconnect', resetSoundBaseline);
    if (socket?.connected) watch();
    const heartbeat = setInterval(() => {
      if (socket?.connected) socket.emit('kitchen.watch', true);
    }, 15000);
    return () => {
      clearInterval(heartbeat);

      socket?.off('connect', watch);
      socket?.off('disconnect', resetSoundBaseline);
      socket?.emit('kitchen.watch', false);
    };
  }, [socket, refresh]);
  useEffect(
    () => () => {
      soundEnabled.current = false;
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
      if (audio.current) {
        audio.current.onstatechange = null;
        void audio.current.close().catch(() => undefined);
        audio.current = null;
      }
    },
    []
  );
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (wide || !sentinel.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting)
        setLimit((n) => Math.min(n + 3, board?.totalPending || 3));
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [wide, board?.totalPending, limit]);
  useEffect(() => {
    setPage((p) =>
      Math.min(p, Math.max(0, Math.ceil((board?.totalPending || 0) / 3) - 1))
    );
  }, [board?.totalPending]);
  const total = board?.totalPending || 0,
    start = wide ? page * 3 : 0,
    visible = board?.dispatches.slice(start, wide ? start + 3 : limit) || [],
    stale = !online || failed || !lastSync || tick - lastSync > 90000;
  async function enableSound() {
    if (soundEnabled.current) {
      soundEnabled.current = false;
      setSound(false);
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
      return;
    }
    try {
      if (!audio.current) {
        audio.current = new AudioContext();
        audio.current.onstatechange = () => {
          if (audio.current?.state !== 'running') {
            soundEnabled.current = false;
            setSound(false);
          }
        };
      }
      await audio.current.resume();
      const unlocked = playKitchenTone(audio.current);
      soundEnabled.current = unlocked;
      setSound(unlocked);
    } catch {
      soundEnabled.current = false;
      setSound(false);
    }
  }
  async function acknowledge(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      await restauranteApi.post(
        `/kitchen/notices/${id}/acknowledge`,
        {},
        { headers: { 'Idempotency-Key': `notice-read-${id}` }, timeout: 15000 }
      );
      await refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  const renderNotice = (n: NonNullable<typeof board>['notices'][number]) => (
    <Alert
      severity={n.kind === 'CANCELLATION' ? 'error' : 'warning'}
      key={n.id}
    >
      <Stack spacing={1}>
        <Typography>{n.location} · aviso de comanda</Typography>
        <Typography fontWeight='bold'>
          {n.kind === 'CANCELLATION'
            ? 'CANCELACIÓN: detener preparación'
            : n.kind === 'REPLACEMENT'
              ? 'SUSTITUCIÓN'
              : 'CAMBIO'}{' '}
          · {n.beforeData.quantity} × {n.beforeData.name} →{' '}
          {n.afterData.quantity} {n.afterData.name || 'Cancelado'}
        </Typography>
        <Typography>
          Antes: {details(n.beforeData)} {n.beforeData.notes} · Ahora:{' '}
          {details(n.afterData)} {n.afterData.notes || '—'}
        </Typography>
        <Typography>Motivo: {n.reason}</Typography>
        <Button disabled={busy || stale} onClick={() => void acknowledge(n.id)}>
          Aviso leído — no marca preparación ni salida
        </Button>
      </Stack>
    </Alert>
  );
  return (
    <Container maxWidth='xl' className='kitchen-operation'>
      <Stack spacing={2} py={2}>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Typography variant='h4'>Cocina · comandas</Typography>
          <Chip
            label={
              stale
                ? 'Desconectado · datos posiblemente desactualizados'
                : 'Conectado'
            }
            color={stale ? 'warning' : 'success'}
            variant='outlined'
          />
        </Stack>
        <Stack direction='row' spacing={1} flexWrap='wrap'>
          <Button component={Link} to='/attention'>
            Menú y disponibilidad
          </Button>
          {failed && (
            <Button onClick={() => void refresh()}>Reintentar conexión</Button>
          )}
          <Button
            variant={sound ? 'contained' : 'outlined'}
            startIcon={sound ? <VolumeUpOutlined /> : <VolumeOffOutlined />}
            aria-pressed={sound}
            onClick={() => void enableSound()}
          >
            {sound ? 'Sonido activado' : 'Sonido desactivado · Activar sonido'}
          </Button>
        </Stack>
        {stale && (board || failed) && (
          <Alert severity='error'>
            {board
              ? 'Cocina desconectada o información desactualizada. Los tiempos pueden no reflejar salidas recientes.'
              : 'No se pudieron recuperar las comandas. Compruebe la conexión y pulse Reintentar conexión; los pedidos se conservan en el servidor.'}
          </Alert>
        )}
        {!board && !failed && (
          <Stack spacing={1} role='status' aria-label='Recuperando comandas'>
            <Typography>Recuperando comandas guardadas…</Typography>
            <Stack direction={wide ? 'row' : 'column'} spacing={2}>
              {[1, 2, 3].map((id) => (
                <Skeleton
                  key={id}
                  variant='rounded'
                  height={240}
                  sx={{ flex: 1, width: '100%' }}
                />
              ))}
            </Stack>
          </Stack>
        )}
        <Typography variant='h5' className='kitchen-counts'>
          {total} pendientes · {visible.length} visibles ·{' '}
          {Math.max(0, total - visible.length)} adicionales
        </Typography>
        <section className='pos-kitchen-notices' aria-label='Avisos de cocina'>
          {board?.notices
            .filter((n) => !visible.some((d) => d.id === n.dispatchId))
            .map(renderNotice)}
        </section>
        {wide && total > 0 && (
          <Stack direction='row' spacing={2}>
            <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              ← Anteriores
            </Button>
            <Typography>
              Página {page + 1} / {Math.max(1, Math.ceil(total / 3))}
            </Typography>
            <Button
              disabled={(page + 1) * 3 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguientes →
            </Button>
            <Button onClick={() => setPage(0)}>
              Volver a las más antiguas
            </Button>
          </Stack>
        )}
        <Stack
          className='pos-kds-tickets'
          direction={wide ? 'row' : 'column'}
          spacing={2}
          alignItems='stretch'
        >
          {visible.map((d) => {
            const elapsedMs = Math.max(
                0,
                tick + offset - new Date(d.confirmedAt).getTime()
              ),
              seconds = Math.floor(elapsedMs / 1000),
              late = elapsedMs > 900000,
              warning = seconds >= 720;
            return (
              <Card
                className={`kitchen-ticket ${late ? 'late' : warning ? 'warning' : ''}`}
                key={d.id}
                sx={{
                  flex: 1,
                  border: late
                    ? '2px solid #d32f2f'
                    : warning
                      ? '2px solid #ed6c02'
                      : undefined
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <div className='point-ticket-heading'>
                      <Typography variant='h5' className='ticket-location'>
                        {d.tables.map((t) => t.name).join(' + ') ||
                          modalityLabel[d.modality]}{' '}
                      </Typography>
                      <Chip size='small' label={commandLabel(d)} />
                    </div>
                    <Typography>
                      Mozo: {d.firstName} {d.lastName}
                    </Typography>
                    <Typography>
                      {d.operatingDate
                        ? d.operatingDate.split('-').reverse().join('/')
                        : 'Comanda histórica'}{' '}
                      ·{' '}
                      {new Date(d.confirmedAt).toLocaleTimeString('es-PE', {
                        timeZone: d.operatingTimeZone || zone
                      })}
                    </Typography>
                    <Typography
                      className='ticket-clock'
                      color={
                        late ? 'error' : warning ? 'warning.main' : undefined
                      }
                    >
                      {Math.floor(seconds / 60)}:
                      {String(seconds % 60).padStart(2, '0')} ·{' '}
                      {late
                        ? 'ATRASADO (>15 min)'
                        : warning
                          ? 'ALERTA (12 min)'
                          : 'En tiempo'}
                    </Typography>
                    {board?.notices
                      .filter((n) => n.dispatchId === d.id)
                      .map(renderNotice)}
                    {d.items
                      .filter((i) => i.status === 'ACTIVE' && i.pending > 0)
                      .map((i) => (
                        <Stack key={i.id} className='ticket-line'>
                          <Typography fontWeight='bold'>
                            {i.pending} × {i.itemSnapshot.name}
                          </Typography>
                          <Typography>{details(i.itemSnapshot)}</Typography>
                          {Number(i.itemSnapshot.takeawayQuantity) > 0 && (
                            <Chip
                              color='warning'
                              label={`Para llevar: ${i.itemSnapshot.takeawayQuantity}`}
                            />
                          )}
                          {i.itemSnapshot.notes && (
                            <Typography className='ticket-notes'>
                              {i.itemSnapshot.notes}
                            </Typography>
                          )}
                          {i.itemSnapshot.consumptionKind === 'STAFF' && (
                            <Typography>Consumo de personal</Typography>
                          )}
                          {i.itemSnapshot.consumptionKind === 'COURTESY' && (
                            <Typography>Cortesía</Typography>
                          )}
                          <Typography variant='caption'>
                            {i.delivered} unidades salieron
                          </Typography>
                        </Stack>
                      ))}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
        {!wide && limit < total && (
          <div ref={sentinel}>
            <Button onClick={() => setLimit((n) => n + 3)}>
              Consultar siguientes comandas
            </Button>
          </div>
        )}
        <Typography className='pos-kds-footer'>
          Cocina toca timbre · El mozo marca la salida
        </Typography>
        {board && !total && (
          <Card className='kitchen-empty'>
            <CardContent>
              <RestaurantMenuOutlined />
              <Typography variant='h5'>Cocina al día</Typography>
              <Typography>
                No hay producción pendiente. Las nuevas comandas aparecerán
                automáticamente.
              </Typography>
              <Typography variant='caption'>
                Los avisos de cambios y cancelaciones permanecen hasta confirmar
                su lectura.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
