import { Typography, Box } from '@mui/material';
import { Label } from '../../../components/ui';
import { FC } from 'react';

interface Props {
  status: boolean;
}

export const LabelStatus: FC<Props> = ({ status }) => {
  return (
    <Label color={status ? 'success' : 'error'}>
      <Box display='inline-flex' alignItems='center' gap={0.75}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: status ? '#10b981' : '#ef4444'
          }}
        />
        <Typography
          variant='caption'
          fontWeight={700}
          sx={{ fontSize: '0.6875rem', lineHeight: 1 }}
        >
          {status ? 'Activo' : 'Inactivo'}
        </Typography>
      </Box>
    </Label>
  );
};
