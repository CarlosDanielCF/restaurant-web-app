import { commandLabel } from './operationFeedback';
import VolumeUpOutlined from '@mui/icons-material/VolumeUpOutlined';
import VolumeOffOutlined from '@mui/icons-material/VolumeOffOutlined';
import { presentationLabel } from './presentationLabel';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import RestaurantMenuOutlined from '@mui/icons-material/RestaurantMenuOutlined';
import './cycle2.css';
import { modalityLabel } from './OffsitePanel';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  Alert,
  Skeleton,
  Chip,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Tooltip,
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
import { Board, DispatchItem, KitchenSnapshot } from './fulfillment.types';
import { buildKitchenCards, kitchenCardPage } from './kitchenPagination';
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
    wide = useMediaQuery('(min-width:1200px)'),
    tablet = useMediaQuery('(min-width:700px)');
  const [board, setBoard] = useState<Board | null>(null),
    [failed, setFailed] = useState(false),
    [tick, setTick] = useState(Date.now()),
    [lastSync, setLastSync] = useState(0),
    [offset, setOffset] = useState(0),
    [page, setPage] = useState(0),
    [sound, setSound] = useState(false),
    [fullscreen, setFullscreen] = useState(false),
    [exitingItem, setExitingItem] = useState<string | null>(null),
    [actionError, setActionError] = useState(''),
    [busy, setBusy] = useState(false);
  const audio = useRef<AudioContext | null>(null),
    incomingBell = useRef<HTMLAudioElement | null>(null),
    tracker = useRef(new KitchenSoundTracker()),
    soundEnabled = useRef(false),
    connectionEpoch = useRef(0),
    screen = useRef<HTMLDivElement | null>(null),
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
          const bell = incomingBell.current?.cloneNode() as
            | HTMLAudioElement
            | undefined;
          if (!bell) continue;
          bell.volume = 1;
          bell.onended = () => {
            if (
              soundEnabled.current &&
              audio.current?.state === 'running' &&
              typeof speechSynthesis !== 'undefined'
            )
              announceIncoming(
                speechSynthesis,
                () => new SpeechSynthesisUtterance()
              );
          };
          void bell.play().catch(() => undefined);
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
      incomingBell.current?.pause();
      incomingBell.current = null;
    },
    []
  );
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const onFullscreen = () => setFullscreen(document.fullscreenElement === screen.current);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      document.removeEventListener('fullscreenchange', onFullscreen);
    };
  }, []);
  const shortLandscape = useMediaQuery('(max-height: 520px)'),
    columns = (wide && !shortLandscape) ? 3 : (tablet || shortLandscape) ? 2 : 1,
    cards = useMemo(
      () => buildKitchenCards(board?.dispatches || []),
      [board?.dispatches]
    ),
    pages = Math.max(1, Math.ceil(cards.length / columns)),
    visible = kitchenCardPage(cards, page, columns),
    total = board?.totalPending || 0,
    stale = !online || failed || !lastSync || tick - lastSync > 90000;
  useEffect(() => {
    setPage((current) => Math.min(current, pages - 1));
  }, [pages]);
  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await screen.current?.requestFullscreen();
  }
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
      if (!incomingBell.current) {
        incomingBell.current = new Audio('/audio/kitchen-waiter-bell.mp3');
        incomingBell.current.preload = 'auto';
        incomingBell.current.volume = 1;
        incomingBell.current.load();
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
  async function markKitchenExit(item: DispatchItem) {
    if (exitingItem) return;
    setExitingItem(item.id);
    setActionError('');
    try {
      await restauranteApi.post(
        `/kitchen/dispatch-items/${item.id}/exits`,
        {
          quantity: Math.min(1, item.pending)
        },
        {
          headers: {
            'Idempotency-Key': `kitchen-exit-${item.id}-${String(item.kitchenExited).replace('.', '_')}`
          },
          timeout: 15000
        }
      );
      await refresh();
    } catch (error) {
      const message = (
        error as { response?: { data?: { message?: string | string[] } } }
      ).response?.data?.message;
      setActionError(
        Array.isArray(message)
          ? message.join(' · ')
          : message || 'No se pudo registrar la salida. El tablero fue actualizado.'
      );
      await refresh();
    } finally {
      setExitingItem(null);
    }
  }
  const renderNotice = (n: NonNullable<typeof board>['notices'][number]) => (
    <Stack key={n.id} spacing={0.5} className='ticket-line kitchen-notice'>
      <Typography variant='caption'>{n.location}</Typography>
      <Typography sx={{ textDecoration: 'line-through' }}>
        {n.beforeData.quantity} × {n.beforeData.name}
      </Typography>
      <Typography fontWeight='bold' color='error.main'>
        {n.kind === 'CANCELLATION'
          ? 'CANCELADO'
          : n.kind === 'REPLACEMENT'
            ? 'SUSTITUIDO'
            : 'CAMBIO'}
      </Typography>
      {n.kind !== 'CANCELLATION' && (
        <>
          <Typography fontWeight='bold'>
            {n.afterData.quantity} × {n.afterData.name}
          </Typography>
          {(details(n.afterData) || n.afterData.notes) && (
            <Typography variant='body2'>
              {[details(n.afterData), n.afterData.notes].filter(Boolean).join(' · ')}
            </Typography>
          )}
        </>
      )}
      <Button
        size='small'
        disabled={busy || stale}
        onClick={() => void acknowledge(n.id)}
      >
        Entendido
      </Button>
    </Stack>
  );
  return (
    <Container maxWidth={false} className='kitchen-operation' ref={screen}>
      <Stack className='kitchen-screen' spacing={2} py={2}>
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
          <Button
            className='kitchen-fullscreen'
            variant='outlined'
            aria-label={fullscreen ? 'Salir de pantalla completa' : 'Entrar en pantalla completa'}
            aria-pressed={fullscreen}
            onClick={() => void toggleFullscreen()}
          >
            {fullscreen ? '⛶ SALIR' : '⛶ FULLSCREEN'}
          </Button>
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
        {actionError && <Alert severity='warning'>{actionError}</Alert>}
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
          {total} comandas pendientes
        </Typography>
        <section className='pos-kitchen-notices' aria-label='Cambios de cocina'>
          {board?.notices
            .filter(
              (n) => !visible.some(({ dispatch }) => dispatch.id === n.dispatchId)
            )
            .map(renderNotice)}
        </section>
        <Stack
          className='pos-kds-tickets'
          direction='row'
          spacing={2}
          alignItems='stretch'
        >
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
          {visible.map(({ dispatch: d, items, density }) => {
            const elapsedMs = Math.max(
                0,
                tick + offset - new Date(d.confirmedAt).getTime()
              ),
              seconds = Math.floor(elapsedMs / 1000),
              late = elapsedMs > 900000,
              warning = seconds >= 720;
            return (
              <Card
                className={`kitchen-ticket kitchen-ticket--${density} ${late ? 'late' : warning ? 'warning' : ''}`}
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
                    <div className='kitchen-ticket-items'>
                    {items.map((i) => (
                        <Stack
                          key={i.id}
                          className='ticket-line ticket-item-line'
                        >
                          <Typography fontWeight='bold'>
                            {Number(i.quantity) - Number(i.cancelledQuantity)} ×{' '}
                            {i.itemSnapshot.name}
                          </Typography>
                          <Typography className='ticket-item-secondary'>
                            {[
                              details(i.itemSnapshot),
                              Number(i.itemSnapshot.takeawayQuantity) > 0
                                ? `Para llevar: ${i.itemSnapshot.takeawayQuantity}`
                                : '',
                              i.itemSnapshot.notes,
                              i.itemSnapshot.consumptionKind === 'STAFF'
                                ? 'Consumo de personal'
                                : '',
                              i.itemSnapshot.consumptionKind === 'COURTESY'
                                ? 'Cortesía'
                                : ''
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </Typography>
                          <Typography variant='caption'>
                            Salieron {Number(i.kitchenExited)} /{' '}
                            {Number(i.quantity) - Number(i.cancelledQuantity)}
                          </Typography>
                          <Tooltip title='Marcar salida' arrow>
                            <span className='kitchen-exit-button-wrap'>
                              <Button
                                className='kitchen-exit-button'
                                variant='contained'
                                color='success'
                                aria-label={`Marcar salida de ${i.itemSnapshot.name}`}
                                disabled={
                                  stale ||
                                  exitingItem !== null ||
                                  i.pending <= 0
                                }
                                onClick={() => void markKitchenExit(i)}
                              >
                                ✓
                              </Button>
                            </span>
                          </Tooltip>
                        </Stack>
                      ))}
                    </div>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
        {total > 0 && (
          <Stack className='kitchen-navigation' direction='row' spacing={1}>
            <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Typography>Página {page + 1} / {pages}</Typography>
            <Button disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
            <Button disabled={page === 0} onClick={() => setPage(0)}>
              Más antigua
            </Button>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
