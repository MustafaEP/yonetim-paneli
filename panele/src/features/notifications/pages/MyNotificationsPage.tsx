// src/pages/notifications/MyNotificationsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  useTheme,
  alpha,
  Tabs,
  Tab,
  IconButton,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import SettingsIcon from '@mui/icons-material/Settings';
import MarkAsReadIcon from '@mui/icons-material/DoneAll';
import { useNavigate } from 'react-router-dom';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type UserNotification,
} from '../services/notificationsApi';
import { useToast } from '../../../shared/hooks/useToast';
import { getApiErrorMessage } from '../../../shared/utils/errorUtils';
import PageHeader from '../../../shared/components/layout/PageHeader';

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

const MyNotificationsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState(0); // 0: Tümü, 1: Okunmamış, 2: Okundu
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const isRead = tab === 1 ? false : tab === 2 ? true : undefined;
      const category = categoryFilter !== 'ALL' ? categoryFilter : undefined;

      const result = await getMyNotifications({
        isRead,
        category: category as any,
        limit: 100,
        offset: 0,
      });
      setNotifications(result.data);
    } catch (error: unknown) {
      console.error('Bildirimler yüklenirken hata:', error);
      toast.error(getApiErrorMessage(error, 'Bildirimler yüklenirken bir hata oluştu'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, categoryFilter]);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, categoryFilter]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setSelectedIds([]);
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
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    if (notification.notification.actionUrl) {
      navigate(notification.notification.actionUrl);
    }
  };

  const handleSelectAll = () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (selectedIds.length === unreadIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unreadIds);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleMarkSelectedAsRead = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) => {
          const notification = notifications.find((n) => n.id === id);
          if (notification && !notification.isRead) {
            return markNotificationAsRead(notification.notificationId);
          }
          return Promise.resolve();
        }),
      );
      toast.success(`${selectedIds.length} bildirim okundu işaretlendi`);
      setSelectedIds([]);
      loadNotifications();
    } catch (error) {
      toast.error('Bildirimler güncellenirken hata oluştu');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      toast.success('Tüm bildirimler okundu işaretlendi');
      loadNotifications();
    } catch (error) {
      toast.error('Bildirimler güncellenirken hata oluştu');
    }
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Box>
      <PageHeader
        icon={<NotificationsIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
        title="Bildirimlerim"
        description={unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
        color={theme.palette.primary.main}
        darkColor={theme.palette.primary.dark}
        lightColor={theme.palette.primary.light}
        rightContent={
          <Stack direction="row" spacing={1}>
            {unreadCount > 0 && (
              <Button
                variant="outlined"
                startIcon={<MarkAsReadIcon />}
                onClick={handleMarkAllAsRead}
              >
                Tümünü Okundu İşaretle
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/notifications/settings')}
            >
              Ayarlar
            </Button>
          </Stack>
        }
      />

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} sx={{ px: 2, pt: 2, alignItems: 'center' }}>
            <Tabs value={tab} onChange={handleTabChange}>
              <Tab label="Tümü" />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Okunmamış
                    {unreadCount > 0 && (
                      <Chip label={unreadCount} size="small" color="error" />
                    )}
                  </Box>
                }
              />
              <Tab label="Okundu" />
            </Tabs>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Kategori"
              >
                <MenuItem value="ALL">Tümü</MenuItem>
                <MenuItem value="SYSTEM">Sistem</MenuItem>
                <MenuItem value="FINANCIAL">Mali</MenuItem>
                <MenuItem value="ANNOUNCEMENT">Duyuru</MenuItem>
                <MenuItem value="REMINDER">Hatırlatma</MenuItem>
              </Select>
            </FormControl>
            {selectedIds.length > 0 && (
              <Button
                variant="contained"
                size="small"
                onClick={handleMarkSelectedAsRead}
              >
                Seçileni Okundu İşaretle ({selectedIds.length})
              </Button>
            )}
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              color: theme.palette.text.secondary,
            }}
          >
            <NotificationsIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" gutterBottom>
              Bildirim bulunamadı
            </Typography>
            <Typography variant="body2">
              {tab === 1 ? 'Okunmamış bildirim yok' : 'Bildirim bulunmuyor'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  disablePadding
                  sx={{
                    bgcolor: notification.isRead
                      ? 'transparent'
                      : alpha(theme.palette.primary.main, 0.06),
                    '&:hover': {
                      bgcolor: notification.isRead
                        ? alpha(theme.palette.action.hover, 0.04)
                        : alpha(theme.palette.primary.main, 0.1),
                    },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <ListItemButton
                    onClick={() => handleNotificationClick(notification)}
                    sx={{ py: 2, px: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox
                        checked={selectedIds.includes(notification.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(notification.id);
                        }}
                        size="small"
                      />
                    </ListItemIcon>
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
                            variant="subtitle1"
                            fontWeight={notification.isRead ? 400 : 600}
                            sx={{ flex: 1 }}
                          >
                            {notification.notification.title}
                          </Typography>
                          <Chip
                            label={getCategoryLabel(notification.notification.category)}
                            size="small"
                            color={getCategoryColor(notification.notification.category) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {notification.notification.message}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(notification.createdAt)}
                            </Typography>
                            {notification.notification.actionLabel && (
                              <>
                                <Typography variant="caption" color="text.secondary">
                                  •
                                </Typography>
                                <Chip
                                  label={notification.notification.actionLabel}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                              </>
                            )}
                          </Stack>
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItemButton>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Card>
    </Box>
  );
};

export default MyNotificationsPage;

