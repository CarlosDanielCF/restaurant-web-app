import { FC, ReactNode } from 'react';

import { Scrollbars } from 'react-custom-scrollbars-2';

import { Box, useTheme } from '@mui/material';

interface ScrollbarProps {
  className?: string;
  children?: ReactNode;
  height?: number | string;
  autoHeight?: boolean;
}

export const Scrollbar: FC<ScrollbarProps> = ({
  className,
  children,
  height,
  autoHeight = false,
  ...rest
}) => {
  const theme = useTheme();

  return (
    <Scrollbars
      style={{ width: '100%', height }}
      autoHeight={autoHeight}
      autoHide
      renderThumbVertical={() => {
        return (
          <Box
            sx={{
              width: 5,
              height: 5,
              background: 'rgba(15, 23, 42, 0.18)',
              borderRadius: '9999px',
              transition: theme.transitions.create(['background']),

              '&:hover': {
                background: 'rgba(13, 148, 136, 0.5)'
              }
            }}
          />
        );
      }}
      renderThumbHorizontal={() => {
        return (
          <Box
            sx={{
              width: 5,
              height: 5,
              background: 'rgba(15, 23, 42, 0.18)',
              borderRadius: '9999px',
              transition: theme.transitions.create(['background']),
              '&:hover': {
                background: 'rgba(13, 148, 136, 0.5)'
              }
            }}
          />
        );
      }}
      renderTrackHorizontal={() => {
        return (
          <Box
            sx={{
              position: 'absolute',
              height: 5,
              width: '100%',
              bottom: 0,
              left: 0,
              borderRadius: '9999px',
              background: theme.colors.alpha.black[10]
            }}
          />
        );
      }}
      {...rest}
    >
      {children}
    </Scrollbars>
  );
};
