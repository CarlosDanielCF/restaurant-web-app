import { lazy } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
const ListOrders = lazy(() =>
  import('../views').then((m) => ({ default: m.ListOrders }))
);
const EditOrder = lazy(() =>
  import('../views').then((m) => ({ default: m.EditOrder }))
);
const MenuAddProductsOrder = lazy(() =>
  import('../views').then((m) => ({ default: m.MenuAddProductsOrder }))
);
const ReceiptOrder = lazy(() =>
  import('../views').then((m) => ({ default: m.ReceiptOrder }))
);
const OrdersDashboard = lazy(() =>
  import('../views').then((m) => ({ default: m.OrdersDashboard }))
);
import { PrivateRoutes } from '../../../../models/routes.model';

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
      element: <Navigate to='/attention' replace />
    },
    {
      path: 'actives',
      element: <Navigate to='/kitchen' replace />
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
      element: <Navigate to='/attention' replace />
    },
    {
      path: 'add/menu',
      element: <Navigate to='/attention' replace />
    }
  ]
};
