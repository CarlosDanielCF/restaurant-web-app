import { lazy } from 'react';
const SuppliesPage = lazy(() =>
  import('../Supplies/SuppliesPage').then((m) => ({ default: m.SuppliesPage }))
);
const OverviewPage = lazy(() =>
  import('../Insights/OverviewPage').then((m) => ({ default: m.OverviewPage }))
);
const ReportsPage = lazy(() =>
  import('../Insights/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const FinancePage = lazy(() =>
  import('../Finance/FinancePage').then((m) => ({ default: m.FinancePage }))
);
const KitchenPage = lazy(() =>
  import('../Operations/KitchenPage').then((m) => ({ default: m.KitchenPage }))
);
const JaladorPage = lazy(() =>
  import('../Jalador/JaladorPage').then((m) => ({ default: m.JaladorPage }))
);
const OperationsPage = lazy(() =>
  import('../Operations/Operations.page').then((m) => ({
    default: m.OperationsPage
  }))
);
import { Navigate, RouteObject } from 'react-router-dom';

import SidebarLayout from '../layouts/SidebarLayout/SidebarLayout.component';

import { PrivateRoutes } from '../../../models';
import { OrderRouter } from '../Orders/router';
import { MenuEditRouter } from '../EditMenu/router/MenuEdit.router';
import { ClientsRouter } from '../Clients/router/Clients.router';
import { TablesRouter } from '../Tables/router/Tables.router';
import { UsersRouter, UserRouter } from '../Users/router/Users.router';
import { RestaurantRouter } from '../Restaurant/router';
import { UnauthorizedPage } from '../../Status/Unauthorized.page';
import Auth from '../components/Auth.component';
import BaseLayout from '../layouts/BaseLayout';
const NewRestaurant = lazy(() =>
  import('../Restaurant/views/NewRestaurant/NewRestaurant.view').then((m) => ({
    default: m.NewRestaurant
  }))
);
import { Roles } from '@/models/roles';

const UnauthorizedRoute = () => <Navigate to='/unauthorized' replace />;

export const PrivateRouter: RouteObject[] = [
  {
    path: '/',
    element: <SidebarLayout />,
    children: [
      {
        path: 'operational-reports',
        element: (
          <Auth
            allowedRoles={[Roles.OWNER, Roles.ADMIN, Roles.WAITER, Roles.COOK]}
          />
        ),
        children: [{ index: true, element: <ReportsPage /> }]
      },
      {
        path: 'supplies',
        element: <Auth allowedRoles={[Roles.OWNER, Roles.ADMIN]} />,
        children: [{ index: true, element: <SuppliesPage /> }]
      },
      {
        path: 'finance',
        element: (
          <Auth allowedRoles={[Roles.OWNER, Roles.ADMIN, Roles.WAITER]} />
        ),
        children: [{ index: true, element: <FinancePage /> }]
      },
      {
        path: 'attention',
        element: (
          <Auth
            allowedRoles={[Roles.OWNER, Roles.ADMIN, Roles.WAITER, Roles.COOK]}
          />
        ),
        children: [{ index: true, element: <OperationsPage /> }]
      },
      {
        path: 'kitchen',
        element: <Auth allowedRoles={[Roles.OWNER, Roles.ADMIN, Roles.COOK]} />,
        children: [{ index: true, element: <KitchenPage /> }]
      },
      {
        path: 'jalador',
        element: <Auth allowedRoles={[Roles.HOST]} />,
        children: [{ index: true, element: <JaladorPage /> }]
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />
      },
      // MenuRouter,
      OrderRouter,

      {
        element: <Auth allowedRoles={[Roles.OWNER, Roles.ADMIN]} />,
        children: [MenuEditRouter]
      },
      ClientsRouter,
      TablesRouter,
      UserRouter,

      {
        path: PrivateRoutes.USERS,
        element: <Auth allowedRoles={[Roles.OWNER, Roles.ADMIN]} />,
        children: [UsersRouter]
      },
      {
        path: 'operational-overview',
        element: <Auth allowedRoles={[Roles.OWNER, Roles.ADMIN]} />,
        children: [{ index: true, element: <OverviewPage /> }]
      },

      {
        path: 'ORD.ORDERS',
        element: <Navigate to='/attention' replace />
      },
      {
        path: '*',
        element: <UnauthorizedRoute />
      }
    ]
  },
  {
    path: 'restaurant',
    element: <Auth allowedRoles={[Roles.OWNER, Roles.ADMIN]} />,
    children: [RestaurantRouter]
  }
];

export const SetupRestaurantRoutes: RouteObject[] = [
  {
    path: '/restaurant',
    element: <BaseLayout />,
    children: [
      {
        path: '',
        element: <NewRestaurant />
      },
      {
        path: 'new',
        element: <NewRestaurant />
      },
      {
        path: '*',
        element: <Navigate to={'/restaurant/new'} />
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to={'/restaurant'} />
  }
];
