import { ChangeEvent, FC } from 'react';

import {
  Paper,
  InputBase,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Close, Search } from '@mui/icons-material';

interface Props {
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  search: () => void;
  placeholder: string;
  loading?: boolean;
  value?: string;
  reset?: () => void;
}

export const InputSearch: FC<Props> = ({
  handleChange,
  search,
  placeholder,
  loading = false,
  value,
  reset
}) => {
  return (
    <>
      <Paper
        component='form'
        elevation={0}
        sx={{
          p: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          backgroundColor: 'background.paper',
          border: '1.5px solid',
          borderColor: 'divider',
          borderRadius: 2,
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(13, 148, 136, 0.14)'
          }
        }}
      >
        <InputBase
          type='text'
          onChange={handleChange}
          sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }}
          placeholder={placeholder}
          inputProps={{ 'aria-label': 'Buscar' }}
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
          value={value}
        />

        {value && reset && value?.length > 0 && (
          <IconButton onClick={reset} size='small' sx={{ p: 0.5, color: 'text.secondary' }}>
            <Close fontSize='small' />
          </IconButton>
        )}

        <IconButton
          type='button'
          size='small'
          sx={{
            p: '6px',
            color: 'primary.main',
            '&:hover': { bgcolor: 'action.hover' }
          }}
          aria-label='search'
          onClick={search}
        >
          {loading ? <CircularProgress size={18} /> : <Search fontSize='small' />}
        </IconButton>
      </Paper>
    </>
  );
};
