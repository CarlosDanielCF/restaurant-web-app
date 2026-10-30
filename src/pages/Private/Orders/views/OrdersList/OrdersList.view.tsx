import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Button, Card, CardContent, Chip, Collapse, Container, IconButton,
  LinearProgress, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { restauranteApi } from '@/api';
import { TitlePage } from '../../../components/TitlePage.component';
import { Account, Operator } from '../../../Operations/types';

const modality: Record<Account['modality'], string> = {
  TABLE: 'Mesa', TAKE_AWAY: 'Para llevar', OWN_DELIVERY: 'Delivery propio',
  EXTERNAL_COURIER: 'Delivery externo'
};

export const ListOrders = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [history, people] = await Promise.all([
        restauranteApi.get<Account[]>('/attention-accounts'),
        restauranteApi.get<Operator[]>('/attention-accounts/operators')
      ]);
      setAccounts(history.data); setOperators(people.data);
    } catch { setError('No se pudo consultar el historial actual de atenciones.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => void refresh(), [refresh]);
  const rows = accounts.filter((account) => {
    const responsible = operators.find((person) => person.id === account.responsibleUserId);
    return `${account.id} ${account.tables.map((table) => table.name).join(' ')} ${responsible?.firstName || ''} ${responsible?.lastName || ''}`
      .toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  });
  return (
    <Container maxWidth='xl'>
      <TitlePage title='Pedidos históricos' />
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} mb={2}>
        <TextField size='small' label='Buscar por mesa, responsable o código'
          value={search} onChange={(event) => setSearch(event.target.value)} />
        <Button onClick={() => void refresh()}>Actualizar</Button>
      </Stack>
      {loading && <LinearProgress />}
      {error && <Typography color='error'>{error}</Typography>}
      <Card><TableContainer><Table>
        <TableHead><TableRow>
          <TableCell /><TableCell>Fecha</TableCell><TableCell>Atención</TableCell>
          <TableCell>Responsable</TableCell><TableCell>Estado</TableCell>
          <TableCell>Total</TableCell><TableCell>Saldo</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {!loading && !rows.length && <TableRow><TableCell colSpan={7} align='center'>
            No hay atenciones para mostrar.
          </TableCell></TableRow>}
          {rows.map((account) => {
            const responsible = operators.find((person) => person.id === account.responsibleUserId);
            const open = expanded.has(account.id);
            return [
              <TableRow hover key={`${account.id}-summary`}>
                <TableCell><IconButton size='small' onClick={() => setExpanded((current) => {
                  const next = new Set(current); if (open) next.delete(account.id); else next.add(account.id); return next;
                })}>{open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}</IconButton></TableCell>
                <TableCell>{account.createdAt ? format(new Date(account.createdAt), 'dd/MM/yyyy HH:mm') : '—'}</TableCell>
                <TableCell>{account.tables.map((table) => table.name).join(' + ') || modality[account.modality]}</TableCell>
                <TableCell>{[responsible?.firstName, responsible?.lastName].filter(Boolean).join(' ') || account.responsibleUserId}</TableCell>
                <TableCell><Chip size='small' label={account.attentionStatus === 'OPEN' ? 'Abierta' : 'Cerrada'}
                  color={account.attentionStatus === 'OPEN' ? 'warning' : 'success'} /></TableCell>
                <TableCell>S/ {account.total}</TableCell><TableCell>S/ {account.balance}</TableCell>
              </TableRow>,
              <TableRow key={`${account.id}-detail`}><TableCell colSpan={7} sx={{ py: 0 }}>
                <Collapse in={open} unmountOnExit><CardContent>
                  {account.lines.map((line) => <Typography key={line.id} variant='body2'>
                    {line.quantity} × {line.productSnapshot.name} · S/{line.subtotal}
                    {line.status === 'CANCELLED' ? ' · Cancelado' : ''}
                  </Typography>)}
                </CardContent></Collapse>
              </TableCell></TableRow>
            ];
          })}
        </TableBody>
      </Table></TableContainer></Card>
    </Container>
  );
};
