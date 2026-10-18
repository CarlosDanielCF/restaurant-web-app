import { useEffect, useState } from 'react';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { Account, Line } from './types';
import { Run } from './Operations.page';
export function DraftLineEditor({
  account,
  line,
  run
}: {
  account: Account;
  line: Line;
  run: Run;
}) {
  const [notes, setNotes] = useState(line.notes),
    [dirty, setDirty] = useState(false),
    [editVersion, setEditVersion] = useState(account.version),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!dirty) setNotes(line.notes);
  }, [line.notes, dirty]);
  async function save(quantity: number) {
    if (busy) return;
    setBusy(true);
    try {
      if (
        await run(
          `/attention-accounts/${account.id}/lines/${line.id}/draft`,
          {
            expectedVersion: dirty ? editVersion : account.version,
            quantity,
            notes
          },
          'patch'
        )
      )
        setDirty(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={1}>
      <Typography variant='caption'>Borrador · todavía no enviado</Typography>
      <Stack direction='row' alignItems='center' gap={1}>
        <Button
          disabled={busy}
          aria-label={`Quitar una unidad de ${line.productSnapshot.name}`}
          onClick={() => void save(Math.max(0, Number(line.quantity) - 1))}
        >
          −
        </Button>
        <Typography fontWeight={800}>× {Number(line.quantity)}</Typography>
        <Button
          disabled={busy}
          aria-label={`Agregar una unidad de ${line.productSnapshot.name}`}
          onClick={() => void save(Number(line.quantity) + 1)}
        >
          +
        </Button>
        <Button color='error' disabled={busy} onClick={() => void save(0)}>
          {Number(line.quantity) > 1 ? 'Eliminar todas' : 'Eliminar'}
        </Button>
      </Stack>
      <TextField
        size='small'
        label={`Observación de ${line.productSnapshot.name}`}
        value={notes}
        onChange={(e) => {
          if (!dirty) setEditVersion(account.version);
          setNotes(e.target.value);
          setDirty(true);
        }}
      />
      {dirty && account.version !== editVersion && (
        <Alert severity='warning'>
          La cuenta cambió mientras escribías. Conservamos tu texto; revisa la
          información antes de volver a editar.
        </Alert>
      )}
      {dirty && (
        <Button onClick={() => setDirty(false)}>
          Descartar edición y ver datos actuales
        </Button>
      )}
      {dirty && (
        <Button
          disabled={busy}
          onClick={() => void save(Number(line.quantity))}
        >
          Guardar observación
        </Button>
      )}
    </Stack>
  );
}
