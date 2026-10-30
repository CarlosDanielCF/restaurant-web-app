import { useEffect, useState } from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { restauranteApi } from '@/api';

interface ClientResult {
  id: string;
  address?: string;
  person: {
    firstName: string;
    lastName: string;
    numPhone?: string;
  };
}

export function ClientPhoneLookup({
  phone,
  name,
  address,
  onSelect
}: {
  phone: string;
  name: string;
  address?: string;
  onSelect: (client: { id: string; name: string; phone: string; address?: string }) => void;
}) {
  const [matches, setMatches] = useState<ClientResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (phone.replace(/\D/g, '').length < 6) {
      setMatches([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      restauranteApi
        .get<{ clients: ClientResult[] }>('/clients', {
          params: { limit: 5, offset: 0, search: phone.trim() }
        })
        .then(({ data }) => active && setMatches(data.clients))
        .catch(() => active && setMatches([]));
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [phone]);
  const parts = name.trim().split(/\s+/);
  const canSave = /^\d{9,10}$/.test(phone.trim()) && parts.length > 1 && !matches.length;
  return (
    <Stack spacing={0.5}>
      {matches.map((client) => (
        <Button key={client.id} size='small' variant='outlined' onClick={() => onSelect({
          id: client.id,
          name: `${client.person.firstName} ${client.person.lastName}`.trim(),
          phone: client.person.numPhone || phone,
          address: client.address || address
        })}>
          Usar {client.person.firstName} {client.person.lastName} · {client.person.numPhone || phone}
        </Button>
      ))}
      {canSave && (
        <Button size='small' disabled={saving} onClick={async () => {
          setSaving(true); setMessage('');
          try {
            const lastName = parts.slice(1).join(' ');
            const { data } = await restauranteApi.post<ClientResult>('/clients', {
              firstName: parts[0], lastName, numPhone: phone.trim(), ...(address?.trim() ? { address: address.trim() } : {})
            });
            onSelect({ id: data.id, name: `${data.person.firstName} ${data.person.lastName}`, phone: data.person.numPhone || phone, address: data.address || address });
            setMessage('Cliente guardado.');
          } catch { setMessage('No se pudo guardar el cliente. Revisa nombre y teléfono.'); }
          finally { setSaving(false); }
        }}>
          Guardar como cliente nuevo
        </Button>
      )}
      {message && <Alert severity={message.startsWith('Cliente') ? 'success' : 'error'}><Typography variant='caption'>{message}</Typography></Alert>}
    </Stack>
  );
}
