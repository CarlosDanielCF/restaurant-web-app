import { Box, Button, CircularProgress, Container, Grid } from '@mui/material';

import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useProduct } from '../../hooks/useProducts';
import { TitlePage } from '../../../components';
import { FormProduct } from './components/FormProduct.component';
import { ProductTags } from './components/ProductTags.component';
import { useSelector } from 'react-redux';
import { selectMenu } from '../../../../../redux';
import { EmptyState } from '@/components/ui';
import { FastfoodOutlined } from '@mui/icons-material';

export const EditProduct = () => {
  const params = useParams();
  const navigate = useNavigate();

  if (!params.id) {
    return <Navigate to='/menu/products' />;
  }
  // This update activeProduct in redux
  const { isPending, data: product } = useProduct(params.id);

  // const product = useSelector(selectMenu).activeProduct;

  if (isPending) {
    return (
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        py={10}
        gap={2}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box py={6}>
        <EmptyState
          icon={<FastfoodOutlined sx={{ fontSize: 44 }} />}
          title='Producto no encontrado'
          description='El producto solicitado no existe o fue removido del catálogo.'
          action={
            <Button
              variant='contained'
              onClick={() => navigate('/menu/products')}
            >
              Volver al catálogo
            </Button>
          }
        />
      </Box>
    );
  }

  return (
    <>
      <TitlePage title={product.name} />

      {product && <FormProduct product={product} />}

      {/* <Grid container spacing={2} sx={{ mt: 1, mb: 6 }}> */}
      {/*   <Grid item xs={12} md={6}> */}
      {/*     <ProductTags product={product} /> */}
      {/*   </Grid> */}
      {/* </Grid> */}
    </>
  );
};
