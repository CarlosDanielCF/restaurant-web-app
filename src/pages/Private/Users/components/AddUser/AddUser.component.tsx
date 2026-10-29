import { TypeIdentification } from '../../../../../models/common.model';
import { CreateUser } from '../../models/create-user.model';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Box,
  Stack
} from '@mui/material';
import { FormUser } from '../FormUser.component';
import { TitlePage } from '../../../components/TitlePage.component';
import { useCreateUser } from '../../hooks/useUsers';

const initialUser: CreateUser = {
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  role: {
    name: 'MOZO'
  },
  numPhone: '',
  identification: {
    type: TypeIdentification.CEDULA,
    num: ''
  }
};

export const AddUser = () => {
  const user = initialUser;

  const { isPending, mutateAsync } = useCreateUser();

  const navigate = useNavigate();

  async function onSubmit(form: CreateUser) {
    const { identification, role, ...dataUser } = form;

    if (form.numPhone === '') {
      delete dataUser.numPhone;
    }
    if (form.email === '') {
      delete dataUser.email;
    }

    const newUser = {
      ...dataUser,
      typeIdentification: identification.type,
      numberIdentification: identification.num,
      rol: form.role.name
    };

    const created = await mutateAsync(newUser);
    navigate(`/users/edit/${created.id}`);
  }

  return (
    <>
      <TitlePage title='Agregar usuario' />

      <Box width={{ xs: '100%', md: '570px' }} mx='auto' mb={4} mt={4}>
        <Card sx={{ p: 3 }}>
          <Stack gap={1} mb={3}>
            <Typography variant='h4'>Informacion del usuario</Typography>
          </Stack>
          <FormUser
            user={user}
            onSubmit={onSubmit}
            loading={isPending}
            isNew={true}
          />
        </Card>
      </Box>
    </>
  );
};
