import { ButtonTheme } from '@/pages/Private/layouts/SidebarLayout/components';
import { Box, Container, Stack, Typography } from '@mui/material';
import { SOFTWARE_NAME, SOFTWARE_LOGO } from '@/components/branding/SoftwareBrand';
import { useRestaurantStore } from '../../Private/Common/store/restaurantStore';

export const Footer = () => {
  const { restaurant } = useRestaurantStore();
  const logoSrc = restaurant?.logo || SOFTWARE_LOGO;
  const brandName = restaurant?.name || SOFTWARE_NAME;

  return (
    <Box
      component='footer'
      id='contacto'
      sx={{
        mt: 'auto',
        borderTop: '1px solid #e2e8f0',
        bgcolor: '#ffffff',
        py: { xs: 3, md: 4 }
      }}
    >
      <Container maxWidth='xl'>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 2.5, md: 3 }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent='space-between'
        >
          {/* Brand info */}
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <img
              src={logoSrc}
              alt={brandName}
              width={32}
              height={32}
              style={{ borderRadius: 6, objectFit: 'contain' }}
            />
            <Box>
              <Typography variant='subtitle2' sx={{ fontWeight: 700, color: '#0f172a' }}>
                {brandName}
              </Typography>
              <Typography variant='caption' sx={{ color: '#64748b' }}>
                Sistema POS y gestión integral de restaurantes
              </Typography>
            </Box>
          </Stack>

          {/* Quick contact info */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 3 }}
            sx={{ fontSize: '0.85rem', color: '#475569' }}
          >
            <Typography variant='body2' sx={{ color: '#64748b', fontSize: '0.825rem' }}>
              Atención y soporte: <strong>soporte@pointrestaurant.com</strong>
            </Typography>
            <Typography variant='body2' sx={{ color: '#64748b', fontSize: '0.825rem' }}>
              Operación 24/7 en línea
            </Typography>
          </Stack>

          {/* Theme toggle & Copyright */}
          <Stack
            direction='row'
            spacing={2}
            alignItems='center'
            sx={{ alignSelf: { xs: 'stretch', sm: 'auto' }, justifyContent: 'space-between' }}
          >
            <Typography variant='caption' sx={{ color: '#94a3b8' }}>
              © {new Date().getFullYear()} {brandName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }} title='Cambiar tema'>
              <ButtonTheme />
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};
