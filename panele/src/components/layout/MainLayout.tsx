// src/components/layout/MainLayout.tsx
import React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
} from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ProfileMenu from './ProfileMenu';

const MainLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Sendika Yönetim Paneli
          </Typography>
          <ProfileMenu />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Sidebar />

      {/* İçerik */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // AppBar yüksekliği kadar
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
