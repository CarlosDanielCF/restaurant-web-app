import { lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { selectAuth } from '../redux/slices/auth';
import { useAppSelector } from '../hooks/useRedux';

import { Public } from '../pages/Public/Public.page';
const SetupRestaurant = lazy(() =>
  import('@/pages/Private/SetupRestaurant').then((m) => ({
    default: m.SetupRestaurant
  }))
);
import { useRestaurantStore } from '@/pages/Private/Common/store/restaurantStore';
import { useRenewToken } from '@/pages/Public/Auth/hooks/useAuth';
import { SessionCheckStatus } from '@/components/ui/SessionCheckStatus';
import { Roles } from '@/models/roles';

const Private = lazy(() => import('../pages/Private/Private'));

/**
 * @author Santiago Quirumbay
 * @version v1.1 12-04-2025 Implement useRenewToken hook
 */
export const AppRouter = () => {
  const { status, user, error } = useAppSelector(selectAuth);
  const { restaurant } = useRestaurantStore((state) => state);
  const location = useLocation();
  useRenewToken();

  if (status === 'checking') {
    return <SessionCheckStatus />;
  }

  if (
    status === 'not-authenticated' &&
    !!error &&
    location.pathname !== '/auth/login'
  )
    return <Navigate to='/auth/login' replace />;

  if (
    status === 'authenticated' &&
    restaurant &&
    user?.role &&
    location.pathname.startsWith('/auth')
  ) {
    const destination =
      user.role.name === Roles.HOST
        ? '/jalador'
        : user.role.name === Roles.COOK
          ? '/kitchen'
          : user.role.name === Roles.OWNER ||
              user.role.name === Roles.ADMIN ||
              user.role.name === Roles.WAITER
            ? '/attention'
            : '/unauthorized';
    return <Navigate to={destination} replace />;
  }

  return (
    <Routes>
      {status === 'not-authenticated' ? (
        <Route path='/*' element={<Public />} />
      ) : status === 'authenticated' && !restaurant ? (
        <Route path='/*' element={<SetupRestaurant />} />
      ) : (
        <Route path='/*' element={<Private key={restaurant?.id} />} />
      )}
    </Routes>
  );
};
