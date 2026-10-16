import { lazy } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
const Shop = lazy(() =>
  import('../Shop/Shop.page').then((m) => ({ default: m.Shop }))
);
import { Login } from '../Auth/Login';
const Signup = lazy(() =>
  import('../Auth/Signup').then((m) => ({ default: m.Signup }))
);
const ProductsMenu = lazy(() =>
  import('../Shop/views/ProductsMenu/ProductsMenu.view').then((m) => ({
    default: m.ProductsMenu
  }))
);
const Product = lazy(() =>
  import('../Shop/views/Product/Product.page').then((m) => ({
    default: m.Product
  }))
);
const Home = lazy(() =>
  import('../Home/Home.page').then((m) => ({ default: m.Home }))
);
import { ForgotPassword } from '../Auth/ForgotPassword';
import ResetPassword from '../Auth/ResetPassword/ResetPassword.page';

export const PublicRouter: RouteObject[] = [
  {
    path: '',
    children: [
      { path: '', element: <Home /> },
      {
        path: 'shop',
        element: <Shop />,
        children: [
          {
            path: '',
            element: <ProductsMenu />
          },
          {
            path: 'product/:id',
            element: <Product />
          },
          {
            path: '*',
            element: <Navigate to='' />
          }
        ]
      }
    ]
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'register',
        element: <Signup />
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />
      },
      {
        path: 'reset-password/:token',
        element: <ResetPassword />
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to='/' />
  }
];
