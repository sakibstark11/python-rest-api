import type { ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import { AccountCircle, ExitToApp } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { AuthService } from '../services/auth';

type LayoutProps = {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [state, actions] = useStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    AuthService.logout();
    actions.setUser(null);
    actions.setEvents([]);
    navigate('/login');
    handleClose();
  };

  const handleProfile = () => {
    // Navigate to profile page when implemented
    handleClose();
  };

  return (
    <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Calendar App
          </Typography>

          {state.user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                color="inherit" 
                onClick={() => navigate('/events/create')}
              >
                Create Event
              </Button>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {state.user.first_name[0]}{state.user.last_name[0]}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleProfile}>
                    <AccountCircle sx={{ mr: 1 }} />
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ExitToApp sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          ) : (
            <Box>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Box>
    </Box>
  );
};