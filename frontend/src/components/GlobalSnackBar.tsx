import { Snackbar, Alert } from '@mui/material';
import { useStore } from './hooks/useStore';

export default function GlobalSnackBar() {
  const [snackbar, setState] = useStore(state => state.snackbar);

  const handleClose = () => {
    setState({
      snackbar: {
        ...snackbar,
        open: false,
      },
    });
  };

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}
