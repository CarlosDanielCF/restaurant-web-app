import { lazy } from 'react';

import { RouteObject } from 'react-router-dom';
import { PrivateRoutes } from '../../../../models';
const EditTable = lazy(() =>
  import('../components').then((m) => ({ default: m.EditTable }))
);
const ListTables = lazy(() =>
  import('../components').then((m) => ({ default: m.ListTables }))
);

const Tables = lazy(() => import('../Tables.page'));

export const TablesRouter: RouteObject = {
  path: PrivateRoutes.TABLES,
  element: <Tables />,
  children: [
    {
      path: '',
      element: <ListTables />
    },
    {
      path: 'edit',
      element: <EditTable />
    }
  ]
};
