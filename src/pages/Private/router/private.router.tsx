import { OverviewPage } from '../Insights/OverviewPage';
import { DocumentsPage } from '../Insights/DocumentsPage';
import { ReportsPage } from '../Insights/ReportsPage';
import { FinancePage } from '../Finance/FinancePage';
import { KitchenPage } from '../Operations/KitchenPage';
import { OperationsPage } from '../Operations/Operations.page';
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
import { NewRestaurant } from '../Restaurant/views/NewRestaurant/NewRestaurant.view';
import { Roles } from '@/models/roles';

export const PrivateRouter: RouteObject[] = [
  {
    path: '/',
    element: <SidebarLayout />,
    children: [
      {
        path: 'internal-documents',
        element: (
          <Auth allowedRoles={[Roles.OWNER, Roles.ADMIN, Roles.WAITER]} />
        ),
        children: [{ index: true, element: <DocumentsPage /> }]
      },
      { path: 'operational-reports', element: <ReportsPage /> },
      {
        path: 'finance',
        element: (
          <Auth allowedRoles={[Roles.OWNER, Roles.ADMIN, Roles.WAITER]} />
        ),
        children: [{ index: true, element: <FinancePage /> }]
      },
      { path: 'attention', element: <OperationsPage /> },
      {
        path: 'kitchen',
        element: <Auth allowedRoles={[Roles.OWNER, Roles.ADMIN, Roles.COOK]} />,
        children: [{ index: true, element: <KitchenPage /> }]
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
        path: 'unauthorized',
        element: <UnauthorizedPage />
      },
      {
        path: '/auth/login',
        element: <Navigate to='/attention' />
      },
      {
        path: '',
        element: <Navigate to='/attention' />
      },
      {
        path: 'ORD.ORDERS',
        element: <Navigate to='/attention' />
      },
      {
        path: '*',
        element: <Navigate to='/attention' />
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
