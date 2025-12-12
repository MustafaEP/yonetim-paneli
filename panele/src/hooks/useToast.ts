// src/hooks/useToast.ts
import { useSnackbar } from 'notistack';

export const useToast = () => {
  const { enqueueSnackbar } = useSnackbar();

  const showSuccess = (message: string) => {
    enqueueSnackbar(message, {
      variant: 'success',
      autoHideDuration: 3000,
    });
  };

  const showError = (message: string) => {
    enqueueSnackbar(message, {
      variant: 'error',
      autoHideDuration: 4000,
    });
  };

  const showWarning = (message: string) => {
    enqueueSnackbar(message, {
      variant: 'warning',
      autoHideDuration: 3500,
    });
  };

  const showInfo = (message: string) => {
    enqueueSnackbar(message, {
      variant: 'info',
      autoHideDuration: 3000,
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

