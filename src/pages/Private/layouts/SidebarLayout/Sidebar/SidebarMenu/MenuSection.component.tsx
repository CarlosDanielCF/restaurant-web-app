import { FC, useContext } from 'react';
import { List, ListSubheader } from '@mui/material';
import { NavItemButton } from './';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../../../../../redux';
import { MenuSection as IMenuSection } from '../../../interfaces';
import { Roles } from '@/models/roles';
import { SidebarContext } from '../../../../Common/contexts/SidebarContext';

interface Props {
  section: IMenuSection;
}

export const MenuSection: FC<Props> = ({ section }) => {
  const { user } = useSelector(selectAuth);
  const { isCollapsed } = useContext(SidebarContext);

  if (
    section.allowedRoles &&
    user?.role.name &&
    user?.role.name !== Roles.OWNER &&
    !section.allowedRoles.includes(user.role.name as Roles)
  ) {
    return null;
  }

  return (
    <List
      component='div'
      disablePadding
      subheader={
        section.title && !isCollapsed ? (
          <ListSubheader
            component='div'
            disableSticky
            sx={{
              background: 'transparent',
              fontSize: '0.6875rem',
              fontWeight: 750,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#64748b',
              px: 2,
              pt: 1.25,
              pb: 0.5,
              lineHeight: 2
            }}
          >
            {section.title}
          </ListSubheader>
        ) : undefined
      }
    >
      {section.items.map((item, index) => (
        <NavItemButton key={index} item={item} />
      ))}
    </List>
  );
};
