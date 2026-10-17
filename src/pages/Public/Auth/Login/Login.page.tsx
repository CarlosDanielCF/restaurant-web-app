import '../../../../styles/clean-pos.css';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  Box,
  TextField,
  Typography,
  Link,
  Paper,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Visibility, VisibilityOff } from '@mui/icons-material';

import { useAppSelector } from '../../../../hooks';
import { IFormLogin, PublicRoutes } from '../../../../models';
import { onChecking, selectAuth } from '../../../../redux';
import { useLogin } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { SoftwareBrand } from '@/components/branding/SoftwareBrand';

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
    <Box className='pos-login'>
      <Paper className='pos-login-card' elevation={0}>
        <Box>
          {/* Header / Brand */}
          <Box mb={3}>
            <SoftwareBrand login />
            <Typography
              variant='body2'
              color='text.secondary'
              textAlign='center'
              mt={1}
            >
              Sistema de gestión para restaurantes
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

            <Typography
              variant='body2'
              color='text.secondary'
              textAlign='center'
              sx={{ mt: 2 }}
            >
              Acceso del equipo · Solicite su cuenta a administración.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
