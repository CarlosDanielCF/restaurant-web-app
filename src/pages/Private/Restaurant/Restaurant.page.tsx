import { MoreOptions } from '@/components/operational/MoreOptions';
import { Button, Stack } from '@mui/material';
import { QrCode2Outlined } from '@mui/icons-material';
import { SecuritySettings } from './components/SecuritySettings.component';
import { TitlePage } from '../components';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Box,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { useForm } from 'react-hook-form';
import { UpdateRestaurantDto } from '../Reports/dto/update-restaurant.dto';
import { useUpdateRestaurant } from './hooks/useRestaurant';
import { LoadingButton } from '@mui/lab';
import { FormRestaurantLogo } from './components/FormRestaurantLogo.component';
import { ProductionAreasList } from './components/ProductionAreasList.component';

const Restaurant = () => {
  const { restaurant } = useRestaurantStore((state) => state);

  const updateRestaurantMutation = useUpdateRestaurant();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<UpdateRestaurantDto>({
    defaultValues: {
      name: restaurant?.name,
      tradeName: restaurant?.tradeName || '',
      capacity: restaurant?.capacity,
      address: restaurant?.address,
      identification: restaurant?.identification,
      phone: restaurant?.phone,
      email: restaurant?.email
    }
  });

  const onSubmit = (data: UpdateRestaurantDto) => {
    updateRestaurantMutation.mutate(data, { onSuccess: () => reset(data) });
  };

  return (
    <Container maxWidth='lg' className='pos-settings' sx={{ pb: 6 }}>
      <TitlePage title='Configuración del Restaurante' />

      <Stack direction='row' gap={1} flexWrap='wrap' mb={2}>
        <Button
          startIcon={<StorefrontOutlinedIcon />}
          onClick={() =>
            document
              .getElementById('restaurant-identity')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          Datos e identidad
        </Button>
        <Button
          startIcon={<QrCode2Outlined />}
          onClick={() =>
            document
              .getElementById('restaurant-qr')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          QR Yape y zona horaria
        </Button>
      </Stack>
      <Box id='restaurant-identity' sx={{ scrollMarginTop: 12 }} />
      {restaurant ? (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* General Information Card */}
          <Grid item xs={12} md={8}>
            <Card
              elevation={0}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <CardHeader
                avatar={<StorefrontOutlinedIcon color='primary' />}
                title='Información General'
                subheader='Datos de contacto e identidad del restaurante'
                titleTypographyProps={{ variant: 'h5', fontWeight: 600 }}
                action={
                  isDirty ? (
                    <Chip
                      label='Cambios sin guardar'
                      color='warning'
                      size='small'
                      sx={{ mt: 1 }}
                    />
                  ) : null
                }
              />
              <Divider />
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label='Nombre del restaurante'
                        type='text'
                        fullWidth
                        required
                        {...register('name', {
                          required: 'El nombre es obligatorio'
                        })}
                        helperText={
                          errors.name?.message || 'Nombre breve del restaurante'
                        }
                        error={!!errors.name}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label='Nombre comercial'
                        fullWidth
                        {...register('tradeName', { maxLength: 160 })}
                        helperText='Identidad comercial del restaurante, independiente de Point Restaurant'
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label='RUC / NIT / CIF'
                        type='text'
                        fullWidth
                        required
                        {...register('identification', {
                          required: 'La identificación fiscal es requerida'
                        })}
                        helperText={
                          errors.identification?.message ||
                          'Identificación tributaria'
                        }
                        error={!!errors.identification}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label='Teléfono de contacto'
                        type='tel'
                        fullWidth
                        required
                        {...register('phone', {
                          required: 'El teléfono es obligatorio'
                        })}
                        helperText={
                          errors.phone?.message ||
                          'Número de atención al cliente'
                        }
                        error={!!errors.phone}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label='Correo electrónico'
                        type='email'
                        fullWidth
                        required
                        {...register('email', {
                          required: 'El correo electrónico es requerido'
                        })}
                        helperText={
                          errors.email?.message ||
                          'Email de contacto administrativo'
                        }
                        error={!!errors.email}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label='Dirección fiscal y/o sucursal'
                        type='text'
                        fullWidth
                        required
                        {...register('address', {
                          required: 'La dirección es obligatoria'
                        })}
                        helperText={
                          errors.address?.message ||
                          'Ubicación física del restaurante'
                        }
                        error={!!errors.address}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label='Capacidad máxima (aforo)'
                        type='number'
                        fullWidth
                        required
                        {...register('capacity', {
                          required: 'La capacidad es obligatoria',
                          min: {
                            value: 1,
                            message: 'La capacidad debe ser mayor a 0'
                          },
                          valueAsNumber: true
                        })}
                        helperText={
                          errors.capacity?.message ||
                          'Cantidad de comensales simultáneos'
                        }
                        error={!!errors.capacity}
                      />
                    </Grid>
                  </Grid>

                  <Box display='flex' justifyContent='flex-end' mt={3}>
                    <LoadingButton
                      type='submit'
                      variant='contained'
                      color='primary'
                      startIcon={<SaveIcon />}
                      loading={updateRestaurantMutation.isPending}
                      disabled={!isDirty || updateRestaurantMutation.isPending}
                    >
                      Guardar información
                    </LoadingButton>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Logo Card */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <CardHeader
                avatar={<ImageOutlinedIcon color='primary' />}
                title='Identidad Visual'
                subheader='Logo del restaurante'
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              />
              <Divider />
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <FormRestaurantLogo restaurant={restaurant} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Alert severity='warning' sx={{ my: 3 }}>
          No se ha configurado un restaurante todavía.
        </Alert>
      )}

      <Box
        id='restaurant-qr'
        className='pos-settings-security'
        sx={{ scrollMarginTop: 12 }}
      >
        <SecuritySettings />
      </Box>
      <MoreOptions title='Áreas de producción'>
        <ProductionAreasList />
      </MoreOptions>
    </Container>
  );
};

export default Restaurant;
