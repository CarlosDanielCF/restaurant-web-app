import { VolumeUp, VolumeOff } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useNotificationSound } from '../../../../../hooks';

/**
 * Sound toggle button component for the header
 * Allows users to mute/unmute notification sounds
 * @version 1.0 2026-01-07
 */
export const ButtonSound = () => {
  const { isMuted, toggleMute } = useNotificationSound(0.5);

  return (
    <Tooltip
      title={
        isMuted
          ? 'Activar sonido de notificaciones'
          : 'Silenciar notificaciones'
      }
    >
      <IconButton
        onClick={toggleMute}
        size='small'
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          color: isMuted ? 'text.disabled' : 'text.secondary',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: '#f0fdfa',
            borderColor: '#99f6e4',
            color: 'primary.main'
          }
        }}
      >
        {isMuted ? (
          <VolumeOff fontSize='small' />
        ) : (
          <VolumeUp fontSize='small' />
        )}
      </IconButton>
    </Tooltip>
  );
};
