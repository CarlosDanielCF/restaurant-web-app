import { NavLink as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stack
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { useRestaurantStore } from '../../Private/Common/store/restaurantStore';
import { SOFTWARE_NAME, SOFTWARE_LOGO } from '@/components/branding/SoftwareBrand';

const pages = [
  {
    name: 'Inicio',
    path: '/'
  }
];

export const AppBar = () => {
  const navigate = useNavigate();
  const { restaurant } = useRestaurantStore();

  const logoSrc = restaurant?.logo || SOFTWARE_LOGO;
  const brandName = restaurant?.name || SOFTWARE_NAME;

  return (
    <MuiAppBar
      position='sticky'
      elevation={0}
      sx={{
        py: 0.5,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a'
      }}
    >
      <Container maxWidth='xl'>
        <Toolbar disableGutters sx={{ minHeight: { xs: 56, md: 64 }, justifyContent: 'space-between' }}>
          {/* Brand - Logo + Name */}
          <Box
            component={RouterLink}
            to='/'
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <img
              src={logoSrc}
              alt={brandName}
              width={38}
              height={38}
              style={{
                borderRadius: 8,
                objectFit: 'contain',
                display: 'block'
              }}
            />
            <Typography
              variant='h6'
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.05rem', md: '1.2rem' },
                color: '#0f172a',
                letterSpacing: '-0.02em'
              }}
            >
              {brandName}
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
            <Stack direction='row' spacing={1}>
              {pages.map((page) => (
                <Button
                  key={page.path}
                  component={RouterLink}
                  to={page.path}
                  sx={{
                    color: '#0f766e',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 2
                  }}
                >
                  {page.name}
                </Button>
              ))}
            </Stack>

            <Button
              onClick={() => navigate('/auth/login')}
              variant='contained'
              startIcon={<LoginIcon />}
              sx={{
                bgcolor: '#0d9488',
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                px: 2.5,
                py: 0.9,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
                '&:hover': {
                  bgcolor: '#0f766e',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)'
                }
              }}
            >
              Iniciar sesión
            </Button>
          </Box>

          {/* Mobile Navigation CTA */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
            <Button
              onClick={() => navigate('/auth/login')}
              variant='contained'
              size='small'
              startIcon={<LoginIcon sx={{ fontSize: '1rem !important' }} />}
              sx={{
                bgcolor: '#0d9488',
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.825rem',
                px: 1.8,
                py: 0.7,
                borderRadius: '7px',
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.2)',
                '&:hover': { bgcolor: '#0f766e' }
              }}
            >
              Iniciar sesión
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </MuiAppBar>
  );
};
