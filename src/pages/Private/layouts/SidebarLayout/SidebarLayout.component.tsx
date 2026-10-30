import { WorkerAccessBoundary } from '@/pages/Private/components/WorkerAccessBoundary';
import { OperationalHeaderMeta } from './Header/OperationalHeaderMeta';
import '../../final.css';
import '../../../../styles/clean-pos.css';
import '../../../../styles/point-workspaces.css';
import '../../../../styles/operational-ux.css';
import { FC, ReactNode, Suspense, lazy, useContext, useEffect } from 'react';
import { RouteLoading } from '@/components/ui/RouteLoading';
const LegacyWorkspaceData = lazy(
  () => import('../../components/LegacyWorkspaceData')
);
import {
  Box,
  useTheme,
  CssBaseline,
  IconButton,
  Typography,
  useMediaQuery
} from '@mui/material';
import MenuTwoToneIcon from '@mui/icons-material/MenuTwoTone';
import { Outlet, useLocation } from 'react-router-dom';
import { Roles } from '@/models/roles';
import { menuSections } from './data/MenuData';

import Sidebar from './Sidebar/Sidebar.component';
import HeaderUserbox from './Header/components/Userbox.component';
import { SidebarContext } from '../../Common/contexts/SidebarContext';
import { useRestaurantStore } from '../../Common/store/restaurantStore';
import { useAppSelector } from '@/hooks';
import { selectAuth } from '@/redux';
import { SocketContext } from '@/context';
import { useNotificationSound } from '@/hooks';
import { useSnackbar } from 'notistack';

interface SidebarLayoutProps {
  children?: ReactNode;
  allowedRoles?: string[];
}

const SidebarLayout: FC<SidebarLayoutProps> = () => {
  const theme = useTheme();
  const location = useLocation();
  const needsHistoricalStores =
    /^\/(orders(?:\/|$)|menu(?:\/|$)|tables(?:\/|$)|restaurant(?:\/|$)|users\/profile(?:\/|$))/.test(
      location.pathname
    );
  const { user } = useAppSelector(selectAuth);
  const { socket } = useContext(SocketContext);
  const { enqueueSnackbar } = useSnackbar();
  const { play: playNotificationSound } = useNotificationSound(
    1,
    '/audio/kitchen-waiter-bell.mp3'
  );
  const currentSection = menuSections
    .flatMap((section) => section.items)
    .find(
      (item) =>
        item.allowedRoles?.includes(user?.role.name as Roles) &&
        location.pathname.startsWith(item.to)
    )?.title;
  const mobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { toggleSidebar, closeSidebar } = useContext(SidebarContext);
  const restaurant = useRestaurantStore((state) => state.restaurant);

  useEffect(() => {
    if (mobile) closeSidebar();
  }, [mobile]);

  useEffect(() => {
    const notify = ({
      data
    }: {
      data: { table: string; product: string; quantity: number };
    }) => {
      void playNotificationSound();
      enqueueSnackbar(
        `Mesa: ${data.table} · ${data.product} · salió ${data.quantity}`,
        { variant: 'success' }
      );
    };
    socket?.on('kitchen.exit.ready', notify);
    return () => {
      socket?.off('kitchen.exit.ready', notify);
    };
  }, [socket, enqueueSnackbar, playNotificationSound]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          height: '100dvh',
          overflow: 'hidden'
        }}
      >
        <CssBaseline />
        <Sidebar />
        <Box
          component='main'
          data-testid='app-content'
          sx={{
            position: 'relative',
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            width: '100%',
            overflow: 'auto',
            height: '100dvh',
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen
            })
          }}
        >
          {/* Shared header: navigation on small screens, context on desktop. */}
          <Box
            className='pos-header'
            sx={{
              display: 'flex',
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'space-between',
              px: { xs: 1.5, sm: 2.5 },
              py: 1,
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)'
            }}
          >
            <Box
              display='flex'
              alignItems='center'
              gap={1.5}
              sx={{ minWidth: 0 }}
            >
              <IconButton
                onClick={toggleSidebar}
                color='primary'
                edge='start'
                aria-label='Abrir menú de navegación'
                size='medium'
                sx={{
                  display: {
                    xs: user?.role.name === Roles.HOST ? 'none' : 'inline-flex',
                    lg: 'none'
                  },
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main'
                  }
                }}
              >
                <MenuTwoToneIcon fontSize='small' />
              </IconButton>
              <Box sx={{ minWidth: 0 }}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography
                    variant='subtitle1'
                    fontWeight={750}
                    color='text.primary'
                    noWrap
                    sx={{
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                      letterSpacing: '-0.015em'
                    }}
                  >
                    {restaurant?.name || 'Sistema Restaurante'}
                  </Typography>
                  {currentSection && (
                    <Box
                      sx={{
                        display: { xs: 'none', sm: 'inline-flex' },
                        alignItems: 'center',
                        px: 1.25,
                        py: 0.25,
                        borderRadius: '20px',
                        bgcolor: 'rgba(13, 148, 136, 0.08)',
                        border: '1px solid rgba(13, 148, 136, 0.2)',
                        color: 'primary.main',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {currentSection}
                    </Box>
                  )}
                </Box>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: { xs: 'none', lg: 'block' }, lineHeight: 1.2 }}
                >
                  Sección: {currentSection || 'Restaurante'}
                </Typography>
              </Box>
            </Box>
            <Box className='pos-header-team' display='flex' alignItems='center' gap={1.5}>
              {user?.role.name !== Roles.HOST && <OperationalHeaderMeta />}
              {user && <HeaderUserbox showDetails />}
            </Box>
          </Box>
          <Box sx={{ p: { xs: 1.5, sm: 2, md: 2 }, flex: 1, minWidth: 0 }}>
            <WorkerAccessBoundary>
              <Suspense fallback={<RouteLoading />}>
                {needsHistoricalStores ? (
                  <LegacyWorkspaceData>
                    <Outlet />
                  </LegacyWorkspaceData>
                ) : (
                  <Outlet />
                )}
              </Suspense>
            </WorkerAccessBoundary>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default SidebarLayout;
