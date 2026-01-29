import React from 'react';
import { SnackbarProvider } from 'notistack';
import { ErrorDialogProvider } from './app/providers/ErrorDialogContext';
import { AppRoutes } from './app/router';

const App: React.FC = () => (
  <ErrorDialogProvider>
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      autoHideDuration={4000}
    >
      <AppRoutes />
    </SnackbarProvider>
  </ErrorDialogProvider>
);

export default App;
