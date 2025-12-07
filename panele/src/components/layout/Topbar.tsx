import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

const Topbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - 240px)` },
        ml: { md: '240px' },
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {user?.firstName} {user?.lastName}
          {user?.roles && user.roles.length > 0 && (
            <Typography variant="caption" sx={{ ml: 2, opacity: 0.8 }}>
              ({user.roles.join(', ')})
            </Typography>
          )}
        </Typography>
        <Box>
          <IconButton color="inherit" onClick={logout} title="Çıkış Yap">
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;

