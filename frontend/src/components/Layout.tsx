import { Paper } from '@mui/material';
import React from 'react';
import TopBar from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {

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
          p: 2
        }}
      >
        {children}
      </Paper>

    </>

  );
}
