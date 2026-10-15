import NiceModal, { muiDialogV5, useModal } from '@ebay/nice-modal-react';
import { LoadingButton } from '@mui/lab';
import {
  Dialog,
  DialogTitle,
  Divider,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { IUser } from '../../../../../models/auth.model';
import { useRemoveUserFromRestaurant } from '../../hooks/useUsers';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';

interface Props {
  user: IUser;
}

export const RemoveUserFromRestaurant = NiceModal.create<Props>(({ user }) => {
  const modal = useModal();
  const removeUserMutation = useRemoveUserFromRestaurant();

  const closeModal = () => {
    modal.hide();
  };

  const handleRemoveUser = async () => {
    removeUserMutation.mutate(user.id, {
      onSuccess: () => {
        closeModal();
      }
    });
  };

  return (
    <Dialog {...muiDialogV5(modal)} maxWidth='sm' fullWidth>
      <DialogTitle id='alert-dialog-title'>
        Remover usuario del restaurante
      </DialogTitle>
      <Divider />
      <DialogContent>
        <DialogContentText id='alert-dialog-description'>
          {`¿Está seguro de remover al usuario ${user.person.firstName} ${user.person.lastName} del restaurante?`}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={closeModal}
          color='inherit'
          startIcon={<CloseRoundedIcon />}
        >
          Cancelar
        </Button>
        <LoadingButton
          loading={removeUserMutation.isPending}
          variant='contained'
          color='error'
          onClick={handleRemoveUser}
          startIcon={<PersonRemoveRoundedIcon />}
        >
          Remover
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
});
