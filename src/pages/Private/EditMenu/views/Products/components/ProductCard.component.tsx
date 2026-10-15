import { useRestaurantImage } from '@/hooks/useRestaurantImage';
import { FC } from 'react';

import {
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Popover,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material/';

import {
  DeleteOutlined,
  EditOutlined,
  MoreHoriz,
  Reply
} from '@mui/icons-material';

import { IProduct } from '../../../../../../models';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '../../../../Common/helpers/format-money.helper';
import NiceModal from '@ebay/nice-modal-react';
import {
  ModalDeleteProduct,
  Props as MDeleteProps
} from './ModalDeleteProduct.component';
import { bindPopover } from 'material-ui-popup-state';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { LabelProductStatus } from '../../../../../../components/ui/LabelProductStatus.component';
import { Label } from '@/components/ui';
import { useUpdateProduct } from '../../../hooks/useProducts';
import { useAppDispatch } from '@/hooks';
import { updateProduct } from '@/redux';

/**
 * @author Steven Rosales
 * @version 1.0 15/03/2025 Update product card
 */
interface Props {
  producto: IProduct;
}

export const ProductCard: FC<Props> = ({ producto }) => {
  const productImage = useRestaurantImage(producto.images);
  const navigate = useNavigate();
  const theme = useTheme();

  const isSm = useMediaQuery(theme.breakpoints.down('sm'));

  const imageWidth = isSm ? 90 : 110;

  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'popoverMenuProduct'
  });

  const showModalDeleteProduct = () => {
    NiceModal.show(ModalDeleteProduct, { product: producto } as MDeleteProps);
  };

  const { mutateAsync, isPending } = useUpdateProduct();

  const dispatch = useAppDispatch();

  const enableProduct = async () => {
    popupState.close();
    await mutateAsync({ id: producto.id, isActive: true }).then((product) => {
      dispatch(updateProduct(product));
    });
  };

  const navitateToEditProduct = () => {
    navigate(`/menu/products/${producto.id}/edit`);
  };

  const handleDelete = () => {
    popupState.close();
    showModalDeleteProduct();
  };

  return (
    <>
      <Card
        sx={{
          width: '100%',
          height: '100%',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[2]
          }
        }}
      >
        <CardContent
          sx={{
            width: '100%',
            p: { xs: 1.5, sm: 2 },
            '&:last-child': { pb: { xs: 1.5, sm: 2 } },
            gap: 1.5,
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start'
          }}
        >
          <img
            src={
              productImage
                ? productImage
                : '/static/images/products/no-image.png'
            }
            alt={producto.name}
            style={{
              width: imageWidth,
              height: Math.round(imageWidth * 0.75),
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              flexShrink: 0
            }}
          />
          <Stack direction='column' spacing={0.5} width='100%' minWidth={0}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {producto.isActive ? (
                <LabelProductStatus status={producto.status} />
              ) : (
                <Label color='error'>Inactivo</Label>
              )}

              <IconButton
                size='small'
                aria-label={`Opciones de ${producto.name}`}
                {...bindTrigger(popupState)}
              >
                <MoreHoriz fontSize='small' />
              </IconButton>
            </Box>

            <Typography
              variant='subtitle1'
              onClick={navitateToEditProduct}
              sx={{
                fontWeight: 600,
                fontSize: '0.95rem',
                lineHeight: 1.3,
                cursor: 'pointer',
                color: 'text.primary',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline'
                },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {producto.name}
            </Typography>

            <Typography
              variant='body1'
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                fontSize: '1rem'
              }}
            >
              {formatMoney(producto.price)}
            </Typography>

            <Box sx={{ mt: 'auto', pt: 0.5 }}>
              <Typography fontSize='0.75rem' color='text.secondary' noWrap>
                {producto.category.name}
              </Typography>
              <Typography fontSize='0.75rem' color='text.disabled' noWrap>
                {producto.productionArea?.name || 'Sin área asignada'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 140
            }
          }
        }}
      >
        <MenuItem onClick={navitateToEditProduct}>
          <EditOutlined fontSize='small' sx={{ mr: 2 }} />
          Editar
        </MenuItem>
        {/* <MenuItem onClick={navigateToViewProduct}>
          <Visibility fontSize="small" sx={{ mr: 2 }} />
          Ver
        </MenuItem> */}
        {producto.isActive ? (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteOutlined fontSize='small' sx={{ mr: 2 }} />
            Eliminar
          </MenuItem>
        ) : (
          <MenuItem onClick={enableProduct} sx={{ color: 'success.main' }}>
            <Reply fontSize='small' sx={{ mr: 2 }} />
            Habilitar
          </MenuItem>
        )}
      </Popover>
    </>
  );
};
