import { FC } from 'react';

import { Box, Button, Typography, Stack, Breadcrumbs } from '@mui/material';

import Link, { LinkProps } from '@mui/material/Link';

import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowBack, CircleRounded } from '@mui/icons-material';

const breadcrumbNameMap: { [key: string]: string } = {
  '/orders': 'Pedidos',
  '/orders/list': 'Lista',
  '/orders/edit': 'Editar',
  '/orders/add': 'Nuevo pedido',
  '/orders/add/menu': 'Productos',

  [`/orders/edit/:id`]: 'id',
  '/orders/edit/ljasd/receipt': 'Comprobante',
  '/orders/actives': 'Activos',
  '/orders/menu': 'Nuevo pedido',
  '/drafts': 'Drafts',
  '/menu': 'Menú',
  '/menu/products': 'Productos',
  '/menu/products/edit': 'Editar',
  '/menu/products/add': 'Nuevo producto',
  '/menu/categories': 'Categorías',
  '/menu/sections': 'Secciones',
  '/menu/edit': 'Editar',
  '/menu/edit/seccion': 'Seccion',
  '/menu/edit/category': 'Categoría',
  '/menu/edit/product': 'Producto',
  '/users': 'Usuarios',
  '/users/edit': 'Editar',
  '/users/add': 'Nuevo usuario',
  '/tables': 'Mesas',
  '/tables/edit': 'Editar',
  '/tables/add': 'Nueva mesa',
  '/clients': 'Clientes',
  '/clients/edit': 'Editar',
  '/clients/add': 'Nuevo cliente',
  '/balance': 'Balance',

  '/shop/menu': 'Menú',
  '/shop': 'Menú',

  '/reports': 'Dashboard',
  '/reports/products': 'Productos',
  '/reports/incomes': 'Ingresos',
  '/reports/prediction': 'Predicción de afluencia',
  '/reports/simulation': 'Simulación de afluencia',
  '/reports/staff-planning': 'Planificación de personal'
};

interface LinkRouterProps extends LinkProps {
  to: string;
  replace?: boolean;
}

function LinkRouter(props: LinkRouterProps) {
  return <Link {...props} component={RouterLink as any} />;
}

interface Props {
  title: string;
  action?: React.ReactNode;
  breadcrumbEnd?: string;
  showBreadcrumbs?: boolean;
  back?: boolean;
  backTo?: string;
}

export const TitlePage: FC<Props> = ({
  title,
  action,
  showBreadcrumbs = false,
  back = false,
  backTo
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <Stack
      spacing={1}
      my={2}
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent={{ xs: 'normal', sm: 'space-between' }}
      alignItems={{ sm: 'center' }}
    >
      <Stack direction='row' alignItems='center' justifyContent='flex-start'>
        {back && (
          <Button
            startIcon={<ArrowBack />}
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            variant='outlined'
            size='small'
            sx={{
              mr: 1.5,
              borderRadius: 2,
              borderColor: 'divider',
              color: 'text.secondary',
              bgcolor: 'background.paper',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              '&:hover': {
                bgcolor: '#f0fdfa',
                borderColor: '#99f6e4',
                color: 'primary.main'
              }
            }}
          >
            Volver
          </Button>
        )}
        <Box>
          <Typography
            variant='h5'
            fontWeight={750}
            color='text.primary'
            sx={{ letterSpacing: '-0.02em', lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          {showBreadcrumbs && (
            <Breadcrumbs
              separator={<CircleRounded sx={{ fontSize: 4, color: 'text.disabled' }} />}
              sx={{ mt: 0.25 }}
            >
              {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                if (breadcrumbNameMap[to]) {
                  return last ? (
                    <Typography
                      variant='caption'
                      color='text.primary'
                      fontWeight={600}
                      key={to}
                    >
                      {breadcrumbNameMap[to]}
                    </Typography>
                  ) : (
                    <LinkRouter
                      underline='hover'
                      color='inherit'
                      to={to}
                      key={to}
                      sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                    >
                      {breadcrumbNameMap[to]}
                    </LinkRouter>
                  );
                }
              })}
            </Breadcrumbs>
          )}
        </Box>
      </Stack>

      <Stack direction='row' justifyContent='flex-end'>
        {action}
      </Stack>
    </Stack>
  );
};
