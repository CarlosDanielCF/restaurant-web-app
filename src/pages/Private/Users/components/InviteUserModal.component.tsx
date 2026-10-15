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
  ListItemButton,
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
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import { useUsersSuggestions } from '../hooks/useUsers';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useState } from 'react';
import { IUser } from '@/models';
import { useRoles } from '../hooks/useRoles';
import { InviteUserDto } from '../dto/invite-user.dto';
import { useSendInvitation } from '../hooks/useInvitation';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';

export const InviteUserModal = NiceModal.create(() => {
  const modal = useModal();
  const useInviteUser = useSendInvitation();
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [roleId, setRoleId] = useState<number>();

  const {
    usersQuery,
    search,
    debouncedSearch,

    handleChangeSearch
  } = useUsersSuggestions();

  const { rolesQuery } = useRoles();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();

  const closeModal = () => {
    modal.hide();
  };

  const updateList = () => {
    usersQuery.refetch();
  };

  useEffect(() => {
    updateList();
  }, [debouncedSearch]);

  const selectUser = (user: IUser) => {
    setSelectedUser(user);
  };

  const handleChangeRole = (event: SelectChangeEvent<number>) => {
    console.log(event.target.value);
    setRoleId(event.target.value as number);
  };

  const onSubmit = async () => {
    if (!selectedUser || !roleId) {
      enqueueSnackbar('Seleccione un usuario y un rol', {
        variant: 'warning'
      });
      return;
    }
    const inviteUserDto: InviteUserDto = {
      userId: selectedUser?.id,
      roleId: roleId
    };

    useInviteUser.mutateAsync(inviteUserDto, {
      onSuccess: () => {
        closeModal();
      }
    });
  };

  return (
    <Dialog
      {...muiDialogV5(modal)}
      fullScreen={fullScreen}
      maxWidth='sm'
      fullWidth
    >
      <DialogTitle>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Box>
            <Typography variant='h5'>Invitar usuario</Typography>
          </Box>
          <Stack direction='row' spacing={2} alignItems='center'>
            <IconButton onClick={modal.hide} size='small' aria-label='Cerrar'>
              <CloseOutlined fontSize='small' />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {!selectedUser && (
          <Paper
            component='form'
            onSubmit={(e) => {
              e.preventDefault();
              updateList();
            }}
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <InputBase
              type='text'
              onChange={handleChangeSearch}
              sx={{ ml: 1, flex: 1 }}
              placeholder='Buscar usuario...'
              inputProps={{ 'aria-label': 'Buscar usuario' }}
              value={search}
            />
            <IconButton
              type='button'
              sx={{ p: '10px' }}
              aria-label='buscar'
              onClick={updateList}
            >
              {usersQuery.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <SearchIcon />
              )}
            </IconButton>
          </Paper>
        )}
        {!selectedUser &&
          usersQuery.data?.users &&
          usersQuery.data.users.length > 0 && (
            <Box
              maxHeight={240}
              overflow='auto'
              mt={2}
              borderRadius='8px'
              border={1}
              borderColor='divider'
            >
              <List disablePadding>
                {usersQuery.data?.users.map((user) => (
                  <ListItemButton
                    key={user.id}
                    onClick={() => selectUser(user)}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <ListItemText
                      primary={`${user.person.firstName} ${user.person.lastName}`}
                      secondary={`@${user.username} • ${user.person.email}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}

        {selectedUser && (
          <Box>
            <Paper
              variant='outlined'
              sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}
            >
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
              >
                <Box>
                  <Typography variant='subtitle1' fontWeight={600}>
                    {selectedUser.person.firstName}{' '}
                    {selectedUser.person.lastName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    @{selectedUser.username} • {selectedUser.person.email}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setSelectedUser(null)}
                  size='small'
                  aria-label='Cambiar usuario seleccionado'
                >
                  <CloseOutlined fontSize='small' />
                </IconButton>
              </Box>
            </Paper>

            <Box mt={3}>
              <FormControl fullWidth>
                <InputLabel id='select-role-label'>
                  Rol en el restaurante
                </InputLabel>
                <Select
                  labelId='select-role-label'
                  id='select-role'
                  value={roleId || ''}
                  label='Rol en el restaurante'
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
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={closeModal}
          color='inherit'
          startIcon={<CloseOutlined />}
        >
          Cancelar
        </Button>
        <LoadingButton
          onClick={onSubmit}
          variant='contained'
          loading={useInviteUser.isPending}
          disabled={!selectedUser || !roleId}
          startIcon={<PersonAddRoundedIcon />}
        >
          Invitar usuario
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
});
