import { ChangeEvent, FC, useEffect, useState } from 'react';

import {
  Box,
  Card,
  Checkbox,
  CircularProgress,
  IconButton,
  InputBase,
  LinearProgress,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material/';

import { useDispatch } from 'react-redux';
import { useFetchAndLoad } from '../../../../../hooks';
import {
  loadClients,
  setActiveClient,
  updateClient
} from '../../../../../redux/slices/clients/clients.slice';
import { getClients } from '../../services';

import { IClient } from '../../../../../models/client.model';

import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import { useNavigate } from 'react-router-dom';
import {
  statusModalDeleteClient,
  updateClient as updateClientS
} from '../../services/clients.service';
import { useSnackbar } from 'notistack';
import { useClients } from '../../hooks/useClients';
import SearchIcon from '@mui/icons-material/Search';
import { Label } from '../../../../../components/ui';

interface Props {
  clientFound?: IClient;
}

export const TableRowClient: FC<{ client: IClient }> = ({ client }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const editClient = (client: IClient) => {
    dispatch(setActiveClient(client));
    navigate('edit');
  };

  return (
    <TableRow hover>
      <TableCell>
        <Typography
          variant='body1'
          fontWeight='bold'
          color='text.primary'
          noWrap
        >
          {client.person?.lastName} {client.person?.firstName}
        </Typography>
      </TableCell>
      <TableCell>
        <Label color='info'>
          {client.person?.identification?.type || 'Cédula'}
        </Label>
      </TableCell>
      <TableCell>
        <Typography variant='body2' color='text.secondary' noWrap>
          {client.person?.identification?.num || '—'}
        </Typography>
      </TableCell>
      <TableCell sx={{ maxWidth: 220 }}>
        <Typography variant='body2' color='text.secondary' noWrap title={client.address}>
          {client.address || '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant='body2' color='text.secondary' noWrap>
          {client.person?.email || '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <Label color={client.isActive ? 'success' : 'error'}>
          {client.isActive ? 'Activo' : 'Inactivo'}
        </Label>
      </TableCell>
      <TableCell align='right'>
        <Tooltip title='Editar cliente' arrow>
          <IconButton
            aria-label='Editar cliente'
            sx={{
              '&:hover': {
                background: theme.colors.primary.lighter
              },
              color: theme.palette.primary.main
            }}
            size='small'
            onClick={() => editClient(client)}
          >
            <EditTwoToneIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

export const ClientMobileCard: FC<{ client: IClient }> = ({ client }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const editClient = (client: IClient) => {
    dispatch(setActiveClient(client));
    navigate('edit');
  };

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
      <Box display='flex' justifyContent='space-between' alignItems='flex-start' mb={1}>
        <Box>
          <Typography variant='subtitle1' fontWeight={600} color='text.primary'>
            {client.person?.lastName} {client.person?.firstName}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {client.person?.identification?.type}: {client.person?.identification?.num || 'Sin número'}
          </Typography>
        </Box>
        <Label color={client.isActive ? 'success' : 'error'}>
          {client.isActive ? 'Activo' : 'Inactivo'}
        </Label>
      </Box>

      {client.address && (
        <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
          📍 {client.address}
        </Typography>
      )}

      {client.person?.email && (
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
          ✉️ {client.person.email}
        </Typography>
      )}

      <Box display='flex' justifyContent='flex-end' pt={0.5}>
        <Tooltip title='Editar cliente'>
          <IconButton
            size='small'
            color='primary'
            aria-label='Editar cliente'
            onClick={() => editClient(client)}
          >
            <EditTwoToneIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};

export const ClientsTable: FC<Props> = ({ clientFound }) => {
  const {
    clientsQuery,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    handleChangeSearch,
    search
  } = useClients();

  const hasClients =
    clientFound ||
    (clientsQuery.data &&
      clientsQuery.data.clients &&
      clientsQuery.data.clients.length > 0);

  return (
    <Box sx={{ width: '100%', my: 2 }}>
      {/* Search Input Bar */}
      <Paper
        elevation={0}
        component='form'
        onSubmit={(e) => e.preventDefault()}
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
          placeholder='Buscar por nombre, cédula o RUC...'
          inputProps={{ 'aria-label': 'Buscar cliente' }}
          value={search}
        />
        <IconButton type='button' sx={{ p: '8px' }} aria-label='buscar cliente'>
          {clientsQuery.isPending ? (
            <CircularProgress size={20} />
          ) : (
            <SearchIcon fontSize='small' />
          )}
        </IconButton>
      </Paper>

      {clientsQuery.isPending && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

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
                <TableCell sx={{ fontWeight: 600 }}>Tipo identificación</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Número identificación</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Dirección</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Correo electrónico</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align='right'>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientFound ? (
                <TableRowClient client={clientFound} />
              ) : (
                clientsQuery.data?.clients?.map((client) => (
                  <TableRowClient client={client} key={client.id} />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!clientsQuery.isPending && !hasClients && (
          <Box p={4} textAlign='center'>
            <Typography variant='body1' color='text.secondary'>
              {search
                ? 'No se encontraron clientes que coincidan con la búsqueda.'
                : 'No hay clientes registrados en el sistema.'}
            </Typography>
          </Box>
        )}

        <Box p={1} display='flex' justifyContent='flex-end'>
          <TablePagination
            component='div'
            count={clientsQuery.data?.length || 0}
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
        {clientFound ? (
          <ClientMobileCard client={clientFound} />
        ) : hasClients ? (
          clientsQuery.data?.clients?.map((client) => (
            <ClientMobileCard client={client} key={client.id} />
          ))
        ) : (
          !clientsQuery.isPending && (
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
                {search
                  ? 'No se encontraron clientes coincidentes.'
                  : 'No hay clientes registrados en el sistema.'}
              </Typography>
            </Paper>
          )
        )}

        <Box display='flex' justifyContent='center' mt={2}>
          <TablePagination
            component='div'
            count={clientsQuery.data?.length || 0}
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
