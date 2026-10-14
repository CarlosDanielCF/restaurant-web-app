import { FC, ReactNode } from 'react';
import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

export const EmptyState: FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  action,
  children
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        py: 6,
        px: 3,
        textAlign: 'center',
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        borderRadius: 2,
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? '#f8fafc' : 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        my: 2
      }}
    >
      <Box
        sx={{
          color: 'text.secondary',
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& .MuiSvgIcon-root': {
            fontSize: 48,
            color: 'primary.light',
            opacity: 0.8
          }
        }}
      >
        {icon || <InboxOutlinedIcon />}
      </Box>

      <Typography variant='h6' color='text.primary' fontWeight={600} gutterBottom>
        {title}
      </Typography>

      {description && (
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ maxWidth: 420, mb: (actionText || action || children) ? 2.5 : 0 }}
        >
          {description}
        </Typography>
      )}

      {action}

      {actionText && onAction && (
        <Button
          variant='contained'
          color='primary'
          size='small'
          onClick={onAction}
          startIcon={actionIcon}
          sx={{ mt: 1 }}
        >
          {actionText}
        </Button>
      )}

      {children}
    </Paper>
  );
};

export default EmptyState;
