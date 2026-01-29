// src/features/notifications/components/NotificationCenter.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  CircularProgress,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type UserNotification,
} from '../services/notificationsApi';
// Basit tarih formatlama fonksiyonu
const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Az önce';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} ay önce`;
  return `${Math.floor(diffInSeconds / 31536000)} yıl önce`;
};

const NotificationCenter: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [loading, setLoading] = useState(false);
  
  // WebSocket hook kullan
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  // Bildirimleri yükle
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyNotifications({ limit: 10, isRead: false });
      setNotifications(result.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Popover açıldığında bildirimleri yükle
  useEffect(() => {
    if (open) {
      loadNotifications();
      refreshUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.notificationId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n,
          ),
        );
        refreshUnreadCount();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    handleClose();

    // Action URL varsa oraya git
    if (notification.notification.actionUrl) {
      navigate(notification.notification.actionUrl);
    } else {
      // Varsayılan olarak bildirimler sayfasına git
      navigate('/notifications');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true })),
      );
      refreshUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/notifications');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SYSTEM':
        return 'primary';
      case 'FINANCIAL':
        return 'success';
      case 'ANNOUNCEMENT':
        return 'info';
      case 'REMINDER':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'SYSTEM':
        return 'Sistem';
      case 'FINANCIAL':
        return 'Mali';
      case 'ANNOUNCEMENT':
        return 'Duyuru';
      case 'REMINDER':
        return 'Hatırlatma';
      default:
        return category;
    }
  };

  // Animasyon için key state - yeni bildirim geldiğinde animasyonu tetiklemek için
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevUnreadCount = useRef(unreadCount);

  useEffect(() => {
    // Yeni bildirim geldiğinde (unreadCount arttığında) animasyonu tetikle
    if (unreadCount > prevUnreadCount.current && prevUnreadCount.current >= 0) {
      setAnimationKey((prev) => prev + 1);
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000); // Animasyon süresini artırdık
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{
          position: 'relative',
          mr: { xs: 1, sm: 1.5 },
          backgroundColor: alpha(theme.palette.action.hover, 0.04),
          transition: 'all 0.2s',
          animation: isAnimating ? 'pulse 1s ease-in-out' : 'none',
          '@keyframes pulse': {
            '0%, 100%': { 
              transform: 'scale(1)',
              boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.7)}`,
            },
            '50%': { 
              transform: 'scale(1.15)',
              boxShadow: `0 0 0 8px ${alpha(theme.palette.error.main, 0)}`,
            },
          },
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            transform: 'scale(1.05)',
          },
        }}
      >
        <Badge 
          badgeContent={unreadCount > 0 ? unreadCount : undefined} 
          color="error" 
          max={99}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              fontWeight: 700,
              minWidth: '20px',
              height: '20px',
              borderRadius: '10px',
              padding: '0 6px',
              boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.5)}`,
              animation: isAnimating ? 'bounce 1s ease-in-out' : 'none',
              '@keyframes bounce': {
                '0%, 100%': { 
                  transform: 'scale(1) translateY(0)',
                },
                '25%': { 
                  transform: 'scale(1.3) translateY(-4px)',
                },
                '50%': { 
                  transform: 'scale(1.2) translateY(0)',
                },
                '75%': { 
                  transform: 'scale(1.3) translateY(-2px)',
                },
              },
            },
          }}
        >
          <Box
            key={animationKey}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: isAnimating ? 'shake 1s ease-in-out' : 'none',
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0) rotate(0deg) scale(1)' },
                '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-6px) rotate(-12deg) scale(1.1)' },
                '20%, 40%, 60%, 80%': { transform: 'translateX(6px) rotate(12deg) scale(1.1)' },
              },
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            {unreadCount > 0 ? (
              <NotificationsIcon 
                sx={{ 
                  color: theme.palette.primary.main,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }} 
              />
            ) : (
              <NotificationsNoneIcon 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }} 
              />
            )}
          </Box>
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: { xs: '90vw', sm: 400 },
            maxHeight: 600,
            mt: 1,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Bildirimler
            </Typography>
            <Stack direction="row" spacing={1}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllAsRead}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  Tümünü okundu işaretle
                </Button>
              )}
              <IconButton
                size="small"
                onClick={() => {
                  handleClose();
                  navigate('/notifications/settings');
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          <Divider sx={{ mb: 1 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                color: theme.palette.text.secondary,
              }}
            >
              <NotificationsNoneIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2">Yeni bildirim yok</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    disablePadding
                    sx={{
                      bgcolor: notification.isRead
                        ? 'transparent'
                        : alpha(theme.palette.primary.main, 0.08),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleNotificationClick(notification)}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {notification.isRead ? (
                          <CheckCircleIcon
                            fontSize="small"
                            sx={{ color: theme.palette.text.disabled }}
                          />
                        ) : (
                          <CircleIcon
                            fontSize="small"
                            sx={{ color: theme.palette.primary.main }}
                          />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={notification.isRead ? 400 : 600}
                              sx={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {notification.notification.title}
                            </Typography>
                            <Chip
                              label={getCategoryLabel(
                                notification.notification.category,
                              )}
                              size="small"
                              color={getCategoryColor(
                                notification.notification.category,
                              ) as any}
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {notification.notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(notification.createdAt)}
                            </Typography>
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}

          {notifications.length > 0 && (
            <>
              <Divider sx={{ mt: 1, mb: 1 }} />
              <Button
                fullWidth
                variant="outlined"
                onClick={handleViewAll}
                size="small"
              >
                Tümünü Görüntüle
              </Button>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationCenter;
