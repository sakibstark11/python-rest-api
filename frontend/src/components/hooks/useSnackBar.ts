import { useStore } from './useStore';

export function useSnackBar() {
  const [setState] = useStore();

  const showSnackBar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setState({
      snackbar: {
        open: true,
        message,
        severity,
      },
    });
  };

  const showSuccess = (message: string) => showSnackBar(message, 'success');
  const showError = (message: string) => showSnackBar(message, 'error');
  const showInfo = (message: string) => showSnackBar(message, 'info');
  const showWarning = (message: string) => showSnackBar(message, 'warning');

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}
