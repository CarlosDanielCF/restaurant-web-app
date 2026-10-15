import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  Grid,
  Box,
  TextField,
  Typography,
  Link,
  Paper,
  Stack,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Visibility, VisibilityOff, RestaurantMenu } from '@mui/icons-material';

import { useAppSelector } from '../../../../hooks';
import { IFormLogin, PublicRoutes } from '../../../../models';
import { onChecking, selectAuth } from '../../../../redux';
import { useLogin } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { getEnvVariables } from '@/helpers';

const { VITE_APP_NAME } = getEnvVariables();

const initialForm: IFormLogin = {
  username: '',
  password: ''
};

export const LoginPage = () => {
  const loginMutation = useLogin();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<IFormLogin>({
    defaultValues: initialForm
  });

  const { error, status } = useAppSelector(selectAuth);

  const handleLogin = (form: IFormLogin) => {
    dispatch(onChecking());
    loginMutation.mutate(form);
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const isSubmitting = status === 'checking' || loginMutation.isPending;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <Grid container component='main' sx={{ flex: 1, minHeight: '100vh' }}>
        {/* Visual Brand Image Column */}
        <Grid
          item
          xs={false}
          sm={4}
          md={6}
          lg={7}
          sx={{
            position: 'relative',
            backgroundImage:
              'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80)',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'background.default',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 4
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'linear-gradient(180deg, rgba(15, 118, 110, 0.4) 0%, rgba(15, 23, 42, 0.85) 100%)',
              zIndex: 1
            }}
          />
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              color: 'common.white',
              mb: 2
            }}
          >
            <Box display='flex' alignItems='center' gap={1.5} mb={1}>
              <RestaurantMenu sx={{ fontSize: 32, color: '#5eead4' }} />
              <Typography variant='h3' fontWeight={700} color='inherit'>
                {VITE_APP_NAME || 'Restaurante App'}
              </Typography>
            </Box>
            <Typography variant='body1' sx={{ opacity: 0.9, maxWidth: 480 }}>
              Sistema integral de gestión de carta, pedidos, mesas y personal
              para una atención eficiente y profesional.
            </Typography>
          </Box>
        </Grid>

        {/* Form Column */}
        <Grid
          item
          xs={12}
          sm={8}
          md={6}
          lg={5}
          component={Paper}
          elevation={0}
          square
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'background.paper',
            p: { xs: 3, sm: 5, md: 6 }
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 420,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header / Brand */}
            <Box mb={3}>
              <Box display='flex' alignItems='center' gap={1} mb={1}>
                <RestaurantMenu color='primary' sx={{ fontSize: 28 }} />
                <Typography variant='h5' fontWeight={700} color='primary.main'>
                  {VITE_APP_NAME || 'Restaurante'}
                </Typography>
              </Box>
              <Typography
                component='h1'
                variant='h4'
                fontWeight={700}
                color='text.primary'
                gutterBottom
              >
                Bienvenido
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Ingrese sus credenciales para acceder al sistema.
              </Typography>
            </Box>

            {/* Error Message */}
            {!!error && (
              <Alert
                severity='error'
                variant='filled'
                sx={{ mb: 2, borderRadius: 1.5 }}
              >
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box
              component='form'
              noValidate
              onSubmit={handleSubmit(handleLogin)}
              sx={{ width: '100%' }}
            >
              <TextField
                margin='normal'
                required
                fullWidth
                id='username'
                label='Nombre de usuario'
                autoComplete='username'
                error={!!errors.username}
                helperText={errors.username?.message}
                disabled={isSubmitting}
                {...register('username', {
                  required: 'Por favor, ingrese su nombre de usuario',
                  minLength: {
                    value: 2,
                    message: 'El usuario debe tener al menos 2 caracteres'
                  }
                })}
                autoFocus
              />

              <TextField
                margin='normal'
                required
                fullWidth
                id='password'
                label='Contraseña'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isSubmitting}
                {...register('password', {
                  required: 'Por favor, ingrese su contraseña',
                  minLength: {
                    value: 2,
                    message: 'La contraseña debe tener al menos 2 caracteres'
                  }
                })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        aria-label={
                          showPassword ? 'Ocultar contraseña' : 'Ver contraseña'
                        }
                        onClick={handleTogglePassword}
                        edge='end'
                        size='small'
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize='small' />
                        ) : (
                          <Visibility fontSize='small' />
                        )}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Box display='flex' justifyContent='flex-end' mt={1}>
                <Link
                  href={'/' + PublicRoutes.FORGOT_PASSWORD}
                  variant='body2'
                  underline='hover'
                  color='primary.main'
                >
                  ¿Olvidó su contraseña?
                </Link>
              </Box>

              <LoadingButton
                type='submit'
                fullWidth
                variant='contained'
                size='large'
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.25,
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: (theme) => theme.shadows[2]
                }}
                loading={isSubmitting}
              >
                Iniciar sesión
              </LoadingButton>

              <Stack
                spacing={0.5}
                direction='row'
                alignItems='center'
                justifyContent='center'
                sx={{ my: 2 }}
              >
                <Typography variant='body2' color='text.secondary'>
                  ¿No tiene una cuenta?
                </Typography>
                <Link
                  href='/auth/register'
                  variant='body2'
                  fontWeight={600}
                  underline='hover'
                  color='primary.main'
                >
                  Regístrese aquí
                </Link>
              </Stack>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginPage;
