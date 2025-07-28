import { Box, Paper } from '@mui/material';
import React from 'react';
import { useLocation } from 'react-router-dom';
import TopBar from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 400,
            width: '100%',
            mx: 2,
          }}
        >
          {children}
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
        minHeight: '100vh',
      }}
    >
      <TopBar />
      <Paper
        elevation={0}
        sx={{
          minHeight: 'calc(100vh - 64px)',
          borderRadius: 0,
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}
