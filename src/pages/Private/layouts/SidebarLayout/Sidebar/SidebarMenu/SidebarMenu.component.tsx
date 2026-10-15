import { Box } from '@mui/material';
import { MenuSection } from './MenuSection.component';
import { menuSections } from '../../data/MenuData';

function SidebarMenu() {
  return (
    <Box sx={{ width: '100%', py: 0.5 }}>
      {menuSections.map((section, index) => (
        <MenuSection section={section} key={index} />
      ))}
    </Box>
  );
}

export default SidebarMenu;
