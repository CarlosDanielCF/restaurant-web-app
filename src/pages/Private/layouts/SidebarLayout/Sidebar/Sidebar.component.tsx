import { SoftwareBrand } from '@/components/branding/SoftwareBrand';
import { useRestaurantImage } from '@/hooks/useRestaurantImage';
import { Roles } from '@/models/roles';
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
  ListSubheader,
  Tooltip
} from '@mui/material';

import MuiDrawer from '@mui/material/Drawer';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import { DoneOutlineRounded, ExpandMore } from '@mui/icons-material';

import { useSelector } from 'react-redux';
import { selectAuth } from '../../../../../redux';
import { styled, useTheme } from '@mui/material/styles';
import { useRestaurantStore } from '../../../Common/store/restaurantStore';
import { Restaurant } from '@/pages/Private/Common/models/restaurant.model';
import { switchRestaurantMutation } from '@/pages/Private/Restaurant/hooks/useRestaurant';
import { ButtonSound, ButtonTheme } from '../components';
import { Userbox } from '../Header/components';
import { useAppSelector } from '@/hooks';
import { menuSections } from '../data/MenuData';
import { NavItem } from '../../interfaces';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarMenu from './SidebarMenu/SidebarMenu.component';
import { Scrollbar } from '../../../components';

const DRAWER_WIDTH_EXPANDED = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

const DrawerPersistent = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'isCollapsed'
})<{ isCollapsed?: boolean }>(({ theme, isCollapsed }) => {
  const width = isCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;
  return {
    width,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.shorter
    }),
    '& .MuiDrawer-paper': {
      width,
      overflowX: 'hidden',
      boxSizing: 'border-box',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.shorter
      }),
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
      borderRight: `1px solid ${theme.palette.divider}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: 'none'
    }
  };
});

interface TitleProps {
  isCollapsed?: boolean;
}

const Title = ({ isCollapsed = false }: TitleProps) => {
  const { restaurant } = useRestaurantStore((state) => state);
  const switchRestaurant = switchRestaurantMutation();
  const logo = useRestaurantImage(restaurant?.logo);
  const { user } = useSelector(selectAuth);

  const ref = useRef<HTMLButtonElement | null>(null);
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

  if (isCollapsed) {
    return (
      <>
        <Tooltip title={restaurant?.name || 'Restaurante'} placement='right'>
          <IconButton
            onClick={handleOpen}
            ref={ref}
            size='small'
            sx={{ p: 0.5 }}
          >
            {restaurant?.logo ? (
              <img
                src={logo}
                alt='logo'
                width='32px'
                height='32px'
                style={{ borderRadius: 8, objectFit: 'cover' }}
              />
            ) : (
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.contrastText'
                }}
              >
                <StorefrontRoundedIcon fontSize='small' />
              </Box>
            )}
          </IconButton>
        </Tooltip>
        {user?.restaurantRoles && user.restaurantRoles.length > 1 && (
          <Popover
            anchorEl={ref.current}
            onClose={handleClose}
            open={isOpen}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            <List sx={{ width: 220 }}>
              <ListSubheader
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                Cambiar restaurante
              </ListSubheader>
              {user.restaurantRoles.map((restaurantRole) => (
                <ListItemButton
                  key={restaurantRole.id}
                  onClick={() => changeRestaurant(restaurantRole.restaurant)}
                >
                  <ListItemText
                    primary={restaurantRole.restaurant.name}
                    secondary={restaurantRole.role.description}
                  />
                  {restaurant?.id === restaurantRole.restaurant.id && (
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <DoneOutlineRounded fontSize='small' color='primary' />
                    </ListItemIcon>
                  )}
                </ListItemButton>
              ))}
            </List>
          </Popover>
        )}
      </>
    );
  }

  return (
    <>
      <Box
        display='flex'
        alignItems='center'
        gap={1.5}
        sx={{ minWidth: 0, flex: 1 }}
      >
        {restaurant?.logo ? (
          <img
            src={logo}
            alt='logo'
            width='36px'
            height='36px'
            style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
              flexShrink: 0
            }}
          >
            <StorefrontRoundedIcon fontSize='small' />
          </Box>
        )}

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant='subtitle2'
            fontWeight={700}
            color='text.primary'
            noWrap
          >
            {restaurant?.name || 'Sistema Restaurante'}
          </Typography>
          <Typography
            variant='caption'
            color='text.secondary'
            noWrap
            display='block'
          >
            Restaurante seleccionado
          </Typography>
        </Box>

        {user?.restaurantRoles && user.restaurantRoles.length > 1 && (
          <IconButton onClick={handleOpen} ref={ref} size='small'>
            <ExpandMore fontSize='small' />
          </IconButton>
        )}
      </Box>

      {user?.restaurantRoles && user.restaurantRoles.length > 1 && (
        <Popover
          anchorEl={ref.current}
          onClose={handleClose}
          open={isOpen}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <List sx={{ width: 240 }}>
            <ListSubheader
              sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}
            >
              Restaurantes disponibles
            </ListSubheader>
            {user.restaurantRoles.map((restaurantRole) => (
              <ListItemButton
                key={restaurantRole.id}
                onClick={() => changeRestaurant(restaurantRole.restaurant)}
              >
                <ListItemText
                  primary={restaurantRole.restaurant.name}
                  secondary={restaurantRole.role.description}
                />
                {restaurant?.id === restaurantRole.restaurant.id && (
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <DoneOutlineRounded fontSize='small' color='primary' />
                  </ListItemIcon>
                )}
              </ListItemButton>
            ))}
          </List>
        </Popover>
      )}
    </>
  );
};

function Sidebar() {
  const { sidebarToggle, closeSidebar, isCollapsed, toggleCollapse } =
    useContext(SidebarContext);

  const { user: userState } = useAppSelector(selectAuth);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Desktop Collapsible Drawer */}
      <DrawerPersistent
        variant='permanent'
        isCollapsed={isCollapsed}
        sx={{
          display: { xs: 'none', lg: 'block' }
        }}
      >
        <div
          className={`sidebar-software-brand${isCollapsed ? ' sidebar-software-brand--compact' : ''}`}
        >
          <SoftwareBrand compact={isCollapsed} />
        </div>
        {/* Top Header */}
        <Box
          sx={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            px: isCollapsed ? 1 : 2,
            borderBottom: 1,
            borderColor: 'divider',
            flexShrink: 0
          }}
        >
          {isCollapsed ? (
            <Stack direction='column' alignItems='center' spacing={0.5}>
              <Title isCollapsed={true} />
              <Tooltip title='Expandir barra lateral' placement='right'>
                <IconButton
                  onClick={toggleCollapse}
                  size='small'
                  aria-label='Expandir menú lateral'
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ChevronRightRoundedIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <>
              <Title isCollapsed={false} />
              <Tooltip title='Minimizar barra lateral'>
                <IconButton
                  onClick={toggleCollapse}
                  size='small'
                  aria-label='Minimizar menú lateral'
                  sx={{
                    ml: 1,
                    width: 28,
                    height: 28,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ChevronLeftRoundedIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>

        {/* Navigation Items */}
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
          <Scrollbar height='100%'>
            <SidebarMenu />
          </Scrollbar>
        </Box>

        {/* Footer Area */}
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            p: isCollapsed ? 1 : 1.5,
            bgcolor: 'background.paper',
            flexShrink: 0
          }}
        >
          {isCollapsed ? (
            <Stack spacing={1} alignItems='center' justifyContent='center'>
              {userState && <Userbox showDetails={false} />}
              <ButtonTheme />
              <ButtonSound />
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                {userState && <Userbox showDetails={true} />}
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Stack direction='row' spacing={0.5}>
                  <ButtonTheme />
                  <ButtonSound />
                </Stack>
                <Tooltip title='Minimizar menú'>
                  <IconButton
                    onClick={toggleCollapse}
                    size='small'
                    aria-label='Minimizar menú'
                    sx={{ color: 'text.secondary' }}
                  >
                    <ChevronLeftRoundedIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
          )}
        </Box>
      </DrawerPersistent>

      {/* Mobile/Tablet Temporary Drawer */}
      <Drawer
        sx={{
          display: { xs: 'block', lg: 'none' },
          zIndex: theme.zIndex.drawer + 3,
          '& .MuiDrawer-paper': {
            width: 280,
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxSizing: 'border-box'
          }
        }}
        anchor={theme.direction === 'rtl' ? 'right' : 'left'}
        open={sidebarToggle}
        onClose={closeSidebar}
        variant='temporary'
        elevation={6}
        ModalProps={{ keepMounted: true }}
      >
        <Box
          sx={{
            width: 280,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div className='sidebar-software-brand'>
            <SoftwareBrand />
          </div>
          <Box
            p={2}
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Title isCollapsed={false} />
            <IconButton
              onClick={closeSidebar}
              size='small'
              aria-label='Cerrar menú'
            >
              <CloseRoundedIcon fontSize='small' />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            <List component='nav' disablePadding>
              {menuSections
                .flatMap((section) => section.items)
                .map((item: NavItem, index: number) => {
                  if (
                    item.allowedRoles &&
                    userState?.role.name &&
                    !item.allowedRoles.includes(userState.role.name as Roles)
                  ) {
                    return null;
                  }

                  const isSelected =
                    location.pathname === item.to ||
                    (item.to !== '/' && location.pathname.startsWith(item.to));

                  return (
                    <ListItemButton
                      key={index}
                      onClick={() => {
                        closeSidebar();
                        navigate(item.to);
                      }}
                      selected={isSelected}
                      sx={{
                        borderRadius: 2,
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
                          minWidth: 38,
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
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            {userState && <Userbox showDetails={true} />}
            <Box display='flex' justifyContent='center' gap={2}>
              <ButtonTheme />
              <ButtonSound />
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

export default Sidebar;
