import { lazy } from 'react';
import { RouteObject } from 'react-router';
import Users from '../Users.page';
import { UsersList } from '../pages/UsersList.page';

const AddUser = lazy(() =>
  import('../components/AddUser/AddUser.component').then((m) => ({
    default: m.AddUser
  }))
);
const EditUser = lazy(() =>
  import('../components/EditUser/EditUser.component').then((m) => ({
    default: m.EditUser
  }))
);
const Profile = lazy(() =>
  import('../views/Profile/Profile.view').then((m) => ({ default: m.Profile }))
);
const Account = lazy(() =>
  import('../views/Account/Account.view').then((m) => ({ default: m.Account }))
);
import { PrivateRoutes } from '../../../../models';

export const UsersRouter: RouteObject = {
  path: '',
  element: <Users />,
  children: [
    {
      path: '',
      element: <UsersList />
    },
    {
      path: 'edit/:id',
      element: <EditUser />
    },
    {
      path: 'add',
      element: <AddUser />
    }
  ]
};

export const UserRouter: RouteObject = {
  path: PrivateRoutes.USERS,
  element: <Users />,
  children: [
    {
      path: 'profile',
      element: <Profile />
    },
    {
      path: 'account',
      element: <Account />
    }
  ]
};
