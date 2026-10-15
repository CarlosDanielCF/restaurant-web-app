import { useState, useEffect, FC } from 'react';
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
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useFetchAndLoad } from '../../../../../hooks/useFetchAndLoad';
import { deleteUser } from '../../../../../redux/slices/users/users.slice';
import { useDispatch } from 'react-redux';
import { IUser } from '../../../../../models/auth.model';
import {
  statusModalDeleteUser,
  deleteUser as deleteUserS
} from '../../services/users.service';
import { useSnackbar } from 'notistack';

export const DeleteUser: FC = () => {
  const [user, setUser] = useState<IUser>();

  const subscription$ = statusModalDeleteUser.getSubject();

  const [open, setOpen] = useState<boolean>(false);

  const { loading, callEndpoint } = useFetchAndLoad();

  const { enqueueSnackbar } = useSnackbar();

  const dispatch = useDispatch();

  const closeModal = () => {
    setOpen(false);
  };

  const submitDeleteUser = async () => {
    await callEndpoint(deleteUserS(user!.id))
      .then(() => {
        enqueueSnackbar('Usuario eliminado', { variant: 'success' });
        dispatch(deleteUser(user!.id));
        closeModal();
      })
      .catch(() => {
        enqueueSnackbar('Error al eliminar usuario', { variant: 'error' });
      });
  };

  useEffect(() => {
    subscription$.subscribe((data) => {
      setUser(data.user);
      setOpen(!!data.value);
    });
  }, []);

  return (
    <Dialog open={open} onClose={closeModal}>
      <DialogTitle id='alert-dialog-title'>Eliminar usuario</DialogTitle>
      <Divider />
      <DialogContent>
        <DialogContentText id='alert-dialog-description'>
          {`¿Está seguro de eliminar el usuario ${user?.person?.firstName || ''}?`}
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
          loading={loading}
          variant='contained'
          color='error'
          onClick={submitDeleteUser}
          startIcon={<DeleteOutlineRoundedIcon />}
        >
          Eliminar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
