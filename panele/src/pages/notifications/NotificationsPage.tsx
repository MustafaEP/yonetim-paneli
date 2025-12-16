// src/pages/notifications/NotificationsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  alpha,
  Chip,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SendIcon from '@mui/icons-material/Send';

import type { Notification } from '../../api/notificationsApi';
import { sendNotification, getNotifications } from '../../api/notificationsApi';
import { getProvinces } from '../../api/regionsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { Province } from '../../types/region';

const NotificationsPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'EMAIL' as 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP',
    targetType: 'ALL_MEMBERS' as 'ALL_MEMBERS' | 'REGION' | 'SCOPE',
  });

  const canNotifyAll = hasPermission('NOTIFY_ALL_MEMBERS');
  const canNotifyRegion = hasPermission('NOTIFY_REGION');
  const canNotifyScope = hasPermission('NOTIFY_OWN_SCOPE');

  const canSend = canNotifyAll || canNotifyRegion || canNotifyScope;

  useEffect(() => {
    loadNotifications();
    if (canNotifyRegion || canNotifyScope) {
      loadProvinces();
    }
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setRows(data);
    } catch (e: any) {
      console.error('Bildirimler yüklenirken hata:', e);
      toast.error('Bildirimler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async () => {
    try {
      const data = await getProvinces();
      setProvinces(data);
    } catch (e: any) {
      console.error('İller yüklenirken hata:', e);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      title: '',
      message: '',
      type: 'EMAIL',
      targetType: canNotifyAll ? 'ALL_MEMBERS' : canNotifyRegion ? 'REGION' : 'SCOPE',
    });
    setSelectedProvince(null);
    setError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError(null);
  };

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Başlık ve mesaj gereklidir');
      return;
    }

    if (formData.targetType !== 'ALL_MEMBERS' && !selectedProvince) {
      setError('Hedef bölge seçimi gereklidir');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendNotification({
        ...formData,
        targetId: selectedProvince?.id,
      });
      toast.success('Bildirim başarıyla gönderildi');
      handleCloseDialog();
      loadNotifications();
    } catch (e: any) {
      console.error('Bildirim gönderilirken hata:', e);
      setError(e.response?.data?.message || 'Bildirim gönderilirken bir hata oluştu');
    } finally {
      setSending(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Başlık',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'type',
      headerName: 'Tür',
      width: 120,
      renderCell: (params) => {
        const typeLabels: Record<string, string> = {
          EMAIL: 'E-posta',
          SMS: 'SMS',
          WHATSAPP: 'WhatsApp',
          IN_APP: 'Uygulama İçi',
        };
        return <Chip label={typeLabels[params.value] || params.value} size="small" />;
      },
    },
    {
      field: 'targetType',
      headerName: 'Hedef',
      width: 150,
      renderCell: (params) => {
        const targetLabels: Record<string, string> = {
          ALL_MEMBERS: 'Tüm Üyeler',
          REGION: 'Bölge',
          SCOPE: 'Kapsam',
        };
        return <Chip label={targetLabels[params.value] || params.value} size="small" color="primary" />;
      },
    },
    {
      field: 'status',
      headerName: 'Durum',
      width: 120,
      renderCell: (params) => {
        const statusColors: Record<string, 'default' | 'success' | 'error' | 'warning'> = {
          PENDING: 'warning',
          SENT: 'success',
          FAILED: 'error',
        };
        return (
          <Chip
            label={params.value}
            color={statusColors[params.value] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'recipientCount',
      headerName: 'Alıcı Sayısı',
      width: 120,
    },
    {
      field: 'sentAt',
      headerName: 'Gönderim Tarihi',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleString('tr-TR');
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <NotificationsIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Bildirimler
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Üyelere bildirim gönderin
            </Typography>
          </Box>
        </Box>
        {canSend && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            Yeni Bildirim
          </Button>
        )}
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
          }}
        />
      </Card>

      {/* Send Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Yeni Bildirim Gönder</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Başlık"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Mesaj"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              multiline
              rows={6}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Tür</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                  label="Tür"
                >
                  <MenuItem value="EMAIL">E-posta</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                  <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
                  <MenuItem value="IN_APP">Uygulama İçi</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Hedef</InputLabel>
                <Select
                  value={formData.targetType}
                  onChange={(e) =>
                    setFormData({ ...formData, targetType: e.target.value as any })
                  }
                  label="Hedef"
                >
                  {canNotifyAll && <MenuItem value="ALL_MEMBERS">Tüm Üyeler</MenuItem>}
                  {canNotifyRegion && <MenuItem value="REGION">Bölge</MenuItem>}
                  {canNotifyScope && <MenuItem value="SCOPE">Kapsam</MenuItem>}
                </Select>
              </FormControl>
            </Box>
            {(formData.targetType === 'REGION' || formData.targetType === 'SCOPE') && (
              <Autocomplete
                options={provinces}
                getOptionLabel={(option) => `${option.name}${option.code ? ` (${option.code})` : ''}`}
                value={selectedProvince}
                onChange={(_, newValue) => setSelectedProvince(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="İl Seçimi" required />
                )}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={sending}>
            İptal
          </Button>
          <Button
            onClick={handleSend}
            variant="contained"
            disabled={sending}
            startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
          >
            {sending ? 'Gönderiliyor...' : 'Gönder'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationsPage;

