// src/components/layout/ProfileMenu.tsx
import React, { useState } from 'react';
import {
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProfileMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // user adın / logout fonksiyonun farklıysa uyarlarsın
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleClose();
    logout(); // AuthContext’teki logout fonksiyonu
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        sx={{ ml: 2 }}
      >
        <Avatar sx={{ width: 32, height: 32 }}>
          {initials}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <MenuItem disabled>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={user ? `${user.firstName} ${user.lastName}` : 'Kullanıcı'}
            secondary={user?.email}
          />
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profilim" />
        </MenuItem>

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Çıkış Yap" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileMenu;
