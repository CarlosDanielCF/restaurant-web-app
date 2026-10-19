import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography
} from '@mui/material';

/** A network failure is recoverable, not a logout or an authorization decision. */
export function SessionCheckStatus() {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const unavailable = () => setFailed(true);
    const timer = setTimeout(unavailable, 16000);
    window.addEventListener('session-check-failed', unavailable);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('session-check-failed', unavailable);
    };
  }, [attempt]);
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        bgcolor: 'background.default',
        gap: 2,
        p: 2
      }}
    >
      {!failed && <CircularProgress size={44} thickness={4} color='primary' />}
      <Typography variant='body1' fontWeight={500} color='text.secondary'>
        {failed ? 'No se pudo verificar la sesión' : 'Verificando sesión...'}
      </Typography>
      {failed && (
        <>
          <Alert severity='warning' sx={{ maxWidth: 440 }}>
            El servidor no respondió. Conservamos tu sesión; comprueba la
            conexión y vuelve a intentarlo.
          </Alert>
          <Button
            variant='contained'
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
              window.dispatchEvent(new Event('session-renew-request'));
            }}
          >
            Reintentar verificación
          </Button>
        </>
      )}
    </Box>
  );
}
