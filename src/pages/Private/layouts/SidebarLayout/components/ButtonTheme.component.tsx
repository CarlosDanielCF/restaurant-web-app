import { useContext } from 'react';
import {
  LightModeOutlined,
  DarkModeOutlined
} from '@mui/icons-material';
import {
  IconButton,
  Tooltip
} from '@mui/material';
import { ThemeContext } from '../../../../../theme/ThemeProvider';

enum ThemeName {
  PureLightTheme = 'PureLightTheme',
  NebulaFighterTheme = 'NebulaFighterTheme'
}

export const ButtonTheme = () => {
  const curThemeName =
    localStorage.getItem('appTheme') || ThemeName.PureLightTheme;

  const setNameTheme = useContext(ThemeContext);

  return (
    <Tooltip
      title={
        curThemeName === ThemeName.NebulaFighterTheme
          ? 'Modo claro'
          : 'Modo oscuro'
      }
    >
      <IconButton
        size='small'
        onClick={() => {
          setNameTheme(
            curThemeName === ThemeName.NebulaFighterTheme
              ? ThemeName.PureLightTheme
              : ThemeName.NebulaFighterTheme
          );
        }}
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          color: 'text.secondary',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: '#f0fdfa',
            borderColor: '#99f6e4',
            color: 'primary.main'
          }
        }}
      >
        {curThemeName === ThemeName.NebulaFighterTheme ? (
          <LightModeOutlined fontSize='small' />
        ) : (
          <DarkModeOutlined fontSize='small' />
        )}
      </IconButton>
    </Tooltip>
  );
};
