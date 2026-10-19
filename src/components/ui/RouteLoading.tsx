import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  LinearProgress,
  Skeleton,
  Typography
} from '@mui/material';

/** Keep the navigation and restaurant context usable while a route chunk arrives. */
export function RouteLoading() {
  const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDelayed(true), 12000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Box role='status' aria-live='polite' aria-busy='true' sx={{ py: 1 }}>
      <Typography variant='h5' sx={{ mb: 1 }}>
        Cargando sección…
      </Typography>
      <LinearProgress aria-label='Cargando sección' />
      <Skeleton height={64} sx={{ mt: 2 }} />
      <Skeleton height={180} />
      {delayed && (
        <Alert severity='warning'>
          La sección está tardando en cargar. Puedes volver a otra sección desde
          el menú. Comprueba tu conexión si la demora continúa.
        </Alert>
      )}
    </Box>
  );
}
