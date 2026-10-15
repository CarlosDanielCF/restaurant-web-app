import { FC } from 'react';
import { ICreateClient } from '../../../../models/client.model';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';

import {
  Box,
  Grid,
  Select,
  MenuItem,
  TextField,
  Typography,
  FormControl,
  InputLabel
} from '@mui/material';
import { TypeIdentification } from '../../../../models/common.model';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';

interface Props {
  client: ICreateClient;
  onSubmit: (form: ICreateClient) => void;
  loading: boolean;
  msg?: string;
}

export const FormClient: FC<Props> = ({ client, onSubmit, loading, msg }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control
  } = useForm<ICreateClient>({
    defaultValues: client
  });

  const identification = useWatch({ control, name: 'identification' });

  const lengthIdentification =
    identification?.type === TypeIdentification.CEDULA ? 10 : 13;

  return (
    <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField
            label='Nombres'
            fullWidth
            required
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            {...register('firstName', {
              required: 'Este campo es requerido',
              minLength: { value: 2, message: 'Mínimo 2 caracteres' },
              validate: (value: any) => {
                if (!isNaN(value)) {
                  return 'No se permiten números en este campo';
                }
              }
            })}
            onKeyDown={(e) => {
              const allowedCharsRegex = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ ]*$/;
              if (!allowedCharsRegex.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab') {
                e.preventDefault();
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label='Apellidos'
            fullWidth
            required
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
            {...register('lastName', {
              required: 'Este campo es requerido',
              minLength: { value: 2, message: 'Mínimo 2 caracteres' },
              validate: (value: any) => {
                if (!isNaN(Number(value))) {
                  return 'No se permiten números en este campo';
                }
                return true;
              }
            })}
            onKeyDown={(e) => {
              const allowedCharsRegex = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ ]*$/;
              if (!allowedCharsRegex.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab') {
                e.preventDefault();
              }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name='identification.type'
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormControl fullWidth>
                <InputLabel id='select-ident-type'>
                  Tipo de identificación
                </InputLabel>
                <Select
                  labelId='select-ident-type'
                  label='Tipo de identificación'
                  value={value || TypeIdentification.CEDULA}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={!!errors.identification?.type}
                >
                  <MenuItem value={TypeIdentification.CEDULA}>
                    Cédula
                  </MenuItem>
                  <MenuItem value={TypeIdentification.RUC}>RUC</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label='Número de identificación'
            fullWidth
            type='text'
            required
            error={!!errors.identification?.num}
            helperText={errors.identification?.num?.message || `Requiere ${lengthIdentification} dígitos`}
            {...register('identification.num', {
              required: 'Este campo es requerido',
              minLength: {
                value: lengthIdentification,
                message: `Debe tener ${lengthIdentification} dígitos`
              },
              maxLength: {
                value: lengthIdentification,
                message: `Máximo ${lengthIdentification} dígitos`
              }
            })}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label='Correo electrónico'
            type='email'
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email', {
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Formato de correo no válido'
              }
            })}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label='Número de teléfono'
            fullWidth
            type='tel'
            error={!!errors.numPhone}
            helperText={errors.numPhone?.message}
            {...register('numPhone', {
              minLength: { value: 7, message: 'Mínimo 7 caracteres' },
              maxLength: { value: 15, message: 'Máximo 15 caracteres' }
            })}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label='Dirección de entrega / domicilio'
            rows={2}
            fullWidth
            multiline
            error={!!errors.address}
            helperText={errors.address?.message}
            {...register('address', {
              minLength: { value: 2, message: 'Mínimo 2 caracteres' }
            })}
          />
        </Grid>

        <Grid item xs={12} display='flex' justifyContent='flex-end' mt={1}>
          <LoadingButton
            variant='contained'
            type='submit'
            loading={loading}
            size='large'
            startIcon={<SaveRoundedIcon />}
          >
            {msg || 'Guardar cliente'}
          </LoadingButton>
        </Grid>
      </Grid>
    </Box>
  );
};

