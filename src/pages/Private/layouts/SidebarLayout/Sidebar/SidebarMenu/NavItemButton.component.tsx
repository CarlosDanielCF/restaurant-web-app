import { FC, useContext } from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { SidebarContext } from '../../../../Common/contexts/SidebarContext';
import { NavItem } from '../../../interfaces';
import { selectAuth } from '../../../../../../redux';
import { useSelector } from 'react-redux';
import { Roles } from '@/models/roles';

interface Props {
  item: NavItem;
}

export const NavItemButton: FC<Props> = ({ item }) => {
  const { closeSidebar, isCollapsed } = useContext(SidebarContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();

  const { user } = useSelector(selectAuth);
  const navigate = useNavigate();

  const isSelected =
    location.pathname === item.to ||
    (item.to !== '/' && location.pathname.startsWith(item.to));

  const handleClick = () => {
    if (isMobile) {
      closeSidebar();
    }
    navigate(item.to);
  };

  if (
    item.allowedRoles &&
    user?.role.name !== Roles.OWNER &&
    !item.allowedRoles.includes(user?.role.name as Roles)
  ) {
    return null;
  }

  // Collapsed mode on desktop
  if (isCollapsed && !isMobile) {
    return (
      <ListItem
        component='div'
        key={item.to}
        disablePadding
        sx={{
          display: 'flex',
          justifyContent: 'center',
          my: 0.5
        }}
      >
        <Tooltip title={item.title} placement='right' arrow>
          <IconButton
            onClick={handleClick}
            aria-label={item.title}
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              color: isSelected ? 'primary.main' : 'text.secondary',
              bgcolor: isSelected
                ? alpha(theme.palette.primary.main, 0.12)
                : 'transparent',
              boxShadow: isSelected
                ? '0 2px 6px rgba(13, 148, 136, 0.15)'
                : 'none',
              '&:hover': {
                bgcolor: isSelected
                  ? alpha(theme.palette.primary.main, 0.18)
                  : alpha(theme.palette.action.hover, 0.08),
                color: isSelected ? 'primary.main' : 'text.primary'
              },
              transition: theme.transitions.create(
                ['background-color', 'color', 'box-shadow'],
                {
                  duration: theme.transitions.duration.shorter
                }
              )
            }}
          >
            {item.icon}
          </IconButton>
        </Tooltip>
      </ListItem>
    );
  }

  // Expanded mode on desktop or mobile drawer
  return (
    <ListItem
      component='div'
      key={item.to}
      disablePadding
      sx={{ my: 0.35, px: 1.25 }}
    >
      <ListItemButton
        onClick={handleClick}
        selected={isSelected}
        sx={{
          borderRadius: 2,
          py: 0.9,
          px: 1.5,
          color: isSelected ? 'primary.main' : 'text.primary',
          bgcolor: isSelected
            ? 'linear-gradient(90deg, rgba(13, 148, 136, 0.12) 0%, rgba(13, 148, 136, 0.02) 100%)'
            : 'transparent',
          boxShadow: isSelected ? 'inset 3.5px 0 0 #0d9488' : 'none',
          '&.Mui-selected': {
            bgcolor: 'rgba(13, 148, 136, 0.1)',
            color: 'primary.main',
            boxShadow: 'inset 3.5px 0 0 #0d9488',
            '&:hover': {
              bgcolor: 'rgba(13, 148, 136, 0.16)'
            }
          },
          '&:hover': {
            bgcolor: alpha(theme.palette.action.hover, 0.08),
            '& .MuiListItemIcon-root': {
              color: isSelected ? 'primary.main' : 'primary.main'
            }
          },
          transition: theme.transitions.create(['background-color', 'color', 'box-shadow'], {
            duration: theme.transitions.duration.shorter
          })
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 36,
            color: isSelected ? 'primary.main' : 'text.secondary',
            transition: 'color 0.2s ease',
            '& .MuiSvgIcon-root': {
              fontSize: 20
            }
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.title}
          primaryTypographyProps={{
            variant: 'body2',
            fontWeight: isSelected ? 650 : 500,
            noWrap: true,
            sx: {
              letterSpacing: '-0.01em'
            }
          }}
        />
      </ListItemButton>
    </ListItem>
  );
};