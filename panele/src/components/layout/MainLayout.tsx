// src/components/layout/MainLayout.tsx
import React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
} from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar, { drawerWidth } from './Sidebar';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();

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
          {user && (
            <>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {user.firstName} {user.lastName} ({user.roles.join(', ')})
              </Typography>
              <Button color="inherit" onClick={logout}>
                Çıkış
              </Button>
            </>
          )}
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
