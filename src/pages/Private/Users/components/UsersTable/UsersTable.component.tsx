import { FC, useEffect } from 'react';

import {
  Box,
  Card,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  Paper,
  InputBase,
  CircularProgress,
  Stack
} from '@mui/material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import { IUser } from '../../../../../models/auth.model';
import { useTheme } from '@mui/material/';
import { Label } from '../../../../../components/ui';
import { useUsers } from '../../hooks/useUsers';
import SearchIcon from '@mui/icons-material/Search';
import { selectAuth } from '../../../../../redux';
import { useSelector } from 'react-redux';
import { useRestaurantStore } from '@/pages/Private/Common/store/restaurantStore';
import NiceModal from '@ebay/nice-modal-react';
import { EditUserRole } from '../EditUserRole.component';
import { RemoveUserFromRestaurant } from '../RemoveUserFromRestaurant/RemoveUserFromRestaurant.component';

export const TableRowUser: FC<{ user: IUser }> = ({ user }) => {
  const { user: currentUser } = useSelector(selectAuth);
  const restaurant = useRestaurantStore((state) => state.restaurant);
  const theme = useTheme();

  const openEditUserRoleModal = () => {
    NiceModal.show(EditUserRole, { user });
  };

  const openRemoveUserModal = () => {
    NiceModal.show(RemoveUserFromRestaurant, { user });
  };

  const userRole = user.restaurantRoles.find(
    (resRole) => resRole.restaurant.id === restaurant?.id
  )?.role;

  return (
    <TableRow hover>
      <TableCell>
        <Typography
          variant='body1'
          fontWeight='bold'
          color='text.primary'
          gutterBottom
          noWrap
        >
          {user.person.lastName} {user.person.firstName}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant='body2' color='text.secondary' noWrap>
          @{user.username}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant='body2' color='text.secondary' noWrap>
          {user.person.email}
        </Typography>
      </TableCell>
      <TableCell>
        <Label color='primary'>
          {userRole ? userRole.description : 'Sin rol'}
        </Label>
      </TableCell>
      <TableCell>
        <Label color={user.isActive ? 'success' : 'error'}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </Label>
      </TableCell>
      <TableCell align='right'>
        {user.id !== currentUser?.id && (
          <Stack direction='row' spacing={1} justifyContent='flex-end'>
            <Tooltip title='Editar rol' arrow>
              <IconButton
                aria-label='Editar rol de usuario'
                sx={{
                  '&:hover': {
                    background: theme.colors.primary.lighter
                  },
                  color: theme.palette.primary.main
                }}
                size='small'
                onClick={openEditUserRoleModal}
              >
                <EditTwoToneIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Remover del restaurante' arrow>
              <IconButton
                aria-label='Remover usuario del restaurante'
                sx={{
                  '&:hover': { background: theme.colors.error.lighter },
                  color: theme.palette.error.main
                }}
                size='small'
                onClick={openRemoveUserModal}
              >
                <DeleteTwoToneIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </TableCell>
    </TableRow>
  );
};

export const UserMobileCard: FC<{ user: IUser }> = ({ user }) => {
  const { user: currentUser } = useSelector(selectAuth);
  const restaurant = useRestaurantStore((state) => state.restaurant);

  const openEditUserRoleModal = () => {
    NiceModal.show(EditUserRole, { user });
  };

  const openRemoveUserModal = () => {
    NiceModal.show(RemoveUserFromRestaurant, { user });
  };

  const userRole = user.restaurantRoles.find(
    (resRole) => resRole.restaurant.id === restaurant?.id
  )?.role;

  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        mb: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <Stack spacing={1.5}>
        <Box display='flex' justifyContent='space-between' alignItems='flex-start'>
          <Box>
            <Typography variant='subtitle1' fontWeight={600} color='text.primary'>
              {user.person.lastName} {user.person.firstName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              @{user.username}
            </Typography>
          </Box>
          <Label color={user.isActive ? 'success' : 'error'}>
            {user.isActive ? 'Activo' : 'Inactivo'}
          </Label>
        </Box>

        <Typography variant='body2' color='text.secondary'>
          {user.person.email}
        </Typography>

        <Box display='flex' justifyContent='space-between' alignItems='center' pt={0.5}>
          <Label color='primary'>
            {userRole ? userRole.description : 'Sin rol'}
          </Label>

          {user.id !== currentUser?.id && (
            <Stack direction='row' spacing={1}>
              <Tooltip title='Editar rol'>
                <IconButton
                  aria-label='Editar rol'
                  size='small'
                  color='primary'
                  onClick={openEditUserRoleModal}
                >
                  <EditTwoToneIcon fontSize='small' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Remover del restaurante'>
                <IconButton
                  aria-label='Remover del restaurante'
                  size='small'
                  color='error'
                  onClick={openRemoveUserModal}
                >
                  <DeleteTwoToneIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Box>
      </Stack>
    </Card>
  );
};

interface Props {}

export const UsersTable: FC<Props> = () => {
  const {
    usersQuery,
    page,
    search,
    rowsPerPage,
    handleChangeSearch,
    handleChangePage,
    handleChangeRowsPerPage
  } = useUsers();

  const updateList = () => {
    usersQuery.refetch();
  };

  useEffect(() => {
    updateList();
  }, [page, rowsPerPage, search]);

  const hasUsers = usersQuery.data && usersQuery.data.count > 0;

  return (
    <Box sx={{ width: '100%', my: 2 }}>
      {/* Search Input Bar */}
      <Paper
        elevation={0}
        component='form'
        onSubmit={(e) => {
          e.preventDefault();
          updateList();
        }}
        sx={{
          p: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          mb: 2,
          maxWidth: 480
        }}
      >
        <InputBase
          type='text'
          onChange={handleChangeSearch}
          sx={{ ml: 1, flex: 1, fontSize: '0.95rem' }}
          placeholder='Buscar por nombre, usuario o email...'
          inputProps={{ 'aria-label': 'Buscar usuario' }}
          value={search}
        />
        <IconButton
          type='button'
          sx={{ p: '8px' }}
          aria-label='buscar'
          onClick={updateList}
        >
          {usersQuery.isPending ? (
            <CircularProgress size={20} />
          ) : (
            <SearchIcon fontSize='small' />
          )}
        </IconButton>
      </Paper>

      {usersQuery.isPending && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

      {/* Desktop / Tablet Table View */}
      <Card
        elevation={0}
        sx={{
          display: { xs: 'none', sm: 'block' },
          border: 1,
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <TableContainer>
          <Table size='medium'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Nombres y apellidos</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nombre de usuario</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align='right'>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hasUsers &&
                usersQuery.data.users.map((user) => (
                  <TableRowUser key={user.id} user={user} />
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {!usersQuery.isPending && !hasUsers && (
          <Box p={3}>
            <Typography variant='body1' align='center' color='text.secondary'>
              {search ? 'No se encontraron usuarios coincidentes con la búsqueda' : 'No hay usuarios registrados'}
            </Typography>
          </Box>
        )}

        <Box p={1} display='flex' justifyContent='flex-end'>
          <TablePagination
            component='div'
            count={usersQuery.data?.count || 0}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 30]}
            labelRowsPerPage='Filas por página:'
          />
        </Box>
      </Card>

      {/* Mobile Card View (<600px) */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        {hasUsers ? (
          usersQuery.data.users.map((user) => (
            <UserMobileCard key={user.id} user={user} />
          ))
        ) : (
          !usersQuery.isPending && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography variant='body2' color='text.secondary'>
                {search ? 'No se encontraron usuarios coincidentes' : 'No hay usuarios registrados'}
              </Typography>
            </Paper>
          )
        )}

        <Box display='flex' justifyContent='center' mt={2}>
          <TablePagination
            component='div'
            count={usersQuery.data?.count || 0}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 20]}
            labelRowsPerPage='Filas:'
          />
        </Box>
      </Box>
    </Box>
  );
};

