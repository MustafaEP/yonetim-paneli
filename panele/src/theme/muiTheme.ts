// src/theme/muiTheme.ts
import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // ileride sendika kurumsal renge göre güncelleriz
    },
    secondary: {
      main: '#9c27b0',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default muiTheme;
