import { TypeIdentification } from '@/models/common.model';
import { Navigate, useParams } from 'react-router-dom';
import { updateUser } from '../../../../../redux/slices/users/users.slice';
import { useDispatch } from 'react-redux';
import {
  Grid,
  Button,
  Typography,
  Card,
  CardContent,
  Stack,
  Switch,
  Box,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  InputAdornment
} from '@mui/material';
import { CreateUser } from '../../models/create-user.model';
import { FormUser } from '../FormUser.component';
import { ResetPasswordUserDto } from '../../dto/update-user.dto';
import { LoadingButton } from '@mui/lab';
import {
  useResetPasswordUser,
  useUpdateUser,
  useUser
} from '../../hooks/useUsers';
import { IUser } from '../../../../../models';
import { Label } from '../../../../../components/ui';
import { TitlePage } from '../../../components/TitlePage.component';
import { useRestaurantStore } from '@/pages/Private/Common/store/restaurantStore';
import { useState } from 'react';
import { Roles } from '@/models/roles';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';

export const EditUser = () => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const passwordAdornment = (
    <InputAdornment position='end'>
      <IconButton
        aria-label={
          showResetPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
        }
        edge='end'
        onClick={() => setShowResetPassword((visible) => !visible)}
      >
        {showResetPassword ? (
          <VisibilityOffRoundedIcon />
        ) : (
          <VisibilityRoundedIcon />
        )}
      </IconButton>
    </InputAdornment>
  );
  const params = useParams();

  if (!params.id) {
    return <Navigate to='/users' />;
  }
  const { isPending, data: userToUpdate, refetch } = useUser(params.id);
  const { restaurant } = useRestaurantStore((state) => state);

  const dispatch = useDispatch();

  const resetPasswordMutation = useResetPasswordUser();

  const { updateUserMutation } = useUpdateUser();

  const currentRole = userToUpdate?.restaurantRoles.find(
    (restaurantRole) => restaurantRole.restaurant.id === restaurant!.id
  );

  const user: CreateUser = {
    lastName: userToUpdate?.person.lastName || '',
    firstName: userToUpdate?.person.firstName || '',
    email: userToUpdate?.person.email || '',
    numPhone: userToUpdate?.person.numPhone || '',
    identification: {
      type:
        userToUpdate?.person.identification?.type || TypeIdentification.CEDULA,
      num: userToUpdate?.person.identification?.num || ''
    },
    username: userToUpdate?.username || '',
    password: '',
    role: {
      name: currentRole?.role.name || ''
    }
  };

  async function onSubmit(form: CreateUser) {
    const { identification, role, password: _password, ...dataUser } = form;

    if (form.numPhone === '') {
      delete dataUser.numPhone;
    }
    if (form.email === '') {
      delete dataUser.email;
    }

    const userUpdated = {
      ...dataUser,
      typeIdentification: identification.type,
      numberIdentification: identification.num
    };

    updateUserMutation
      .mutateAsync({
        id: userToUpdate!.id,
        expectedVersion: userToUpdate!.version,
        ...userUpdated
      })
      .then((data: IUser) => {
        dispatch(updateUser(data));
        refetch();

        // enqueueSnackbar('Usuario actualizado', { variant: 'success' });
      })
      .catch((err: any) => {
        // console.log(err);
        // enqueueSnackbar('Error al actualizar usuario', { variant: 'error' });
      });
  }

  const submitChangeStatus = () => {
    updateUserMutation
      .mutateAsync({
        id: userToUpdate!.id,
        expectedVersion: userToUpdate!.version,
        isActive: !userToUpdate!.isActive
      })
      .then((data: IUser) => {
        dispatch(updateUser(data));
        refetch();
      });
  };

  async function onReset(password: string) {
    const data: ResetPasswordUserDto = {
      userId: userToUpdate!.id,
      password
    };

    await resetPasswordMutation.mutateAsync(data);
  }
  //
  if (isPending) return <Typography>Cargando trabajador...</Typography>;
  if (!userToUpdate) return <Navigate to='/users' replace />;

  return (
    <>
      <TitlePage title='Editar usuario' />

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              action={
                <>
                  <Label color={userToUpdate!.isActive ? 'success' : 'error'}>
                    {userToUpdate!.isActive ? 'Activo' : 'Inactivo'}
                  </Label>
                </>
              }
            />

            <CardContent>
              <Typography variant='h4' align='center' mt={5}>
                {userToUpdate.person.firstName +
                  ' ' +
                  userToUpdate.person.lastName}
              </Typography>

              <Typography variant='subtitle2' align='center' mb={3}>
                {user.role.name}
              </Typography>

              <Stack spacing={2}>
                <Box display='flex' justifyContent='space-between'>
                  <Box>
                    <Typography variant='h5'>Baneado</Typography>
                    <Typography variant='subtitle2'>
                      Deshabilitar cuenta
                    </Typography>
                  </Box>

                  <Switch
                    checked={!userToUpdate!.isActive}
                    color='success'
                    onChange={() => submitChangeStatus()}
                  />
                </Box>

                {currentRole?.role.name !== Roles.OWNER && (
                  <LoadingButton
                    variant='outlined'
                    onClick={() => setResetDialogOpen(true)}
                    loading={resetPasswordMutation.isPending}
                  >
                    Restablecer contraseña
                  </LoadingButton>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ p: { xs: 2, md: 4 } }}>
            <FormUser
              onSubmit={onSubmit}
              user={user}
              loading={updateUserMutation.isPending}
              isNew={false}
            />
          </Card>
        </Grid>
      </Grid>
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle>Restablecer contraseña</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label='Nueva contraseña'
              type={showResetPassword ? 'text' : 'password'}
              autoComplete='new-password'
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              inputProps={{ minLength: 12, maxLength: 72 }}
              helperText='Mínimo 12 caracteres, con mayúscula, minúscula y número.'
              fullWidth
              InputProps={{
                endAdornment: passwordAdornment
              }}
            />
            <TextField
              label='Confirmar contraseña'
              type={showResetPassword ? 'text' : 'password'}
              autoComplete='new-password'
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={confirmPassword !== '' && confirmPassword !== newPassword}
              helperText={
                confirmPassword !== '' && confirmPassword !== newPassword
                  ? 'Las contraseñas no coinciden.'
                  : ' '
              }
              fullWidth
              InputProps={{
                endAdornment: passwordAdornment
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancelar</Button>
          <LoadingButton
            loading={resetPasswordMutation.isPending}
            disabled={
              newPassword.length < 12 ||
              newPassword.length > 72 ||
              !/[a-z]/.test(newPassword) ||
              !/[A-Z]/.test(newPassword) ||
              !/\d/.test(newPassword) ||
              confirmPassword !== newPassword
            }
            onClick={async () => {
              await onReset(newPassword);
              setResetDialogOpen(false);
              setNewPassword('');
              setConfirmPassword('');
            }}
          >
            Confirmar restablecimiento
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};
