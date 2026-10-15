import {
  DialogTitle,
  Divider,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Dialog
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { updateProduct } from '../../../../../../redux';
import { LoadingButton } from '@mui/lab';
import { useAppDispatch } from '../../../../../../hooks/useRedux';
import NiceModal, { muiDialogV5, useModal } from '@ebay/nice-modal-react';
import { IProduct } from '../../../../../../models';
import { useUpdateProduct } from '../../../hooks/useProducts';

export interface Props {
  product: IProduct;
}

export const ModalDeleteProduct = NiceModal.create<Props>(({ product }) => {
  const modal = useModal();

  const { mutateAsync, isPending } = useUpdateProduct();

  const closeModal = () => {
    modal.hide();
  };

  const dispatch = useAppDispatch();

  const submitDeleteProduct = async () => {
    await mutateAsync({ id: product!.id, isActive: false }).then((product) => {
      dispatch(updateProduct(product));
      closeModal();
    });
  };
  return (
    <>
      <Dialog {...muiDialogV5(modal)}>
        <DialogTitle id='alert-dialog-title'>
          {`¿Está seguro de eliminar el producto ${product!.name}?`}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            El producto ya no estará disponible en el catálogo activo.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeModal} color='inherit' startIcon={<CloseRoundedIcon />}>
            Cancelar
          </Button>
          <LoadingButton
            loading={isPending}
            variant='contained'
            color='error'
            onClick={submitDeleteProduct}
            startIcon={<DeleteOutlineRoundedIcon />}
          >
            Eliminar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
});
