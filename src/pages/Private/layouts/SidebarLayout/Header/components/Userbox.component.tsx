import { useContext, useRef, useState } from 'react';

import {
  Avatar,
  Box,
  Button,
  Divider,
  lighten,
  List,
  ListItemText,
  Popover,
  Typography,
  ListItemButton,
  ListItemSecondaryAction,
  Badge,
  ListItemIcon,
  ListSubheader
} from '@mui/material';

import { styled } from '@mui/material';

import { NavLink } from 'react-router-dom';

import LockOpenTwoToneIcon from '@mui/icons-material/LockOpenTwoTone';
import { startLogout, selectAuth } from '../../../../../../redux/slices/auth';
import { useAppDispatch, useAppSelector } from '../../../../../../hooks';
import { Circle, Done, ExpandMore } from '@mui/icons-material';
import { SocketContext } from '../../../../../../context/SocketContext';
import { Label } from '../../../../../../components/ui';
import { Restaurant } from '@/pages/Private/Common/models/restaurant.model';
import { useRestaurantStore } from '@/pages/Private/Common/store/restaurantStore';
import { switchRestaurantMutation } from '@/pages/Private/Restaurant/hooks/useRestaurant';
import { Roles } from '@/models/roles';

const MenuUserBox = styled(Box)(
  ({ theme }) => `
        padding: ${theme.spacing(1.75, 2)};
`
);

const UserBoxText = styled(Box)(
  ({ theme }) => `
        text-align: left;
`
);

const UserBoxLabel = styled(Typography)(
  ({ theme }) => `
        font-weight: ${theme.typography.fontWeightBold};
        color: ${theme.palette.text.primary};
        display: block;
`
);

const UserBoxDescription = styled(Typography)(
  ({ theme }) => `
        color: ${theme.palette.text.secondary};
`
);

interface UserboxProps {
  showDetails?: boolean;
}

export const Userbox = ({ showDetails = false }: UserboxProps) => {
  const { user: userState } = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const { restaurant } = useRestaurantStore((state) => state);
  const switchRestaurant = switchRestaurantMutation();

  const { online } = useContext(SocketContext);

  const user = {
    name:
      [userState?.person?.firstName, userState?.person?.lastName]
        .filter(Boolean)
        .join(' ') ||
      userState?.username ||
      'Usuario',
    avatar: '/static/images/avatars/2.jpg',
    jobtitle: userState?.role?.description,
    restaurantRoles: userState?.restaurantRoles || []
  };

  const changeRestaurant = (newRestaurant: Restaurant) => {
    if (restaurant?.id !== newRestaurant.id) {
      switchRestaurant.mutate(newRestaurant.id);
    }

    handleClose();
  };

  const ref = useRef<HTMLDivElement | null>(null);
  const [isOpen, setOpen] = useState<boolean>(false);

  const handleOpen = (): void => {
    setOpen(true);
  };

  const handleClose = (): void => {
    setOpen(false);
  };

  const handleLogout = () => {
    dispatch(startLogout());
  };

  return (
    <>
      <Box
        display='flex'
        alignItems='center'
        sx={{
          cursor: 'pointer',
          minWidth: 0,
          maxWidth: '100%',
          overflow: 'hidden',
          p: showDetails ? '5px 12px 5px 8px' : 0.5,
          borderRadius: 2.5,
          border: showDetails ? 1 : 0,
          borderColor: 'divider',
          bgcolor: showDetails ? 'background.paper' : 'transparent',
          boxShadow: showDetails ? '0 1px 2px 0 rgba(15, 23, 42, 0.04)' : 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: 'primary.main'
          }
        }}
        onClick={handleOpen}
        ref={ref}
      >
        <Badge
          overlap='circular'
          color={online ? 'success' : 'error'}
          variant='dot'
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          badgeContent={''}
        >
          <Avatar
            variant='circular'
            alt={user.name}
            sx={{
              flexShrink: 0,
              width: showDetails ? 36 : 32,
              height: showDetails ? 36 : 32,
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(13, 148, 136, 0.25)'
            }}
          >
            {user.name?.at(0)?.toUpperCase()}
          </Avatar>
        </Badge>

        {showDetails && (
          <>
            <Box sx={{ ml: 1.25, textAlign: 'left', minWidth: 0 }}>
              <Typography
                variant='subtitle2'
                fontWeight={650}
                color='text.primary'
                noWrap
                sx={{ fontSize: '0.8125rem', lineHeight: 1.25 }}
              >
                {user.name}
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                noWrap
                display='block'
                sx={{ fontSize: '0.6875rem', lineHeight: 1.2 }}
              >
                {user.jobtitle || 'Usuario'}
              </Typography>
            </Box>
            <ExpandMore sx={{ fontSize: 18, color: 'text.secondary', ml: 0.5, opacity: 0.7 }} />
          </>
        )}
      </Box>

      <Popover
        anchorEl={ref.current}
        onClose={handleClose}
        open={isOpen}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{
          sx: {
            minWidth: 230,
            borderRadius: 2.5,
            border: 1,
            borderColor: 'divider',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden'
          }
        }}
      >
        <MenuUserBox sx={{ bgcolor: '#f8fafc', borderBottom: 1, borderColor: 'divider' }} display='flex'>
          <UserBoxText sx={{ pl: 0 }}>
            <UserBoxLabel variant='body2' sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {user.name}
              <Circle
                sx={{ fontSize: 9 }}
                color={online ? 'success' : 'error'}
              />
            </UserBoxLabel>
            <UserBoxDescription variant='caption' sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {user.jobtitle || 'Usuario'}
            </UserBoxDescription>
          </UserBoxText>
        </MenuUserBox>

        {userState?.role.name !== Roles.HOST && (
          <>
            <List
              sx={{ p: 1 }}
              component='nav'
              subheader={
                <ListSubheader
                  component='div'
                  id='nested-list-subheader'
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'text.secondary',
                    px: 1.5,
                    py: 0.5,
                    lineHeight: 2,
                    background: 'transparent'
                  }}
                >
                  Restaurantes
                </ListSubheader>
              }
            >
              {user?.restaurantRoles.map((restaurantRole) => (
                <ListItemButton
                  key={restaurantRole.id}
                  onClick={() => changeRestaurant(restaurantRole.restaurant)}
                  sx={{
                    borderRadius: 1.5,
                    py: 0.75,
                    px: 1.5,
                    my: 0.25,
                    bgcolor: restaurant?.id === restaurantRole.restaurant.id ? '#f0fdfa' : 'transparent',
                    '&:hover': {
                      bgcolor: '#f0fdfa'
                    }
                  }}
                >
                  <ListItemText
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: restaurant?.id === restaurantRole.restaurant.id ? 650 : 500,
                      color: restaurant?.id === restaurantRole.restaurant.id ? 'primary.main' : 'text.primary'
                    }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    primary={restaurantRole.restaurant.name}
                    secondary={restaurantRole.role.description}
                  />
                  {restaurant?.id === restaurantRole.restaurant.id && (
                    <ListItemIcon sx={{ minWidth: '24px', justifyContent: 'flex-end' }}>
                      <Done fontSize='small' color='primary' />
                    </ListItemIcon>
                  )}
                </ListItemButton>
              ))}
            </List>
          </>
        )}

        {userState?.role.name !== Roles.HOST && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <List sx={{ p: 1 }} component='nav'>
              <ListItemButton
                to='/users/profile'
                component={NavLink}
                onClick={handleClose}
                sx={{ borderRadius: 1.5, py: 0.75, px: 1.5, my: 0.25 }}
              >
                <ListItemText
                  primary='Mi perfil'
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
                <ListItemSecondaryAction>
                  <Label color='info'>Nuevo</Label>
                </ListItemSecondaryAction>
              </ListItemButton>

              <ListItemButton
                to='/users/account'
                component={NavLink}
                onClick={handleClose}
                sx={{ borderRadius: 1.5, py: 0.75, px: 1.5, my: 0.25 }}
              >
                <ListItemText
                  primary='Mi cuenta'
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
              </ListItemButton>
            </List>
            <Divider sx={{ my: 0.5 }} />
          </>
        )}

        <Box sx={{ p: 1.25 }}>
          <Button
            variant='outlined'
            color='error'
            fullWidth
            onClick={() => handleLogout()}
            sx={{
              borderRadius: 2,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 650,
              bgcolor: '#fef2f2',
              borderColor: '#fecaca',
              color: '#dc2626',
              '&:hover': {
                bgcolor: '#fee2e2',
                borderColor: '#fca5a5'
              }
            }}
          >
            <LockOpenTwoToneIcon sx={{ mr: 1, fontSize: 18 }} />
            Cerrar sesión
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default Userbox;