import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import SidebarLayout from '../../layouts/SidebarLayout/SidebarLayout.component';
const NewRestaurant = lazy(() =>
  import('../views/NewRestaurant/NewRestaurant.view').then((m) => ({
    default: m.NewRestaurant
  }))
);

const RestaurantPage = lazy(() => import('../Restaurant.page'));

export const RestaurantRouter: RouteObject = {
  path: '/restaurant',
  children: [
    {
      path: '',
      element: <SidebarLayout />,
      children: [
        {
          path: '',
          element: <RestaurantPage />
        }
      ]
    },
    {
      path: 'new',
      element: <NewRestaurant />
    }
  ]
};
