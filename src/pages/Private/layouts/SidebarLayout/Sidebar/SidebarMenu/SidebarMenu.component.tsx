import { useAppSelector } from '@/hooks';
import { selectAuth } from '@/redux';
import { Roles } from '@/models/roles';
import { routePermission, useWorkerAccess } from '@/hooks/useWorkerAccess';
import { Box } from '@mui/material';
import { MenuSection } from './MenuSection.component';
import { menuSections } from '../../data/MenuData';

function SidebarMenu() {
  const can = useWorkerAccess();
  const { user } = useAppSelector(selectAuth);
  return (
    <Box sx={{ width: '100%', py: 0.5 }}>
      {menuSections.map((section, index) => (
        <MenuSection
          section={{
            ...section,
            items: section.items.filter(
              (item) =>
                (!item.allowedRoles ||
                  item.allowedRoles.includes(user?.role.name as Roles)) &&
                (!routePermission(item.to || '') ||
                  can(routePermission(item.to || '')!))
            )
          }}
          key={index}
        />
      ))}
    </Box>
  );
}

export default SidebarMenu;
