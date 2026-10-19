import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

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

const Private = lazy(() => import('../pages/Private/Private'));

/**
 * @author Santiago Quirumbay
 * @version v1.1 12-04-2025 Implement useRenewToken hook
 */
export const AppRouter = () => {
  const { status } = useAppSelector(selectAuth);
  const { restaurant } = useRestaurantStore((state) => state);
  useRenewToken();

  if (status === 'checking') {
    return <SessionCheckStatus />;
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
