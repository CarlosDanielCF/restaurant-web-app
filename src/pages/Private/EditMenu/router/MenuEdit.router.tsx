import { lazy } from 'react';
import EditMenu from '../EditMenu.page';
import { Sections } from '../views/Sections/Sections.view';

import { Navigate, RouteObject } from 'react-router-dom';

const EditCategory = lazy(() =>
  import('../components').then((m) => ({ default: m.EditCategory }))
);
const ProductsList = lazy(() =>
  import('../components').then((m) => ({ default: m.ProductsList }))
);
const EditProduct = lazy(() =>
  import('../views/Products/').then((m) => ({ default: m.EditProduct }))
);
const Products = lazy(() =>
  import('../views/Products/').then((m) => ({ default: m.Products }))
);
const CreateProduct = lazy(() =>
  import('../views/Products/').then((m) => ({ default: m.CreateProduct }))
);
const Categories = lazy(() =>
  import('../views/Categories/Categories.view').then((m) => ({
    default: m.Categories
  }))
);

export const MenuEditRouter: RouteObject = {
  path: 'menu',
  element: <EditMenu />,
  children: [
    {
      path: '',
      element: <Navigate to={'sections'} />
    },
    {
      path: 'sections',
      element: <Sections />
    },
    {
      path: 'categories',
      element: <Categories />
    },
    {
      path: 'products',
      element: <Products />
    },
    {
      path: 'products/:id',
      element: <>vista producto</>
      // loader: productLoader(queryClient)
    },
    {
      path: 'products/:id/edit',
      element: <EditProduct />
    },
    {
      path: 'products/create',
      element: <CreateProduct />
    },
    // {
    //   path: "seccion",
    //   element: <EditSection />,
    // },
    // {
    //   path: ":nameSection",
    //   element: <EditCategories />,
    // },
    {
      path: 'category',
      element: <EditCategory />
    },
    {
      path: ':nameSection/:nameCategory',
      element: <ProductsList />
    },
    {
      path: 'product',
      element: <EditProduct />
    },
    {
      path: '*',
      element: <Navigate to={'sections'} />
    }
  ]
};
