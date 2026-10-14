import NiceModal, { muiDialogV5, useModal } from '@ebay/nice-modal-react';

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputBase,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

import { CloseOutlined } from '@mui/icons-material';
import { useUpdateUser, useUsersSuggestions } from '../hooks/useUsers';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useState } from 'react';
import { IUser } from '@/models';
import { useRoles } from '../hooks/useRoles';
import { InviteUserDto } from '../dto/invite-user.dto';
import { useSendInvitation } from '../hooks/useInvitation';
import { LoadingButton } from '@mui/lab';
import { EditUser } from './EditUser/EditUser.component';
import { useRestaurantStore } from '../../Common/store/restaurantStore';
import { useSnackbar } from 'notistack';

interface Props {
  user: IUser;
}

export const EditUserRole = NiceModal.create<Props>(({ user }) => {
  const modal = useModal();
  const updateUserRole = useUpdateUser().updateUserRole;
  const restaurant = useRestaurantStore((state) => state.restaurant);

  const userRole = user.restaurantRoles.find(
    (resRole) => resRole.restaurant.id === restaurant?.id
  )?.role;

  const [roleId, setRoleId] = useState<number>(userRole!.id);

  const {
    usersQuery,
    search,
    debouncedSearch,

    handleChangeSearch
  } = useUsersSuggestions();

  const { rolesQuery } = useRoles();
  const { enqueueSnackbar } = useSnackbar();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const closeModal = () => {
    modal.hide();
  };

  const updateList = () => {
    usersQuery.refetch();
  };

  useEffect(() => {
    updateList();
  }, [debouncedSearch]);

  const handleChangeRole = (event: SelectChangeEvent<number>) => {
    console.log(event.target.value);
    setRoleId(event.target.value as number);
  };

  const onSubmit = async () => {
    console.log({ roleId });
    if (!roleId) {
      enqueueSnackbar('Seleccione un rol', { variant: 'warning' });
    }

    updateUserRole.mutateAsync(
      {
        userId: user.id,
        roleId: roleId!
      },
      {
        onSuccess: () => {
          updateList();
          closeModal();
        }
      }
    );
  };

  return (
    <Dialog {...muiDialogV5(modal)} fullScreen={fullScreen} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Box>
            <Typography variant='h5'>Actualizar rol</Typography>
          </Box>
          <Stack direction='row' spacing={2} alignItems='center'>
            <IconButton onClick={modal.hide} size='small' aria-label='Cerrar'>
              <CloseOutlined fontSize='small' />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Paper variant='outlined' sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'background.default' }}>
          <Typography variant='subtitle1' fontWeight={600} color='text.primary'>
            {user.person.firstName} {user.person.lastName}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            @{user.username} • {user.person.email}
          </Typography>
        </Paper>

        <FormControl fullWidth>
          <InputLabel id='edit-user-role-label'>Nuevo rol en el restaurante</InputLabel>
          <Select
            labelId='edit-user-role-label'
            id='edit-user-role'
            value={roleId || ''}
            label='Nuevo rol en el restaurante'
            onChange={handleChangeRole}
            required
          >
            {rolesQuery.data?.map((role) => (
              <MenuItem value={role.id} key={role.id}>
                {role.description}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={closeModal} color='inherit'>
          Cancelar
        </Button>
        <LoadingButton
          onClick={onSubmit}
          variant='contained'
          loading={updateUserRole.isPending}
          disabled={!roleId}
        >
          Guardar cambios
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
});
