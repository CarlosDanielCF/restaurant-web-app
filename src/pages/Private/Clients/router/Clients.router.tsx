import { lazy } from 'react';

import { RouteObject } from 'react-router-dom';

import { PrivateRoutes } from '../../../../models/routes.model';
import Clients from '../Clients.page';
import { ClientsList } from '../components';
const AddClient = lazy(() =>
  import('../components/AddClient').then((m) => ({ default: m.AddClient }))
);
const EditClient = lazy(() =>
  import('../components/EditClient').then((m) => ({ default: m.EditClient }))
);

export const ClientsRouter: RouteObject = {
  path: PrivateRoutes.CLIENTS,
  element: <Clients />,
  children: [
    {
      path: '',
      element: <ClientsList />
    },
    {
      path: 'edit',
      element: <EditClient />
    },
    {
      path: 'add',
      element: <AddClient />
    }
  ]
};
