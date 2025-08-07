import { AccountCircle, Logout } from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from './hooks/useStore';
import { authService } from '../services/auth';
import logger from '../utils/logger';

export default function TopBar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [email, setAppState] = useStore(state => state.user?.email);
  const [sseConnection] = useStore(state => state.sseConnection);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async() => {
    try {
      console.log('Logging out...');
      await authService.logout();
      authService.removeToken();
      setAppState({
        user: null,
        accessToken: null,
        events: [],
        error: null,
      });
      navigate('/login');
    } catch (error) {
      logger.error({ message: 'Failed to logout', error });

      authService.removeToken();
      setAppState({
        user: null,
        accessToken: null,
        events: [],
        error: null,
      });
      navigate('/login');
    }
    handleClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Calendar App
        </Typography>
        {email &&
          <>
            <Typography variant='h6'>{email}</Typography>
            <Avatar sx={{ bgcolor: 'transparent', color: sseConnection ? 'green' : 'red' }}>
              <IconButton
                size="large"
                aria-label="profile"
                color='inherit'
                onClick={handleProfileClick}
              >

                <AccountCircle />
              </IconButton>
            </Avatar>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </>

        }

      </Toolbar>
    </AppBar>
  );
}
