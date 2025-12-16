// src/components/layout/Topbar.tsx
import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  alpha,
  Avatar,
  Chip,
  useMediaQuery,
  Badge,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../../context/AuthContext';

const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLButtonElement | null>(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState<any[]>([]);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  // Admin veya Genel Başkan için popup kontrolü
  useEffect(() => {
    const checkNotifications = async () => {
      // TODO: API'den bekleyen onayları çek
      // Şimdilik placeholder
      const isAdminOrGenelBaskan = user?.roles?.some(r => r === 'ADMIN' || r === 'GENEL_BASKAN');
      if (isAdminOrGenelBaskan && pendingNotifications.length > 0) {
        setShowWelcomePopup(true);
      }
    };
    checkNotifications();
  }, [user, pendingNotifications]);

  const handleNotificationClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - 260px)` },
        ml: { md: '260px' },
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#ffffff',
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {/* Sol Taraf - Kullanıcı Bilgisi */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Avatar
            sx={{
              width: { xs: 32, sm: 36 },
              height: { xs: 32, sm: 36 },
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 600,
              mr: { xs: 1.5, sm: 2 },
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {initials}
          </Avatar>

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                color: theme.palette.text.primary,
                lineHeight: 1.2,
              }}
            >
              {user?.firstName} {user?.lastName}
            </Typography>

            {!isMobile && user?.roles && user.roles.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                {user.roles.slice(0, 2).map((role, index) => (
                  <Chip
                    key={index}
                    label={role}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      '& .MuiChip-label': {
                        px: 1,
                      },
                    }}
                  />
                ))}
                {user.roles.length > 2 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.7rem',
                      ml: 0.5,
                    }}
                  >
                    +{user.roles.length - 2}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Sağ Taraf - Aksiyon Butonları */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          {/* Bildirimler */}
          <IconButton
            onClick={handleNotificationClick}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              backgroundColor: alpha(theme.palette.action.hover, 0.04),
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                transform: 'scale(1.05)',
              },
            }}
          >
            <Badge badgeContent={pendingNotifications.length} color="error">
            <NotificationsIcon fontSize={isMobile ? 'small' : 'medium'} />
            </Badge>
          </IconButton>

          <Popover
            open={Boolean(notificationAnchor)}
            anchorEl={notificationAnchor}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Box sx={{ p: 2, minWidth: 300, maxWidth: 400 }}>
              <Typography variant="h6" gutterBottom>
                Bildirimler
              </Typography>
              {pendingNotifications.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Bildirim bulunmuyor
                </Typography>
              ) : (
                <List>
                  {pendingNotifications.map((notif, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={notif.title || 'Bekleyen Onay'}
                        secondary={notif.message || 'Bekleyen onay işlemleri var'}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Popover>

          {/* Çıkış Yap */}
          <IconButton
            onClick={logout}
            size="small"
            sx={{
              color: theme.palette.error.main,
              backgroundColor: alpha(theme.palette.error.main, 0.08),
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.12),
                transform: 'scale(1.05)',
              },
            }}
            title="Çıkış Yap"
          >
            <LogoutIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Hoş Geldin Popup - Admin/Genel Başkan için */}
      <Dialog
        open={showWelcomePopup}
        onClose={handleCloseWelcomePopup}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Bekleyen Bildirimler</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bekleyen onay işlemleri bulunmaktadır. Lütfen kontrol ediniz.
          </Typography>
          {pendingNotifications.length > 0 && (
            <List>
              {pendingNotifications.slice(0, 5).map((notif, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={notif.title || 'Bekleyen Onay'}
                    secondary={notif.message || 'Bekleyen onay işlemleri var'}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWelcomePopup} variant="contained">
            Tamam
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Topbar;