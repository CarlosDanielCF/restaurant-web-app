import { FC } from 'react';

import { Circle, TableRestaurantOutlined } from '@mui/icons-material';
import {
  Card,
  CardActionArea,
  Box,
  Typography,
  Chip,
  Stack
} from '@mui/material';
import { ITable } from '../../../../../../models';
import { useSelector } from 'react-redux';
import { selectOrders } from '../../../../../../redux';
import { DrawerOrder } from '../../../components';
import NiceModal from '@ebay/nice-modal-react';
import { NewOrderModal } from '../../../components/modals/NewOrderModal.component';

interface Props {
  table: ITable;
  handleClickTable: (table: ITable) => void;
}

export const Table: FC<Props> = ({ table, handleClickTable }) => {
  const { orders } = useSelector(selectOrders);

  const ordersTable = orders.filter((order) => order.table?.id === table.id);

  const isAvailable = ordersTable.length === 0;

  const showOrdersTableDrawer = () => NiceModal.show(DrawerOrder, { table });

  const handleClick = () => {
    if (table.isAvailable) {
      NiceModal.show(NewOrderModal, { defaultTable: table });
    } else {
      handleClickTable(table);
    }
  };

  return (
    <Card
      sx={{
        border: '1.5px solid',
        borderColor: isAvailable ? 'divider' : 'primary.main',
        borderRadius: 2,
        backgroundColor: isAvailable ? 'background.paper' : '#f0fdfa',
        boxShadow: 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2,
          borderColor: 'primary.main'
        }
      }}
    >
      <CardActionArea
        onClick={handleClick}
        aria-label={`Mesa ${table.name}, ${isAvailable ? 'Disponible' : `${ordersTable.length} pedidos`}`}
        sx={{
          height: '100%',
          minHeight: '90px',
          p: 2
        }}
      >
        <Stack direction='column' spacing={1} justifyContent='space-between' height='100%'>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Mesa {table.name}
            </Typography>
            <Circle
              sx={{
                fontSize: 10,
                color: isAvailable ? 'success.main' : 'warning.main'
              }}
            />
          </Box>

          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='caption' color='text.secondary'>
              {table.chairs ? `${table.chairs} asientos` : ''}
            </Typography>

            {ordersTable.length > 0 ? (
              <Chip
                label={`${ordersTable.length} ${ordersTable.length === 1 ? 'pedido' : 'pedidos'}`}
                size='small'
                color='primary'
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            ) : (
              <Typography variant='caption' sx={{ color: 'success.main', fontWeight: 500 }}>
                Libre
              </Typography>
            )}
          </Box>
        </Stack>
      </CardActionArea>
    </Card>
  );
};
