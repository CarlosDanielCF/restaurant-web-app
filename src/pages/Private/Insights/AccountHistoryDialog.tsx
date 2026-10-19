import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import { restauranteApi } from '@/api';
import { WorkspaceEmpty } from '@/components/operational/WorkspaceEmpty';
import { operationalLabel } from './labels';
import { reportError } from './reportView';
interface HistoryResult {
  rows: {
    id: string;
    occurredAt: string;
    action: string;
    actorId: string | null;
    actorName: string | null;
    source: string;
    beforeData: unknown;
    afterData: unknown;
    reason: string | null;
  }[];
  accountId: string;
  total: number;
  page: number;
  limit: number;
  timeZone: string;
}
export function AccountHistoryDialog({
  accountId,
  onClose
}: {
  accountId: string | null;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1),
    [data, setData] = useState<HistoryResult>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    setPage(1);
    setData(undefined);
  }, [accountId]);
  useEffect(() => {
    if (!accountId) return;
    let active = true;
    setBusy(true);
    setError('');
    restauranteApi
      .get<HistoryResult>(
        `/operational-reports/accounts/${encodeURIComponent(accountId)}/history`,
        { params: { page, limit: 25 } }
      )
      .then((r) => {
        if (active) setData(r.data);
      })
      .catch((e) => {
        if (active)
          setError(
            reportError(e, 'No se pudo consultar el historial de la cuenta.')
          );
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [accountId, page, revision]);
  return (
    <Dialog
      open={Boolean(accountId)}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      className='point-report-center'
    >
      <DialogTitle component='h2'>Historial completo de la cuenta</DialogTitle>
      <DialogContent>
        <Typography color='text.secondary' sx={{ mb: 2 }}>
          Cronología de movimientos registrados. Los cambios conservan su actor,
          motivo y datos históricos.
        </Typography>
        {busy && <LinearProgress aria-label='Cargando historial' />}
        {error && (
          <Alert
            severity='error'
            action={
              <Button onClick={() => setRevision((n) => n + 1)}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        {!busy && data && !data.rows.length && (
          <WorkspaceEmpty
            title='Sin movimientos registrados'
            description='Esta cuenta todavía no tiene movimientos en el historial consultado.'
          />
        )}
        {data?.rows.map((row) => (
          <article key={row.id} className='report-history-event'>
            <Typography variant='caption' color='text.secondary'>
              {new Date(row.occurredAt).toLocaleString('es-PE', {
                timeZone: data.timeZone
              })}
            </Typography>
            <Typography fontWeight={700}>
              {operationalLabel(row.action)}
            </Typography>
            <Typography variant='body2'>
              {row.actorName || 'Actor no registrado'} ·{' '}
              {operationalLabel(row.source)}
            </Typography>
            {row.reason && (
              <Typography variant='body2'>Motivo: {row.reason}</Typography>
            )}
            {(row.beforeData != null || row.afterData != null) && (
              <details>
                <summary>Ver datos del movimiento</summary>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                  {[
                    ['Antes', row.beforeData],
                    ['Después', row.afterData]
                  ].map(
                    ([label, value]) =>
                      value != null && (
                        <div
                          key={String(label)}
                          style={{ minWidth: 0, flex: 1 }}
                        >
                          <strong>{String(label)}</strong>
                          <pre
                            style={{
                              whiteSpace: 'pre-wrap',
                              overflowWrap: 'anywhere',
                              fontSize: '.8rem'
                            }}
                          >
                            {typeof value === 'string'
                              ? value
                              : JSON.stringify(value, null, 2)}
                          </pre>
                        </div>
                      )
                  )}
                </Stack>
              </details>
            )}
          </article>
        ))}
        {data && (
          <Stack
            direction='row'
            alignItems='center'
            justifyContent='space-between'
          >
            <Button
              disabled={busy || page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Typography variant='body2'>
              {data.total} movimientos · página {page}
            </Typography>
            <Button
              disabled={busy || page * data.limit >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar historial</Button>
      </DialogActions>
    </Dialog>
  );
}
