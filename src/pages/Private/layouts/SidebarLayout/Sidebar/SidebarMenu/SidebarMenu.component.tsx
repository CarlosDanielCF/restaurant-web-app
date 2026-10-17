import { routePermission, useWorkerAccess } from '@/hooks/useWorkerAccess';
import { Box } from '@mui/material';
import { MenuSection } from './MenuSection.component';
import { menuSections } from '../../data/MenuData';

function SidebarMenu() {
  const can = useWorkerAccess();
  return (
    <Box sx={{ width: '100%', py: 0.5 }}>
      {menuSections.map((section, index) => (
        <MenuSection
          section={{
            ...section,
            items: section.items.filter(
              (item) =>
                !routePermission(item.to || '') ||
                can(routePermission(item.to || '')!)
            )
          }}
          key={index}
        />
      ))}
    </Box>
  );
}

export default SidebarMenu;
