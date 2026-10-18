import { MoreOptions } from '@/components/operational/MoreOptions';
import {
  EventAvailableOutlined,
  EditOutlined,
  DeleteOutline,
  SaveOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux';
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Account, Operator, Reservation, Table } from './types';
import { OperatorSelect, TableChoices } from './AttentionWorkspace';
import { Run } from './Operations.page';
function localInput(iso: string, zone: string) {
  const p = new Intl.DateTimeFormat('sv-SE', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date(iso));
  return p.replace(' ', 'T');
}
const blank = () => ({
  id: '',
  version: 1,
  name: '',
  phone: '',
  localDateTime: '',
  people: 2,
  notes: ''
});
export function ReservationsWorkspace({
  reservations,
  accounts,
  tables,
  operators,
  run,
  zone
}: {
  reservations: Reservation[];
  accounts: Account[];
  tables: Table[];
  operators: Operator[];
  run: Run;
  zone: string;
}) {
  const navigate = useNavigate();
  const [cancel, setCancel] = useState<Reservation | null>(null);
  const [filter, setFilter] = useState('BOOKED');
  const [search, setSearch] = useState('');
  const user = useSelector(selectAuth).user;
  const waiter = user?.role.name === 'MOZO';
  const [draft, setDraft] = useState(blank());
  const [arrival, setArrival] = useState<Reservation | null>(null);
  const [responsible, setResponsible] = useState(waiter ? user.id : '');
  const [tableIds, setTableIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const shownReservations = reservations.filter(
    (r) =>
      (!filter || r.status === filter) &&
      `${r.name} ${r.phone}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase())
  );
  return (
    <Stack spacing={1.5} className='reservation-workbench'>
      <Typography variant='h5' component='h2'>
        Reservas
      </Typography>
      <Typography color='text.secondary'>
        Registra la visita y elige las mesas cuando llegue el cliente.
      </Typography>
      <Card className='reservation-form'>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant='h6'>
              {draft.id ? 'Editar reserva' : 'Registrar reserva'}
            </Typography>
            <Typography>
              Fecha y hora en {zone}. La mesa se selecciona al llegar, nunca al
              reservar.
            </Typography>
            <TextField
              label='Nombre de la reserva'
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <TextField
              label='Teléfono de la reserva'
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
            <TextField
              type='datetime-local'
              label='Fecha y hora local'
              InputLabelProps={{ shrink: true }}
              value={draft.localDateTime}
              onChange={(e) =>
                setDraft({ ...draft, localDateTime: e.target.value })
              }
            />
            <TextField
              type='number'
              label='Personas'
              inputProps={{ min: 1, max: 500 }}
              value={draft.people}
              onChange={(e) =>
                setDraft({ ...draft, people: Number(e.target.value) })
              }
            />
            <MoreOptions title='Observaciones de reserva (opcional)'>
              <TextField
                label='Observaciones de reserva'
                multiline
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </MoreOptions>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant='contained'
                startIcon={<SaveOutlined />}
                disabled={
                  !draft.name.trim() ||
                  !draft.phone.trim() ||
                  !draft.localDateTime ||
                  draft.people < 1
                }
                onClick={async () => {
                  const { id, version, ...data } = draft;
                  if (
                    await run(
                      `/reservations${id ? '/' + id : ''}`,
                      { ...data, ...(id ? { expectedVersion: version } : {}) },
                      id ? 'patch' : 'post'
                    )
                  )
                    setDraft(blank());
                }}
              >
                Guardar reserva
              </Button>
              <Button onClick={() => setDraft(blank())}>
                Nueva / descartar edición
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Box className='reservation-list'>
        <Typography variant='h6' mb={1}>
          Reservas registradas
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} mb={1}>
          <TextField
            size='small'
            label='Buscar reserva'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <TextField
            size='small'
            select
            label='Estado de reservas'
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value='BOOKED'>Pendientes</MenuItem>
            <MenuItem value='ARRIVED'>Llegadas</MenuItem>
            <MenuItem value='CANCELLED'>Canceladas</MenuItem>
            <MenuItem value=''>Todas</MenuItem>
          </TextField>
        </Stack>
        {!shownReservations.length && (
          <Typography className='operation-empty'>
            {reservations.length
              ? 'No hay reservas para esta búsqueda o estado.'
              : 'Todavía no hay reservas registradas.'}
          </Typography>
        )}
        {shownReservations.map((r) => (
          <Card key={r.id}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant='h6'>
                  {r.name} · {r.people} personas
                </Typography>
                <Typography>
                  {new Date(r.scheduledAt).toLocaleString('es-PE', {
                    timeZone: zone
                  })}{' '}
                  · {r.phone} ·{' '}
                  {{
                    BOOKED: 'Reservada',
                    ARRIVED: 'Llegó',
                    CANCELLED: 'Cancelada'
                  }[r.status] || r.status}
                </Typography>
                <Typography>{r.notes}</Typography>
                {r.status === 'BOOKED' && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      startIcon={<EditOutlined />}
                      onClick={() =>
                        setDraft({
                          id: r.id,
                          version: r.version,
                          name: r.name,
                          phone: r.phone,
                          people: r.people,
                          notes: r.notes,
                          localDateTime: localInput(r.scheduledAt, zone)
                        })
                      }
                    >
                      Editar reserva
                    </Button>
                    <Button
                      variant='contained'
                      startIcon={<EventAvailableOutlined />}
                      onClick={() => {
                        setArrival(r);
                        setTableIds([]);
                        setResponsible(waiter ? user.id : '');
                      }}
                    >
                      Registrar llegada y elegir mesa
                    </Button>
                    <Button
                      color='error'
                      startIcon={<DeleteOutline />}
                      onClick={() => {
                        setCancel(r);
                        setReason('');
                      }}
                    >
                      Cancelar reserva
                    </Button>
                  </Stack>
                )}
                {r.accountId && (
                  <Button
                    onClick={() =>
                      navigate(`/attention?accountId=${r.accountId}`)
                    }
                  >
                    Abrir cuenta de la reserva
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
      {arrival && (
        <Dialog open fullWidth maxWidth='sm' onClose={() => setArrival(null)}>
          <DialogTitle>Llegada de {arrival.name}</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              {waiter && (
                <Typography>
                  Responsable: {user.person.firstName} {user.person.lastName}
                </Typography>
              )}
              {!waiter && (
                <OperatorSelect
                  operators={operators}
                  value={responsible}
                  onChange={setResponsible}
                />
              )}
              <TableChoices
                tables={tables}
                accounts={accounts}
                selected={tableIds}
                setSelected={setTableIds}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              variant='contained'
              disabled={!responsible || !tableIds.length}
              onClick={async () => {
                if (
                  await run(
                    `/reservations/${arrival.id}/arrival`,
                    {
                      expectedVersion: arrival.version,
                      responsibleUserId: responsible,
                      tableIds
                    },
                    'post',
                    (data) => {
                      const result = data as {
                        accountId?: string;
                        account?: { id: string };
                      };
                      const id = result.accountId || result.account?.id;
                      if (id) navigate(`/attention?accountId=${id}`);
                    }
                  )
                )
                  setArrival(null);
              }}
            >
              Confirmar llegada e iniciar cuenta
            </Button>
            <Button onClick={() => setArrival(null)}>Volver</Button>
          </DialogActions>
        </Dialog>
      )}
      <Dialog
        open={!!cancel}
        onClose={() => setCancel(null)}
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle>Cancelar reserva · {cancel?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin='dense'
            label='Motivo de cancelación de reserva'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancel(null)}>Volver</Button>
          <Button
            color='error'
            disabled={reason.trim().length < 2}
            onClick={async () => {
              if (
                cancel &&
                (await run(`/reservations/${cancel.id}/cancel`, {
                  expectedVersion: cancel.version,
                  reason
                }))
              )
                setCancel(null);
            }}
          >
            Confirmar cancelación
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
