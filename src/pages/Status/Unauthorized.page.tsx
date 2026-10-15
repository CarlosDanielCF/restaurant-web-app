import { Container, Box, Typography, Button, Paper } from '@mui/material';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <Container maxWidth='sm'>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: 'center',
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              p: 2.5,
              borderRadius: '50%',
              bgcolor: (theme) =>
                theme.palette.mode === 'light'
                  ? 'error.lighter'
                  : 'rgba(239, 68, 68, 0.1)',
              color: 'error.main',
              mb: 2.5
            }}
          >
            <LockPersonOutlinedIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography
            variant='h4'
            fontWeight={700}
            color='text.primary'
            gutterBottom
          >
            Acceso no autorizado
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
            sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}
          >
            No cuenta con los permisos necesarios para acceder a este módulo. Si
            considera que esto es un error, por favor contacte a su
            administrador.
          </Typography>
          <Button
            variant='contained'
            color='primary'
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/attention')}
          >
            Volver a inicio
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};
