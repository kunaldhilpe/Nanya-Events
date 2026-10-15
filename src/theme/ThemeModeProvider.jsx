import React, { createContext, useContext, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { buildTheme } from './theme';
import { useApp } from '../store/AppContext.jsx';

const ThemeModeContext = createContext({ mode: 'light', toggle: () => {} });
export const useThemeMode = () => useContext(ThemeModeContext);

export function ThemeModeProvider({ children }) {
  const { state, dispatch } = useApp();
  const mode = state.settings.themeMode;
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const value = useMemo(
    () => ({ mode, toggle: () => dispatch({ type: 'SET_SETTING', key: 'themeMode', value: mode === 'light' ? 'dark' : 'light' }) }),
    [mode, dispatch]
  );
  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
