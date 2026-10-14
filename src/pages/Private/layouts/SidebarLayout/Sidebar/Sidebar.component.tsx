import { useContext, useRef, useState } from 'react';
import { SidebarContext } from '../../../Common/contexts/SidebarContext';

import {
  Box,
  Divider,
  Typography,
  IconButton,
  Drawer,
  Popover,
  Stack,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  List,
  ListSubheader
} from '@mui/material';

import MuiDrawer from '@mui/material/Drawer';

import SidebarMenu from './SidebarMenu/SidebarMenu.component';
import { Scrollbar } from '../../../components';

import { DoneOutlineRounded, ExpandMore, Inbox } from '@mui/icons-material';

import { useSelector } from 'react-redux';
import { selectAuth } from '../../../../../redux';

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import { useRestaurantStore } from '../../../Common/store/restaurantStore';
import { Restaurant } from '@/pages/Private/Common/models/restaurant.model';
import { switchRestaurantMutation } from '@/pages/Private/Restaurant/hooks/useRestaurant';
import { ButtonSound, ButtonTheme } from '../components';
import { Userbox } from '../Header/components';
import { useAppSelector } from '@/hooks';
import { menuSections } from '../data/MenuData';
import { NavItem } from '../../interfaces';
import { useNavigate } from 'react-router-dom';

const SidebarWrapper = styled(Box)(
  ({ theme }) => `
        width: ${70};
        min-width: ${theme.sidebar.width};
        color: ${theme.colors.alpha.trueWhite[70]};
        background: ${theme.sidebar.background};
        border-right: 1px solid ${theme.sidebar.dividerBg};
        position: relative;
        z-index: 700;
        height: 100%;
        padding-bottom: 68px;
`
);

const drawerWidth = 70;

const DrawerPersistent = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open'
})<{ open?: boolean }>(({ theme, open }) => ({
  width: open ? drawerWidth : 0,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  '& .MuiDrawer-paper': {
    width: open ? drawerWidth : 0,
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: open
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen
    }),
    background: theme.sidebar.background,
    color: theme.colors.alpha.trueWhite[70],
    borderRight: 'none'
  }
}));

const Title = () => {
  const { restaurant, setRestaurant } = useRestaurantStore((state) => state);
  const switchRestaurant = switchRestaurantMutation();
  const { user } = useSelector(selectAuth);

  const ref = useRef<any>(null);
  const [isOpen, setOpen] = useState<boolean>(false);

  const handleOpen = (): void => {
    setOpen(true);
  };

  const handleClose = (): void => {
    setOpen(false);
  };

  const changeRestaurant = (newRestaurant: Restaurant) => {
    if (restaurant?.id !== newRestaurant.id) {
      switchRestaurant.mutate(newRestaurant.id);
    }

    handleClose();
  };

  return (
    <>
      <Box
        display='flex'
        alignItems='center'
        gap={2}
        sx={{
          mx: 3
        }}
      >
        <Box display='flex' alignItems='center' gap={2}>
          {restaurant?.logo && (
            <img
              src={restaurant!.logo}
              alt='logo'
              width='60px'
              style={{ borderRadius: 8 }}
            />
          )}

          <Box>
            <Typography variant='h6' color='text.primary'>
              {restaurant?.name}
            </Typography>
            <Typography variant='subtitle2' color='text.primary'>
              Restaurante
            </Typography>
          </Box>
        </Box>
        <Box flexGrow={1} />
        <IconButton onClick={handleOpen} ref={ref}>
          <ExpandMore fontSize='small' />
        </IconButton>
      </Box>
      <Popover
        anchorEl={ref.current}
        onClose={handleClose}
        open={isOpen}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        sx={{ p: 0 }}
      >
        <List
          sx={{ width: 250, maxWidth: 250 }}
          subheader={
            <ListSubheader
              component='div'
              id='nested-list-subheader'
              sx={{ fontSize: 12 }}
            >
              Restaurantes
            </ListSubheader>
          }
        >
          {user?.restaurantRoles.map((restaurantRole) => (
            <ListItemButton
              key={restaurantRole.id}
              onClick={() => changeRestaurant(restaurantRole.restaurant)}
            >
              <ListItemText
                primaryTypographyProps={{ variant: 'body1' }}
                secondaryTypographyProps={{ variant: 'subtitle2' }}
                primary={restaurantRole.restaurant.name}
                secondary={restaurantRole.role.description}
              />
              {restaurant?.id === restaurantRole.restaurant.id && (
                <ListItemIcon sx={{ minWidth: '30px' }}>
                  <DoneOutlineRounded fontSize='small' color='secondary' />
                </ListItemIcon>
              )}
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </>
  );
};

function Sidebar() {
  const { sidebarToggle, closeSidebar } = useContext(SidebarContext);

  const { user: userState } = useAppSelector(selectAuth);
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop Permanent Drawer */}
      <DrawerPersistent
        variant='permanent'
        open={sidebarToggle}
        sx={{
          display: { xs: 'none', lg: 'block' }
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Scrollbar height={'100%'}>
            {/* <Box mx={2} my={1} mt={3}> */}
            {/* <Title /> */}
            {/* </Box> */}

            <Box
              display='flex'
              alignItems='center'
              justifyContent='center'
              mt={2}
            >
              {userState && <Userbox />}
            </Box>

            <SidebarMenu />
          </Scrollbar>

          <Stack spacing={1} alignItems='center' justifyContent='center' mt={2}>
            <ButtonTheme />
            <ButtonSound />
          </Stack>
        </Box>
      </DrawerPersistent>

      {/* Mobile/Tablet Temporary Drawer */}
      <Drawer
        sx={{
          display: { xs: 'block', lg: 'none' },
          zIndex: theme.zIndex.drawer + 3,
          '& .MuiDrawer-paper': {
            width: 290,
            background: theme.sidebar.background,
            boxSizing: 'border-box'
          }
        }}
        anchor={theme.direction === 'rtl' ? 'right' : 'left'}
        open={sidebarToggle}
        onClose={closeSidebar}
        variant='temporary'
        elevation={10}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ width: 290, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box
            p={2}
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Title />
          </Box>

          <Box p={2} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            {userState && <Userbox />}
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
            <List component='nav' disablePadding>
              {menuSections[0].items.map((item: NavItem, index: number) => {
                if (
                  item.allowedRoles &&
                  userState?.role.name &&
                  !item.allowedRoles.includes(userState.role.name as any)
                ) {
                  return null;
                }

                const isSelected =
                  window.location.pathname === item.to ||
                  (item.to !== '/' && window.location.pathname.startsWith(item.to));

                return (
                  <ListItemButton
                    key={index}
                    onClick={() => {
                      closeSidebar();
                      navigate(item.to);
                    }}
                    selected={isSelected}
                    sx={{
                      borderRadius: 1.5,
                      mb: 0.5,
                      py: 1,
                      px: 2,
                      color: isSelected ? 'primary.main' : 'text.primary',
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: isSelected ? 'primary.main' : 'text.secondary'
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: isSelected ? 600 : 500
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>

          <Box
            p={2}
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'center',
              gap: 2
            }}
          >
            <ButtonTheme />
            <ButtonSound />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

export default Sidebar;
