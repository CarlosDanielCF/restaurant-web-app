import { Button } from '@mui/material';
import { FC } from 'react';

interface Props {
  actionClick?: () => void;
}

export const BtnCancel: FC<Props> = ({ actionClick }) => {
  const cancel = () => {
    actionClick && actionClick();
  };

  return (
    <Button
      color='inherit'
      variant='outlined'
      onClick={() => cancel()}
      sx={{
        borderRadius: 2,
        borderColor: 'divider',
        color: 'text.secondary',
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'text.secondary',
          color: 'text.primary'
        }
      }}
    >
      Cancelar
    </Button>
  );
};
