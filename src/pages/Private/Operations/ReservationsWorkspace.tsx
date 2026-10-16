import { useState } from 'react';
import {
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
  const [draft, setDraft] = useState(blank());
  const [arrival, setArrival] = useState<Reservation | null>(null);
  const [responsible, setResponsible] = useState('');
  const [tableIds, setTableIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  return (
    <Stack spacing={2}>
      <Typography variant='h5' component='h2'>
        Reservas
      </Typography>
      <Typography color='text.secondary'>
        Registra la visita y elige las mesas cuando llegue el cliente.
      </Typography>
      <Card>
        <CardContent>
          <Stack spacing={2} className='operation-form-grid'>
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
            <TextField
              label='Observaciones de reserva'
              multiline
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant='contained'
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
      <TextField
        label='Motivo de cancelación de reserva'
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {!reservations.length && (
        <Typography className='operation-empty'>
          Todavía no hay reservas registradas.
        </Typography>
      )}
      {reservations.map((r) => (
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
                    onClick={() => {
                      setArrival(r);
                      setTableIds([]);
                      setResponsible('');
                    }}
                  >
                    Registrar llegada y elegir mesa
                  </Button>
                  <Button
                    disabled={reason.trim().length < 2}
                    color='error'
                    onClick={() =>
                      void run(`/reservations/${r.id}/cancel`, {
                        expectedVersion: r.version,
                        reason
                      })
                    }
                  >
                    Cancelar reserva
                  </Button>
                </Stack>
              )}
              {r.accountId && (
                <Typography>
                  Cuenta iniciada: {r.accountId.slice(0, 8)}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
      {arrival && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h6'>Llegada de {arrival.name}</Typography>
              <OperatorSelect
                operators={operators}
                value={responsible}
                onChange={setResponsible}
              />
              <TableChoices
                tables={tables}
                accounts={accounts}
                selected={tableIds}
                setSelected={setTableIds}
              />
              <Button
                variant='contained'
                disabled={!responsible || !tableIds.length}
                onClick={async () => {
                  if (
                    await run(`/reservations/${arrival.id}/arrival`, {
                      expectedVersion: arrival.version,
                      responsibleUserId: responsible,
                      tableIds
                    })
                  )
                    setArrival(null);
                }}
              >
                Confirmar llegada e iniciar cuenta
              </Button>
              <Button onClick={() => setArrival(null)}>Volver</Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
