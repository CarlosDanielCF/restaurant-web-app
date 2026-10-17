import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Stack
} from '@mui/material';
import { restauranteApi } from '@/api';
import { IUser } from '@/models/auth.model';
import { permissionLabels } from '@/hooks/useWorkerAccess';
export function WorkerPermissions({ user }: { user: IUser }) {
  const [open, setOpen] = useState(false),
    [denied, setDenied] = useState<string[]>([]),
    [version, setVersion] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function load() {
    setOpen(true);
    setBusy(true);
    setError('');
    try {
      const { data } = await restauranteApi.get<IUser>(`/users/${user.id}`);
      setDenied(data.deniedPermissions || []);
      setVersion(data.version || 0);
    } catch {
      setError(
        'No se pudieron consultar los permisos. Cierra y vuelve a intentar.'
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      await restauranteApi.patch(`/users/${user.id}/permissions`, {
        expectedVersion: version,
        deniedPermissions: denied
      });
      setOpen(false);
    } catch (e) {
      setError(
        (e as { data?: { message?: string } }).data?.message ||
          'No se pudo guardar. Vuelve a consultar si cambiaron los datos.'
      );
    } finally {
      setBusy(false);
    }
  }
  function toggle(key: string, checked: boolean) {
    setDenied((previous) => {
      const next = new Set(previous);
      if (checked) next.delete(key);
      else next.add(key);
      if (key === 'attention' && !checked)
        ['finance', 'delivery', 'documents', 'reservations'].forEach((p) =>
          next.add(p)
        );
      return [...next];
    });
  }
  return (
    <>
      <Button onClick={() => void load()} size='small'>
        Permisos
      </Button>
      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Accesos · {user.person.firstName}</DialogTitle>
        <DialogContent>
          <Alert severity='info'>
            Solo restringe el rol actual; marcar una opción no concede permisos
            de otro rol. Cobros, delivery, documentos y reservas requieren
            Atención.
          </Alert>
          {error && <Alert severity='error'>{error}</Alert>}
          <Stack>
            {Object.entries(permissionLabels).map(([key, label]) => (
              <FormControlLabel
                key={key}
                label={label}
                control={
                  <Checkbox
                    disabled={
                      busy ||
                      ([
                        'finance',
                        'delivery',
                        'documents',
                        'reservations'
                      ].includes(key) &&
                        denied.includes('attention'))
                    }
                    checked={!denied.includes(key)}
                    onChange={(e) => toggle(key, e.target.checked)}
                  />
                }
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant='contained'
            disabled={busy || !version}
            onClick={() => void save()}
          >
            Guardar restricciones
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
