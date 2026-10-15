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
import NiceModal, { muiDialogV5, useModal } from '@ebay/nice-modal-react';
import { LoadingButton } from '@mui/lab';
import { ICategory } from '../../../../../../models';
import { updateCategory } from '../../../../../../redux';
import { useAppDispatch } from '../../../../../../hooks/useRedux';
import { useUpdateCategory } from '../../../hooks/useCategories';

export interface Props {
  category: ICategory;
}

export const ModalDeleteCategory = NiceModal.create<Props>(({ category }) => {
  const modal = useModal();

  const { mutateAsync, isPending } = useUpdateCategory();

  const dispatch = useAppDispatch();

  const closeModal = () => {
    modal.hide();
  };

  const eliminarCategoria = async () => {
    await mutateAsync({ id: category!.id, isActive: false }).then(
      (category) => {
        dispatch(updateCategory(category));
        closeModal();
      }
    );
  };

  return (
    <>
      <Dialog {...muiDialogV5(modal)}>
        <DialogTitle id='alert-dialog-title'>
          {`¿Está seguro de eliminar la categoría ${category!.name}?`}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Se eliminarán todos los productos que pertenecen a esta categoría.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={closeModal}
            color='inherit'
            startIcon={<CloseRoundedIcon />}
          >
            Cancelar
          </Button>
          <LoadingButton
            loading={isPending}
            variant='contained'
            color='error'
            onClick={eliminarCategoria}
            startIcon={<DeleteOutlineRoundedIcon />}
          >
            Eliminar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
});
