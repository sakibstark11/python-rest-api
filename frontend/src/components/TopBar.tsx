import { AccountCircle, Logout } from '@mui/icons-material';
import {
  AppBar,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../context/AppContext';
import { AuthService } from '../services/auth';
import logger from '../utils/logger';
import axios from 'axios';

export default function TopBar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [email, setAppState] = useAppStore(state => state.user?.email);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      AuthService.removeToken();
      setAppState({
        user: null,
        accessToken: null,
        events: [],
        error: null,
      });
      navigate('/login');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const requestId = error.response?.headers?.['x-request-id'];
        logger.error({ 
          message: 'Failed to logout', 
          error: error.response?.data?.error?.message || error.message,
          request_id: requestId,
        });
      } else {
        logger.error({ message: 'Failed to logout', error });
      }
      AuthService.removeToken();
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
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="profile"
              onClick={handleProfileClick}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem>
                <ListItemIcon onClick={handleLogout}>
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
