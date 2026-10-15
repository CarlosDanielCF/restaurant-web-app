import { Add, ArrowBack, CloseRounded, SaveRounded } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Grid,
  Button,
  Typography,
  TextField,
  Container,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useFetchAndLoad } from '../../../../../hooks';
import { ICreateTable } from '../../../../../models';
import {
  addTable,
  selectTables,
  setActiveTable,
  updateTable
} from '../../../../../redux/slices/tables';
import {
  createTable,
  updateTable as updateTableS
} from '../../services/tables.service';

import { useForm } from 'react-hook-form';
import { TitlePage } from '../../../components/TitlePage.component';
import { useUpdateTable } from '../../hooks/useTables';
import { UpdateTableDto } from '../../dto/table.dto';

const initialTable: ICreateTable = {
  name: '',
  description: '',
  chairs: 4
};

export const EditTable = () => {
  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();

  const dispatch = useDispatch();

  const { loading, callEndpoint, cancelEndpoint } = useFetchAndLoad();

  const updateTableMutation = useUpdateTable();

  const { activeTable } = useSelector(selectTables);

  let table: ICreateTable;

  if (activeTable) {
    const { id, isAvailable, ...restTable } = activeTable!;
    table = restTable;
  } else {
    table = initialTable;
  }

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ICreateTable>({
    defaultValues: table
  });

  const isSaving = loading || updateTableMutation.isPending;

  const onSubmit = async (form: ICreateTable) => {
    if (activeTable) {
      const data: UpdateTableDto = {
        id: activeTable.id,
        isAvailable: activeTable.isAvailable,
        name: form.name,
        description: form.description,
        chairs: form.chairs
      };

      updateTableMutation.mutate(data, {
        onSuccess: () => {
          navigate('/tables');
        }
      });
    } else {
      await callEndpoint(createTable(form))
        .then((resp) => {
          const { data } = resp;
          dispatch(addTable(data));
          dispatch(setActiveTable(data));
          enqueueSnackbar('Mesa creada correctamente', { variant: 'success' });
          navigate('/tables');
        })
        .catch((err) => {
          console.log(err);
          enqueueSnackbar('Error al crear la mesa', { variant: 'error' });
        });
    }
  };

  return (
    <>
      <TitlePage
        title={`${activeTable ? 'Editar' : 'Crear'} mesa`}
        action={
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/tables')}
            variant='outlined'
            size='small'
          >
            Volver a mesas
          </Button>
        }
      />

      <Card sx={{ maxWidth: 480, margin: '0 auto', boxShadow: 1, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  label='Nombre o número de la mesa'
                  placeholder='Ej: 1, 2, Terraza A'
                  type='text'
                  fullWidth
                  {...register('name', {
                    required: 'El nombre o número de la mesa es requerido'
                  })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label='Descripción o ubicación (opcional)'
                  placeholder='Ej: Planta baja, junto a la ventana'
                  type='text'
                  fullWidth
                  {...register('description')}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label='Número de asientos'
                  type='number'
                  fullWidth
                  inputProps={{ min: 1, max: 50 }}
                  {...register('chairs', {
                    required: 'El número de asientos es requerido',
                    min: { value: 1, message: 'Debe tener al menos 1 asiento' },
                    max: { value: 50, message: 'Máximo 50 asientos' },
                    valueAsNumber: true
                  })}
                  error={!!errors.chairs}
                  helperText={errors.chairs?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction='row' spacing={2} justifyContent='space-between' mt={2}>
                  <Button
                    variant='outlined'
                    onClick={() => navigate('/tables')}
                    disabled={isSaving}
                    startIcon={<CloseRounded />}
                  >
                    Cancelar
                  </Button>
                  <LoadingButton
                    variant='contained'
                    type='submit'
                    loading={isSaving}
                    startIcon={activeTable ? <SaveRounded /> : <Add />}
                  >
                    {activeTable ? 'Guardar cambios' : 'Crear mesa'}
                  </LoadingButton>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </>
  );
};
