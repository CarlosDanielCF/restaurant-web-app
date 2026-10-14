import { FC, ReactNode, useContext, useEffect } from 'react';
import {
  Box,
  useTheme,
  CssBaseline,
  IconButton,
  useMediaQuery
} from '@mui/material';
import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar/Sidebar.component';
import MenuIcon from '@mui/icons-material/Menu';
import { SidebarContext } from '../../Common/contexts/SidebarContext';

interface SidebarLayoutProps {
  children?: ReactNode;
  allowedRoles?: string[];
}

const SidebarLayout: FC<SidebarLayoutProps> = () => {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { closeSidebar, toggleSidebar } = useContext(SidebarContext);
  useEffect(() => {
    if (mobile) closeSidebar();
    // Close the desktop navigation when entering a small viewport.
  }, [mobile]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        <CssBaseline />
        {/* <Header /> */}
        <Sidebar />
        <Box
          sx={{
            position: 'relative',
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            width: '100%',
            minWidth: 0,
            overflow: 'auto',
            height: '100vh',
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen
            })
          }}
        >
          {mobile && (
            <Box sx={{ px: 1, pt: 1 }}>
              <IconButton aria-label='Abrir navegación' onClick={toggleSidebar}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
          <Outlet />
        </Box>
      </Box>
    </>
  );
};

export default SidebarLayout;
