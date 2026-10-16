import { FC, ReactNode, useContext, useEffect } from 'react';
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
import { menuSections } from './data/MenuData';

import Sidebar from './Sidebar/Sidebar.component';
import HeaderUserbox from './Header/components/Userbox.component';
import { SidebarContext } from '../../Common/contexts/SidebarContext';
import { useRestaurantStore } from '../../Common/store/restaurantStore';
import { useAppSelector } from '@/hooks';
import { selectAuth } from '@/redux';

interface SidebarLayoutProps {
  children?: ReactNode;
  allowedRoles?: string[];
}

const SidebarLayout: FC<SidebarLayoutProps> = () => {
  const theme = useTheme();
  const location = useLocation();
  const currentSection = menuSections
    .flatMap((section) => section.items)
    .find((item) => location.pathname.startsWith(item.to))?.title;
  const mobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { toggleSidebar, closeSidebar } = useContext(SidebarContext);
  const restaurant = useRestaurantStore((state) => state.restaurant);
  const { user } = useAppSelector(selectAuth);

  useEffect(() => {
    if (mobile) closeSidebar();
  }, [mobile]);

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
            sx={{
              display: 'flex',
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.25,
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              boxShadow: theme.shadows[1]
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
                sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
              >
                <MenuTwoToneIcon />
              </IconButton>
              <Typography
                variant='h6'
                fontWeight={700}
                color='text.primary'
                noWrap
              >
                {restaurant?.name || 'Sistema Restaurante'}
                <Typography
                  component='span'
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: { xs: 'none', lg: 'block' } }}
                >
                  Sección: {currentSection || 'Restaurante'}
                </Typography>
              </Typography>
            </Box>
            {user && <HeaderUserbox />}
          </Box>
          <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, flex: 1, minWidth: 0 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default SidebarLayout;
