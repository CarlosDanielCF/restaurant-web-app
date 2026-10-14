import { modalityLabel } from './OffsitePanel';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import { Board, KitchenSnapshot } from './fulfillment.types';
function details(s: KitchenSnapshot) {
  return [
    s.option?.name,
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
    seen = useRef(new Set<string>()),
    sentinel = useRef<HTMLDivElement | null>(null),
    inFlight = useRef(false);
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const { data } = await restauranteApi.get<Board>('/kitchen/board');
      const fresh = data.notices.some((n) => !seen.current.has(n.id));
      data.notices.forEach((n) => seen.current.add(n.id));
      if (fresh && sound && audio.current) {
        const oscillator = audio.current.createOscillator(),
          gain = audio.current.createGain();
        gain.gain.value = 0.12;
        oscillator.connect(gain);
        gain.connect(audio.current.destination);
        oscillator.frequency.value = 880;
        oscillator.start();
        oscillator.stop(audio.current.currentTime + 0.4);
      }
      setBoard(data);
      setOffset(new Date(data.serverNow).getTime() - Date.now());
      setLastSync(Date.now());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
    }
  }, [sound]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    const changed = () => void refresh();
    const watch = () => {
      socket?.emit('kitchen.watch', true);
      void refresh();
    };
    socket?.on('kitchen.changed', changed);
    socket?.on('attention.changed', changed);
    socket?.on('connect', watch);
    if (socket?.connected) watch();
    const heartbeat = setInterval(() => {
      if (socket?.connected) socket.emit('kitchen.watch', true);
    }, 15000);
    return () => {
      clearInterval(timer);
      clearInterval(heartbeat);
      socket?.off('kitchen.changed', changed);
      socket?.off('attention.changed', changed);
      socket?.off('connect', watch);
      socket?.emit('kitchen.watch', false);
    };
  }, [socket, refresh]);
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
    stale = !online || failed || !lastSync || tick - lastSync > 15000;
  async function enableSound() {
    if (!audio.current) audio.current = new AudioContext();
    await audio.current.resume();
    setSound(true);
  }
  async function acknowledge(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      await restauranteApi.post(
        `/kitchen/notices/${id}/acknowledge`,
        {},
        { headers: { 'Idempotency-Key': `notice-read-${id}` } }
      );
      await refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Container maxWidth='xl'>
      <Stack spacing={2} py={2}>
        <Typography variant='h4'>Cocina · comandas</Typography>
        <Typography>
          Cocina avisa con timbre o verbalmente. El mozo registra la salida.
        </Typography>
        <Stack direction='row' spacing={1} flexWrap='wrap'>
          <Button component={Link} to='/attention'>
            Menú y disponibilidad
          </Button>
          <Button onClick={() => void refresh()}>Actualizar</Button>
          <Button disabled={sound} onClick={() => void enableSound()}>
            {sound ? 'Sonido activado' : 'Activar avisos sonoros'}
          </Button>
        </Stack>
        {stale && (
          <Alert severity='error'>
            Cocina desconectada o información desactualizada. Compruebe la
            conexión; los tiempos mostrados pueden no reflejar salidas
            recientes.
          </Alert>
        )}
        <Typography variant='h5'>
          {total} pendientes · {visible.length} visibles ·{' '}
          {Math.max(0, total - visible.length)} adicionales
        </Typography>
        {board?.notices.map((n) => (
          <Alert
            severity={n.kind === 'CANCELLATION' ? 'error' : 'warning'}
            key={n.id}
          >
            <Stack spacing={1}>
              <Typography>
                {n.location} · envío {n.dispatchId.slice(0, 8)}
              </Typography>
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
              <Button
                disabled={busy || stale}
                onClick={() => void acknowledge(n.id)}
              >
                Aviso leído — no marca preparación ni salida
              </Button>
            </Stack>
          </Alert>
        ))}
        {wide && (
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
                    <Typography variant='h5'>
                      {d.tables.map((t) => t.name).join(' + ') ||
                        modalityLabel[d.modality]}{' '}
                      · #{d.sequenceNumber}
                    </Typography>
                    <Typography>
                      Mozo: {d.firstName} {d.lastName}
                    </Typography>
                    <Typography>
                      Envío {d.id.slice(0, 8)} ·{' '}
                      {new Date(d.confirmedAt).toLocaleTimeString('es-PE', {
                        timeZone: zone
                      })}
                    </Typography>
                    <Typography
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
                    {d.items
                      .filter((i) => i.status === 'ACTIVE' && i.pending > 0)
                      .map((i) => (
                        <Stack key={i.id}>
                          <Typography fontWeight='bold'>
                            {i.pending} × {i.itemSnapshot.name}
                          </Typography>
                          <Typography>{details(i.itemSnapshot)}</Typography>
                          <Typography>{i.itemSnapshot.notes}</Typography>
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
        {!total && (
          <Typography>
            No hay comida pendiente. Los avisos de cambios/cancelaciones
            permanecen hasta confirmar su lectura.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
