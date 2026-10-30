import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import { selectAuth } from '@/redux';
import { Roles } from '@/models/roles';
import { ManagerDashboard } from './ManagerDashboard';
import { MozoDashboard } from './MozoDashboard';
import { CocineroDashboard } from './CocineroDashboard';
import { JaladorDashboard } from './JaladorDashboard';
import './insights.css';

export function OverviewPage() {
  const user = useSelector(selectAuth).user;
  const userRole = user?.role?.name as Roles | undefined;

  // For manager roles (Dueño / Admin), allow previewing other role dashboards
  const isManager = userRole === Roles.OWNER || userRole === Roles.ADMIN;
  const [managerView, setManagerView] = useState<'manager' | 'mozo' | 'cook' | 'host'>('manager');

  if (isManager) {
    const previewSelector = (
      <Box className='role-preview-switcher'>
        <ToggleButtonGroup
          value={managerView}
          exclusive
          size='small'
          onChange={(_, next) => {
            if (next) setManagerView(next);
          }}
          aria-label='Vista por rol'
          sx={{
            height: '34px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            '& .MuiToggleButton-root': {
              border: 'none',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              color: '#64748b',
              '&.Mui-selected': {
                bgcolor: '#0d9488',
                color: '#ffffff',
                '&:hover': {
                  bgcolor: '#0f766e'
                }
              }
            }
          }}
        >
          <ToggleButton value='manager'>Gerencia</ToggleButton>
          <ToggleButton value='mozo'>Mozo</ToggleButton>
          <ToggleButton value='cook'>Cocina</ToggleButton>
          <ToggleButton value='host'>Jalador</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    );

    if (managerView === 'mozo') return <MozoDashboard previewRoleSelector={previewSelector} />;
    if (managerView === 'cook') return <CocineroDashboard previewRoleSelector={previewSelector} />;
    if (managerView === 'host') return <JaladorDashboard previewRoleSelector={previewSelector} />;
    return <ManagerDashboard previewRoleSelector={previewSelector} />;
  }

  // Non-manager roles strictly see only their allowed operational dashboard
  if (userRole === Roles.COOK) {
    return <CocineroDashboard />;
  }

  if (userRole === Roles.WAITER) {
    return <MozoDashboard />;
  }

  if (userRole === Roles.HOST) {
    return <JaladorDashboard />;
  }

  // Fallback to Manager Dashboard
  return <ManagerDashboard />;
}
