import { useEffect, useState } from 'react';
import { Alert, Button, Card, Stack, Typography } from '@mui/material';
import { restauranteApi } from '@/api';
import { Account } from '../Operations/types';
interface Debt {
  id: string;
  principal: string;
  installmentsTotal: string;
  outstanding: string;
}
function DebtCard({
  account,
  onSelect
}: {
  account: Account;
  onSelect: (id: string) => void;
}) {
  const [debts, setDebts] = useState<Debt[]>(),
    [name, setName] = useState(''),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setFailed(false);
    setDebts(undefined);
    Promise.all([
      restauranteApi.get<{ debts: Debt[] }>(`/finance/accounts/${account.id}`),
      restauranteApi.get<{ person: { firstName: string; lastName: string } }>(
        `/clients/${account.clientId}`
      )
    ])
      .then(([f, c]) => {
        if (active) {
          setDebts(f.data.debts);
          setName(`${c.data.person.firstName} ${c.data.person.lastName}`);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [account.id, account.version, account.clientId]);
  if (failed)
    return (
      <Alert severity='warning'>
        No se pudo consultar la deuda de {account.id.slice(0, 8)}.
      </Alert>
    );
  if (!debts) return <Typography>Consultando deuda…</Typography>;
  if (!debts.length) return null;
  return (
    <Card variant='outlined'>
      <Typography fontWeight={700}>{name}</Typography>
      {debts.map((d) => (
        <Stack key={d.id} spacing={0.5}>
          <Typography>Deuda original S/ {d.principal}</Typography>
          <Typography>Abonado S/ {d.installmentsTotal}</Typography>
          <Typography fontWeight={700}>Saldo S/ {d.outstanding}</Typography>
        </Stack>
      ))}
      <Button onClick={() => onSelect(account.id)}>
        Ver historial / registrar abono
      </Button>
    </Card>
  );
}
export function DebtCards({
  accounts,
  onSelect
}: {
  accounts: Account[];
  onSelect: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const candidates = accounts.filter((a) => a.clientId),
    start = page * 6;
  return (
    <section className='debt-browser'>
      <Typography variant='h6'>
        Fiados · cuentas con cliente identificado
      </Typography>
      <Typography variant='body2'>
        Se muestran deudas registradas de hasta seis cuentas por página. El
        historial no convierte abonos en ventas.
      </Typography>
      <div className='offsite-list'>
        {candidates.slice(start, start + 6).map((a) => (
          <DebtCard key={a.id} account={a} onSelect={onSelect} />
        ))}
      </div>
      {!candidates.length && (
        <Typography>No hay cuentas con cliente identificado.</Typography>
      )}
      <Stack direction='row' gap={1}>
        <Button disabled={!page} onClick={() => setPage((p) => p - 1)}>
          Anteriores
        </Button>
        <Typography>Página {page + 1}</Typography>
        <Button
          disabled={start + 6 >= candidates.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguientes
        </Button>
      </Stack>
    </section>
  );
}
