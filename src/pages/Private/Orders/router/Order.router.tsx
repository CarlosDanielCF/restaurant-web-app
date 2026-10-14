import { Navigate, RouteObject } from 'react-router-dom';
import {
  ListOrders,
  EditOrder,
  MenuAddProductsOrder,
  ReceiptOrder,
  OrdersDashboard
} from '../views';
import { PrivateRoutes } from '../../../../models/routes.model';

import { lazy } from 'react';

const Orders = lazy(() => import('../Orders.page'));

export const OrderRouter: RouteObject = {
  path: PrivateRoutes.ORDERS,
  element: <Orders />,
  children: [
    {
      path: '',
      element: <OrdersDashboard />
    },
    {
      path: 'tables',
      element: <Navigate to="/attention" replace />
    },
    {
      path: 'actives',
      element: <Navigate to="/kitchen" replace />
    },
    {
      path: 'list',
      element: <ListOrders />
    },
    {
      path: 'list/edit/:orderId',
      element: <EditOrder />
    },
    {
      path: 'list/edit/:orderId/products',
      element: <MenuAddProductsOrder />
    },
    {
      path: 'list/edit/:orderId/receipt',
      element: <ReceiptOrder />
    },
    {
      path: 'add',
      element: <Navigate to="/attention" replace />
    },
    {
      path: 'add/menu',
      element: <Navigate to="/attention" replace />
    }
  ]
};
