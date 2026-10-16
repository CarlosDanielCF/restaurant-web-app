import { useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Alert,
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux';
import { restauranteApi } from '@/api';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { Account } from '../Operations/types';
import { DocumentView, InternalDocument } from './DocumentView';
import './print.css';
export function DocumentsPage() {
  useEffect(() => {
    document.body.classList.add('internal-print-mode');
    document.documentElement.classList.add('internal-print-mode');
    return () => {
      document.body.classList.remove('internal-print-mode');
      document.documentElement.classList.remove('internal-print-mode');
    };
  }, []);
  const [searchParams] = useSearchParams();
  const user = useSelector(selectAuth).user,
    restaurant = useRestaurantStore((s) => s.restaurant);
  const [accounts, setAccounts] = useState<Account[]>([]),
    [selected, setSelected] = useState(searchParams.get('accountId') || ''),
    [doc, setDoc] = useState<InternalDocument>(),
    [rows, setRows] = useState<
      { id: string; kind: string; createdAt: string }[]
    >([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [thermal, setThermal] = useState(false);
  const retry = useRef<{ signature: string; key: string }>();
  async function load() {
    const r = await restauranteApi.get<Account[]>('/attention-accounts');
    setAccounts(
      r.data.filter(
        (a) => user?.role.name !== 'MOZO' || a.responsibleUserId === user.id
      )
    );
  }
  useEffect(() => {
    setSelected('');
    setDoc(undefined);
    load().catch(() => setError('No se pudieron cargar las atenciones'));
  }, [restaurant?.id, user?.id]);
  useEffect(() => {
    let active = true;
    setBusy(true);
    restauranteApi
      .get(
        selected
          ? `/internal-documents/accounts/${selected}`
          : '/internal-documents',
        {
          params: { page, limit: 10 }
        }
      )
      .then((r) => {
        if (active) {
          setRows(r.data.rows);
          setTotal(r.data.total);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('No se pudo cargar el historial de documentos');
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [selected, page, doc?.id, restaurant?.id]);
  async function action(path: string, body: object) {
    const signature = JSON.stringify({ path, body });
    if (retry.current?.signature !== signature)
      retry.current = { signature, key: crypto.randomUUID() };
    setBusy(true);
    setError('');
    try {
      const r = await restauranteApi.post<InternalDocument>(path, body, {
        headers: { 'Idempotency-Key': retry.current.key }
      });
      setDoc(r.data);
      retry.current = undefined;
      await load();
      return true;
    } catch (e) {
      const err = e as {
        response?: { data?: { message?: string | string[] } };
      };
      setError(
        String(
          err.response?.data?.message ||
            'No se confirmó la operación. Reintente con la misma intención.'
        )
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <Container maxWidth='lg' className='pos-documents'>
      <Stack spacing={2}>
        <Typography variant='h4'>Documentos internos</Typography>
        <Alert severity='info'>
          No son comprobantes tributarios. Cada emisión conserva una copia
          histórica; reimprimir no actualiza sus valores.
        </Alert>
        {error && <Alert severity='error'>{error}</Alert>}
        {busy && <CircularProgress size={24} />}
        <TextField
          select
          label='Atención para documento'
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setPage(1);
            setDoc(undefined);
          }}
        >
          <MenuItem value=''>Historial de documentos accesibles</MenuItem>
          {accounts.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.tables.map((t) => t.name).join(' + ') || a.modality} ·{' '}
              {a.id.slice(0, 8)} · saldo {a.balance}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction='row' spacing={1} flexWrap='wrap'>
          {(['ACCOUNT', 'TICKET'] as const).map((kind) => (
            <Button
              key={kind}
              disabled={busy || !selected}
              onClick={() =>
                void action(`/internal-documents/accounts/${selected}`, {
                  kind,
                  expectedVersion: accounts.find((a) => a.id === selected)
                    ?.version
                })
              }
            >
              {kind === 'ACCOUNT'
                ? 'Emitir cuenta previa'
                : 'Emitir ticket interno'}
            </Button>
          ))}
        </Stack>
        <Typography variant='h6'>Documentos emitidos ({total})</Typography>
        {!rows.length && (
          <Typography>No hay documentos para esta selección.</Typography>
        )}
        {rows.map((r) => (
          <Button
            key={r.id}
            disabled={busy}
            onClick={() =>
              void action(`/internal-documents/${r.id}/reprint`, {})
            }
          >
            {r.kind === 'ACCOUNT' ? 'Cuenta' : 'Ticket'} ·{' '}
            {new Date(r.createdAt).toLocaleString('es-PE', {
              timeZone: restaurant?.timeZone || 'America/Lima'
            })}{' '}
            · {r.id.slice(0, 8)}
          </Button>
        ))}
        <Stack direction='row'>
          <Button
            disabled={busy || page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <Typography>Página {page}</Typography>
          <Button
            disabled={busy || page * 10 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </Stack>
        {doc && (
          <>
            <TextField
              select
              label='Formato de impresión'
              value={thermal ? 'thermal' : 'paper'}
              onChange={(e) => setThermal(e.target.value === 'thermal')}
            >
              <MenuItem value='paper'>Papel común</MenuItem>
              <MenuItem value='thermal'>Ticket 80 mm (preparación)</MenuItem>
            </TextField>
            <Button
              disabled={busy}
              onClick={async () => {
                if (await action(`/internal-documents/${doc.id}/reprint`, {}))
                  window.print();
              }}
            >
              Imprimir documento interno
            </Button>
            <DocumentView document={doc} thermal={thermal} />
            {createPortal(
              <div id='print-internal-document'>
                <DocumentView document={doc} thermal={thermal} />
              </div>,
              document.body
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
