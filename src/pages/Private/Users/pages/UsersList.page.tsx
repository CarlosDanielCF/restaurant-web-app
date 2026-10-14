import { Button, Stack } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { resetActiveUser } from '../../../../redux';

import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import { UsersTable } from '../components/UsersTable/UsersTable.component';
import { TitlePage } from '../../components/TitlePage.component';

export const UsersList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const createUser = () => {
    dispatch(resetActiveUser());
    navigate('add');
  };


  return (
    <>
      <TitlePage
        title='Usuarios'
        action={
          <Stack gap={2} direction='row' alignItems='center'>
            <Button
              sx={{ mt: { xs: 2, md: 0 } }}
              variant='contained'
              startIcon={<AddTwoToneIcon fontSize='small' />}
              onClick={createUser}
            >
              Crear trabajador
            </Button>

          </Stack>
        }
      />

      <UsersTable />
    </>
  );
};
