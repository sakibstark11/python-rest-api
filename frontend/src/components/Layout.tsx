import { Paper, CircularProgress, Backdrop } from '@mui/material';
import React from 'react';
import TopBar from './TopBar';
import { useStore } from './hooks/useStore';

type LayoutProps = {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [loading] = useStore((state) => state.loading);

  return (
    <>
      <TopBar />
      <Paper
        elevation={0}
        sx={{
          minHeight: 'calc(100vh - 64px)',
          borderRadius: 0,
          alignItems: 'center',
          display: 'flex',
          p: 2,
        }}
      >
        {children}
      </Paper>
      
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
