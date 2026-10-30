import { commandLabel, requiresProduction } from './operationFeedback';
import { createPortal } from 'react-dom';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import './cycle2.css';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { useCallback, useContext, useRef, useState } from 'react';
import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  run,
  confirmationContainer
}: {
  account: Account;
  run: Run;
  confirmationContainer?: HTMLElement | null;
}) {
  const zone =
    useRestaurantStore((s) => s.restaurant?.timeZone) || 'America/Lima';
  const { online } = useContext(SocketContext);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]),
    [screens, setScreens] = useState<number | null>(null),
    [error, setError] = useState(false);
  const confirmationLock = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<{
    error: boolean;
    message: string;
  } | null>(null);
  const [packing, setPacking] = useState(false);
  const [takeaway, setTakeaway] = useState<Record<string, number>>({});
  const drafts = account.lines.filter(
    (l) => l.status === 'ACTIVE' && !Number(l.confirmedQuantity)
  );
  const production = requiresProduction(drafts);
  const [quantity, setQuantity] = useState(1),
    [reason, setReason] = useState('');
  const [lineId, setLineId] = useState(''),
    [notes, setNotes] = useState(''),
    [notPrepared, setNotPrepared] = useState(false);
  const refreshSequence = useRef(0);
  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    try {
      const [d, p] = await Promise.all([
        restauranteApi.get<Dispatch[]>(
          `/attention-accounts/${account.id}/dispatches`,
          { timeout: 15000 }
        ),
        restauranteApi.get<{ screens: number }>('/kitchen/presence', {
          timeout: 15000
        })
      ]);
      if (sequence !== refreshSequence.current) return;
      setDispatches(d.data);
      setScreens(p.data.screens);
      setError(false);
    } catch {
      if (sequence === refreshSequence.current) setError(true);
    }
  }, [account.id]);
  useLiveRefresh(
    refresh,
    ['kitchen.changed', 'kitchen.presence', 'attention.changed'],
    String(account.version)
  );
  const line = account.lines.find((l) => l.id === lineId);
  async function action(
    path: string,
    body: object,
    method: 'post' | 'patch' = 'post'
  ) {
    await run(
      `/attention-accounts/${account.id}/${path}`,
      { expectedVersion: account.version, ...body },
      method
    );
  }
  const confirmOrder = async () => {
    if (confirmationLock.current) return;
    confirmationLock.current = true;
    setConfirming(true);
    setConfirmationResult(null);
    try {
      const ok = await run(
        `/attention-accounts/${account.id}/confirm`,
        {
          expectedVersion: account.version,
          takeaway: drafts.map((l) => ({
            lineId: l.id,
            quantity:
              takeaway[l.id] ??
              (account.modality === 'TAKE_AWAY' ? Number(l.quantity) : 0)
          }))
        },
        'post',
        (data) =>
          setConfirmationResult({
            error: false,
            message:
              (data as { warning?: string }).warning || 'Pedido confirmado'
          }),
        (message) => setConfirmationResult({ error: true, message })
      );
      if (ok) setTakeaway({});
    } finally {
      confirmationLock.current = false;
      setConfirming(false);
    }
  };
  const confirmation = (
    <Stack spacing={0.5}>
      {production && (!online || error) && (
        <Alert severity='warning'>
          Datos de cocina sin actualizar. No se confirmará una operación sin
          respuesta del servidor.
        </Alert>
      )}
      {production && screens === 0 && (
        <Alert severity='warning'>
          No hay pantallas de cocina conectadas. Avise verbalmente; el envío
          quedará guardado.
        </Alert>
      )}
      {production &&
        !confirmationContainer &&
        screens !== null &&
        screens > 0 && (
          <Typography variant='caption'>
            {screens} pantallas de cocina conectadas
          </Typography>
        )}
      {account.modality === 'TABLE' && drafts.length > 0 && (
        <>
          <Stack direction='row' gap={1} flexWrap='wrap'>
            <Button
              onClick={() => {
                setTakeaway(
                  Object.fromEntries(
                    drafts.map((l) => [l.id, Number(l.quantity)])
                  )
                );
                setPacking(false);
              }}
            >
              Todo para llevar
            </Button>
            <Button onClick={() => setPacking((v) => !v)}>
              Seleccionar para llevar
            </Button>
          </Stack>
          <Dialog
            open={packing}
            onClose={() => setPacking(false)}
            fullWidth
            maxWidth='xs'
          >
            <DialogTitle>Seleccionar cantidades para llevar</DialogTitle>
            <DialogContent>
              <Stack spacing={2} pt={1}>
                {drafts.map((l) => (
                  <TextField
                    key={l.id}
                    size='small'
                    type='number'
                    label={`${l.productSnapshot.name} · para llevar (de ${Number(l.quantity)})`}
                    value={takeaway[l.id] ?? 0}
                    inputProps={{
                      min: 0,
                      max: Number(l.quantity),
                      step: 0.001
                    }}
                    onChange={(e) =>
                      setTakeaway((v) => ({
                        ...v,
                        [l.id]: Number(e.target.value)
                      }))
                    }
                  />
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setTakeaway({});
                  setPacking(false);
                }}
              >
                Todo en mesa
              </Button>
              <Button onClick={() => setPacking(false)}>
                Aplicar selección
              </Button>
            </DialogActions>
          </Dialog>
          {drafts.some((l) => (takeaway[l.id] ?? 0) > 0) && (
            <Typography variant='caption'>
              Para llevar seleccionado · se guardará al enviar
            </Typography>
          )}
        </>
      )}
      <Button
        className='desktop-confirm-order'
        sx={{ display: { xs: 'none', md: 'inline-flex' } }}
        variant='contained'
        aria-label={
          production
            ? 'Confirmar pedido y enviar a producción'
            : 'Confirmar pedido'
        }
        aria-busy={confirming}
        disabled={
          confirming ||
          drafts.some(
            (l) =>
              !Number.isFinite(takeaway[l.id] ?? 0) ||
              (takeaway[l.id] ?? 0) < 0 ||
              (takeaway[l.id] ?? 0) > Number(l.quantity)
          ) ||
          account.attentionStatus !== 'OPEN' ||
          !account.lines.some(
            (l) => l.status === 'ACTIVE' && !Number(l.confirmedQuantity)
          )
        }
        onClick={() => void confirmOrder()}
      >
        {confirming
          ? 'Enviando…'
          : confirmationResult?.error && drafts.length
            ? 'Reintentar confirmación'
            : production
              ? 'Confirmar pedido · producción'
              : 'Confirmar pedido'}
      </Button>
      <Button
        className='mobile-order-send'
        sx={{ display: { md: 'none' } }}
        variant='contained'
        aria-label={production ? 'Enviar pedido · producción' : 'Enviar pedido'}
        aria-busy={confirming}
        disabled={
          confirming ||
          drafts.some(
            (l) =>
              !Number.isFinite(takeaway[l.id] ?? 0) ||
              (takeaway[l.id] ?? 0) < 0 ||
              (takeaway[l.id] ?? 0) > Number(l.quantity)
          ) ||
          account.attentionStatus !== 'OPEN' ||
          !account.lines.some(
            (l) => l.status === 'ACTIVE' && !Number(l.confirmedQuantity)
          )
        }
        onClick={() => void confirmOrder()}
      >
        {confirming
          ? 'Enviando…'
          : confirmationResult?.error && drafts.length
            ? 'Reintentar envío'
            : production
              ? 'Enviar pedido · producción'
              : 'Enviar pedido'}
      </Button>
      {confirmationResult && (
        <Alert
          severity={confirmationResult.error ? 'error' : 'success'}
          role='status'
        >
          {confirmationResult.message}
        </Alert>
      )}
      {!confirmationContainer && (
        <Typography variant='caption'>
          Solo unidades nuevas · producción según configuración. No registra
          pago ni cierra la cuenta.
        </Typography>
      )}
    </Stack>
  );
  return (
    <Card className='fulfillment-card'>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant='h6'>Estado de pedidos</Typography>
          {confirmationContainer ? (
            <>{createPortal(confirmation, confirmationContainer)}</>
          ) : (
            confirmation
          )}
          <details className='service-details' open>
            <summary>Estado de pedidos</summary>
            {dispatches.map((d) => (
              <Stack key={d.id} spacing={1} className='dispatch-summary'>
                <Typography fontWeight='bold'>
                  {commandLabel(d)} ·{' '}
                  {new Date(d.confirmedAt).toLocaleTimeString('es-PE', {
                    timeZone: d.operatingTimeZone || zone
                  })}{' '}
                  {d.operatingDate &&
                    ` · ${d.operatingDate.split('-').reverse().join('/')}`}
                  · {d.pending ? 'Pendiente' : 'Sin producción pendiente'}
                  {d.pending &&
                    ` · ${Math.max(0, Math.floor((Date.now() - new Date(d.confirmedAt).getTime()) / 60000))} min desde el envío`}
                </Typography>
                {d.items.map((i) => (
                  <Stack key={i.id} className='dispatch-line' spacing={1}>
                    <Typography fontWeight={700}>
                      {i.itemSnapshot.name}
                      {Number(i.itemSnapshot.takeawayQuantity) > 0 &&
                        ` · Para llevar: ${i.itemSnapshot.takeawayQuantity}`}
                    </Typography>
                    <Typography variant='body2'>
                      {i.itemSnapshot.notes}
                    </Typography>
                    <Typography
                      color={i.pending === 0 ? 'primary' : 'text.primary'}
                    >
                      Pedido{' '}
                      {Math.max(
                        0,
                        Number(i.quantity) - Number(i.cancelledQuantity)
                      )}{' '}
                      | Entregado {Number(i.delivered)} | Faltan{' '}
                      {Math.max(
                        0,
                        Number(i.quantity) -
                          Number(i.cancelledQuantity) -
                          Number(i.delivered)
                      )}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ))}
          </details>
          <details className='service-details'>
            <summary>Más opciones · cambios y correcciones</summary>
            <Stack spacing={1.5} mt={1}>
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
              <TextField
                label='Motivo del cambio o recuperación'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
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
              {line?.status === 'CANCELLED' && (
                <TextField
                  label='Unidades a recuperar'
                  type='number'
                  inputProps={{ min: 0.001, step: 0.001 }}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              )}
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
