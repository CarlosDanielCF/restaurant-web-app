import './cycle2.css';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { useCallback, useContext, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { SocketContext } from '@/context';
import { restauranteApi } from '@/api';
import { Account } from './types';
import { Dispatch } from './fulfillment.types';
import { Run } from './Operations.page';
export function FulfillmentPanel({
  account,
  run
}: {
  account: Account;
  run: Run;
}) {
  const zone =
    useRestaurantStore((s) => s.restaurant?.timeZone) || 'America/Lima';
  const { socket, online } = useContext(SocketContext);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]),
    [screens, setScreens] = useState<number | null>(null),
    [error, setError] = useState(false);
  const [itemId, setItemId] = useState(''),
    [quantity, setQuantity] = useState(1),
    [eventId, setEventId] = useState(''),
    [reason, setReason] = useState('');
  const [lineId, setLineId] = useState(''),
    [notes, setNotes] = useState(''),
    [notPrepared, setNotPrepared] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const [d, p] = await Promise.all([
        restauranteApi.get<Dispatch[]>(
          `/attention-accounts/${account.id}/dispatches`
        ),
        restauranteApi.get<{ screens: number }>('/kitchen/presence')
      ]);
      setDispatches(d.data);
      setScreens(p.data.screens);
      setError(false);
    } catch {
      setError(true);
    }
  }, [account.id]);
  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 10000);
    socket?.on('kitchen.changed', refresh);
    socket?.on('kitchen.presence', refresh);
    socket?.on('connect', refresh);
    return () => {
      clearInterval(interval);
      socket?.off('kitchen.changed', refresh);
      socket?.off('kitchen.presence', refresh);
      socket?.off('connect', refresh);
    };
  }, [refresh, socket, account.version]);
  const items = dispatches.flatMap((d) =>
    d.items.map((i) => ({ ...i, sequence: d.sequenceNumber }))
  );
  const events = dispatches
    .flatMap((d) => d.events)
    .filter((e) => e.dispatchItemId === itemId && Number(e.quantityDelta) > 0);
  const line = account.lines.find((l) => l.id === lineId);
  async function action(
    path: string,
    body: object,
    method: 'post' | 'patch' = 'post'
  ) {
    if (
      await run(
        `/attention-accounts/${account.id}/${path}`,
        { expectedVersion: account.version, ...body },
        method
      )
    )
      await refresh();
  }
  return (
    <Card className='fulfillment-card'>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant='h6'>Envíos y salida por mozo</Typography>
          {(!online || error) && (
            <Alert severity='warning'>
              Datos de cocina sin actualizar. No se confirmará una operación sin
              respuesta del servidor.
            </Alert>
          )}
          {screens === 0 && (
            <Alert severity='warning'>
              No hay pantallas de cocina conectadas. Avise verbalmente; el envío
              quedará guardado.
            </Alert>
          )}
          {screens !== null && screens > 0 && (
            <Typography>{screens} pantallas de cocina conectadas</Typography>
          )}
          <Button
            variant='contained'
            disabled={
              error ||
              account.attentionStatus !== 'OPEN' ||
              !account.lines.some(
                (l) => l.status === 'ACTIVE' && !Number(l.confirmedQuantity)
              )
            }
            onClick={() => void action('confirm', {})}
          >
            Confirmar consumos nuevos y enviar comida
          </Button>
          <Typography variant='caption'>
            Solo confirma unidades nuevas. Las bebidas no aparecen en cocina.
            Cada envío conserva su hora; no registra pago ni cierra la cuenta.
          </Typography>
          <details className='service-details'>
            <summary>Envíos ({dispatches.length})</summary>
            {dispatches.map((d) => (
              <Stack key={d.id} spacing={1} className='dispatch-summary'>
                <Typography fontWeight='bold'>
                  Comanda {d.sequenceNumber} ·{' '}
                  {new Date(d.confirmedAt).toLocaleTimeString('es-PE', {
                    timeZone: zone
                  })}{' '}
                  · {d.pending ? 'Pendiente' : 'Sin comida pendiente'}
                  {d.pending &&
                    ` · ${Math.max(0, Math.floor((Date.now() - new Date(d.confirmedAt).getTime()) / 60000))} min desde el envío`}
                </Typography>
                {d.items.map((i) => (
                  <Typography key={i.id} className='dispatch-line'>
                    {i.itemSnapshot.name} ·{' '}
                    {i.status === 'CANCELLED'
                      ? 'Cancelado'
                      : `Enviado: ${i.quantity} · Entregado: ${i.delivered} · Pendiente: ${i.pending}`}{' '}
                    · {i.itemSnapshot.notes}
                  </Typography>
                ))}
              </Stack>
            ))}
          </details>
          <details className='service-details'>
            <summary>Salidas, cambios y correcciones</summary>
            <Stack spacing={1.5} mt={1}>
              <TextField
                select
                label='Plato de la comanda'
                value={itemId}
                onChange={(e) => {
                  setItemId(e.target.value);
                  setEventId('');
                }}
              >
                <MenuItem value=''>Seleccione</MenuItem>
                {items.map((i) => (
                  <MenuItem key={i.id} value={i.id}>
                    #{i.sequence} {i.itemSnapshot.name} · {i.pending} pendientes
                  </MenuItem>
                ))}
              </TextField>
              {itemId && (
                <Typography className='exit-pending'>
                  Pendiente: {items.find((i) => i.id === itemId)?.pending} ·
                  Entregado: {items.find((i) => i.id === itemId)?.delivered}
                </Typography>
              )}
              <Stack
                direction='row'
                gap={1}
                alignItems='center'
                className='exit-stepper'
              >
                <Button
                  aria-label='Reducir unidades de salida'
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(0.001, q - 1))}
                >
                  −
                </Button>
                <TextField
                  label='Unidades de salida o corrección'
                  type='number'
                  inputProps={{ min: 0.001, step: 0.001 }}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
                <Button
                  aria-label='Aumentar unidades de salida'
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </Button>
              </Stack>
              <Button
                variant='contained'
                disabled={!itemId || quantity <= 0 || error}
                onClick={() =>
                  void action(`dispatch-items/${itemId}/exits`, { quantity })
                }
              >
                Registrar salida de platos
              </Button>
              <TextField
                select
                label='Salida a corregir'
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                <MenuItem value=''>Seleccione</MenuItem>
                {events.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.quantityDelta} unidades ·{' '}
                    {new Date(e.createdAt).toLocaleTimeString('es-PE', {
                      timeZone: zone
                    })}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label='Motivo de corrección o recuperación'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button
                disabled={
                  !eventId || reason.trim().length < 2 || quantity <= 0 || error
                }
                onClick={() =>
                  void action(`dispatch-items/${itemId}/corrections`, {
                    eventId,
                    quantity,
                    reason
                  })
                }
              >
                Corregir salida con motivo
              </Button>
              <Typography variant='h6'>
                Observaciones y recuperación manual
              </Typography>
              <TextField
                select
                label='Consumo a revisar'
                value={lineId}
                onChange={(e) => {
                  setLineId(e.target.value);
                  setNotes(
                    account.lines.find((l) => l.id === e.target.value)?.notes ||
                      ''
                  );
                  setNotPrepared(false);
                }}
              >
                <MenuItem value=''>Seleccione</MenuItem>
                {account.lines.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.productSnapshot.name} ·{' '}
                    {l.status === 'ACTIVE' ? 'Activo' : 'Cancelado'}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label='Nuevas observaciones del plato'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                disabled={
                  !line || line.status !== 'ACTIVE' || reason.trim().length < 2
                }
                onClick={() =>
                  void action(
                    `lines/${lineId}/notes`,
                    { notes, reason },
                    'patch'
                  )
                }
              >
                Cambiar observaciones con motivo
              </Button>
              <FormControlLabel
                label='Confirmo que estas unidades canceladas no fueron preparadas ni entregadas'
                control={
                  <Checkbox
                    checked={notPrepared}
                    onChange={(e) => setNotPrepared(e.target.checked)}
                  />
                }
              />
              <Button
                disabled={
                  !line ||
                  line.status !== 'CANCELLED' ||
                  !Number(line.confirmedQuantity) ||
                  !notPrepared ||
                  reason.trim().length < 2 ||
                  quantity <= 0
                }
                onClick={() =>
                  void action(`lines/${lineId}/restore`, {
                    quantity,
                    reason,
                    notPrepared: true
                  })
                }
              >
                Recuperar las unidades indicadas
              </Button>
              <Typography variant='caption'>
                Cancelar nunca devuelve porciones automáticamente. La
                recuperación usa el consumo original configurado, independiente
                del precio.
              </Typography>
            </Stack>
          </details>
        </Stack>
      </CardContent>
    </Card>
  );
}
