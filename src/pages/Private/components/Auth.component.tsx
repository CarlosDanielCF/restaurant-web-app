import { routePermission, useWorkerAccess } from '@/hooks/useWorkerAccess';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { FC } from 'react';

import React from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../../redux';
import { Roles } from '@/models/roles';

interface Props {
  allowedRoles: Roles[];
}

const Auth: FC<Props> = ({ allowedRoles }) => {
  const { user } = useSelector(selectAuth);
  const location = useLocation();
  const can = useWorkerAccess(),
    permission = routePermission(location.pathname);
  const permissionAllowed = permission ? can(permission) : true;
  const roleAllowed = !!user &&
    (user.role.name === Roles.OWNER ||
      allowedRoles.includes(user.role.name as Roles));
  const authorized = !!user && permissionAllowed && roleAllowed;

  return authorized ? (
    <Outlet />
  ) : user?.username ? (
    <Navigate to='/unauthorized' state={{ from: location }} replace />
  ) : (
    <Navigate to='/register' state={{ from: location }} replace />
  );
};

export default Auth;
