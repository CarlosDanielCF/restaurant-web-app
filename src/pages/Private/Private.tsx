import { useEffect } from 'react';
import { useNavigate, useRoutes, useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppSelector } from '@/hooks/useRedux';
import { selectAuth } from '@/redux/slices/auth';
import { Roles } from '@/models/roles';
import { PrivateRouter } from './router';
import { SidebarProvider } from './Common/contexts/SidebarContext';
import { OrderProvider } from './Orders/context/Order.context';

export const Private = () => {
  const content = useRoutes(PrivateRouter);
  const { user } = useAppSelector(selectAuth);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (
      user?.role.name === Roles.COOK &&
      ['/', '/orders', '/orders/'].includes(location.pathname)
    )
      navigate('/kitchen', { replace: true });
  }, [user?.role.name, location.pathname, navigate]);

  // Operational routes own their reads and reconciliation. Historical menu/order
  // stores are loaded only by LegacyWorkspaceData where they have consumers.
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <OrderProvider>
        <SidebarProvider>
          <>{content}</>
        </SidebarProvider>
      </OrderProvider>
    </LocalizationProvider>
  );
};

export default Private;
