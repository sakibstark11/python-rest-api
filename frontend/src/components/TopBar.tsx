import { AccountCircle } from '@mui/icons-material';
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';

export default function TopBar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Calendar App
        </Typography>
        <IconButton
          size="large"
          edge="end"
          color="inherit"
          aria-label="profile"
        >
          <AccountCircle />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}