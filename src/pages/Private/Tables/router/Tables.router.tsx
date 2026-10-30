import { lazy } from 'react';

import { RouteObject } from 'react-router-dom';
import { PrivateRoutes } from '../../../../models';
import Tables from '../Tables.page';
import { ListTables } from '../components';
const EditTable = lazy(() =>
  import('../components').then((m) => ({ default: m.EditTable }))
);
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
