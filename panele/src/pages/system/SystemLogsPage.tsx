// src/pages/system/SystemLogsPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';

import type { SystemLog } from '../../api/systemApi';
import { getSystemLogs, getSystemLogById } from '../../api/systemApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

const SystemLogsPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [filters, setFilters] = useState<{
    userId?: string;
    entityType?: string;
    action?: string;
    startDate?: Date | null;
    endDate?: Date | null;
  }>({});

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingLog, setViewingLog] = useState<SystemLog | null>(null);

  const canViewAll = hasPermission('LOG_VIEW_ALL');
  const canViewOwn = hasPermission('LOG_VIEW_OWN_SCOPE');

  const canView = canViewAll || canViewOwn;

  // Filters'ı serialize ederek dependency olarak kullanmak için
  const filtersKey = useMemo(() => {
    return JSON.stringify({
      userId: filters.userId,
      entityType: filters.entityType,
      action: filters.action,
      startDate: filters.startDate ? filters.startDate.toISOString().split('T')[0] : null,
      endDate: filters.endDate ? filters.endDate.toISOString().split('T')[0] : null,
    });
  }, [filters.userId, filters.entityType, filters.action, filters.startDate, filters.endDate]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: pageSize,
        offset: page * pageSize,
      };

      if (filters.userId) params.userId = filters.userId;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate.toISOString().split('T')[0];
      if (filters.endDate) params.endDate = filters.endDate.toISOString().split('T')[0];

      const data = await getSystemLogs(params);
      setRows(data.logs);
      setTotal(data.total);
    } catch (e: any) {
      console.error('Loglar yüklenirken hata:', e);
      toast.error('Loglar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters.userId, filters.entityType, filters.action, filters.startDate, filters.endDate, toast]);

  useEffect(() => {
    if (canView) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, page, pageSize, filtersKey]);

  const handleView = async (id: string) => {
    try {
      const log = await getSystemLogById(id);
      setViewingLog(log);
      setViewDialogOpen(true);
    } catch (e: any) {
      console.error('Log detayı alınırken hata:', e);
      toast.error('Log detayı alınırken bir hata oluştu');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'action',
      headerName: 'İşlem',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'entityType',
      headerName: 'Varlık Türü',
      width: 150,
    },
    {
      field: 'user',
      headerName: 'Kullanıcı',
      width: 200,
      renderCell: (params) => {
        const user = params.row.user;
        if (!user) return '-';
        return `${user.firstName} ${user.lastName}`;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Tarih',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleString('tr-TR');
      },
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const log = params.row as SystemLog;
        return (
          <Tooltip title="Detay">
            <IconButton
              size="small"
              onClick={() => handleView(log.id)}
              sx={{ color: theme.palette.info.main }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  if (!canView) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Bu sayfaya erişim yetkiniz bulunmamaktadır.</Typography>
      </Box>
    );
  }

  return (
    <Box>
        <Box sx={{ mb: 3 }}>
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
              <ListAltIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
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
                Sistem Logları
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                }}
              >
                Sistem loglarını görüntüleyin
              </Typography>
            </Box>
          </Box>
        </Box>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            mb: 3,
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FilterListIcon sx={{ color: theme.palette.text.secondary }} />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Varlık Türü</InputLabel>
                <Select
                  value={filters.entityType || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, entityType: e.target.value || undefined })
                  }
                  label="Varlık Türü"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="USER">Kullanıcı</MenuItem>
                  <MenuItem value="MEMBER">Üye</MenuItem>
                  <MenuItem value="ROLE">Rol</MenuItem>
                  <MenuItem value="DUES">Aidat</MenuItem>
                  <MenuItem value="AUTH">Kimlik Doğrulama</MenuItem>
                  <MenuItem value="REGION">Bölge</MenuItem>
                  <MenuItem value="PROVINCE">İl</MenuItem>
                  <MenuItem value="DISTRICT">İlçe</MenuItem>
                  <MenuItem value="WORKPLACE">İş Yeri</MenuItem>
                  <MenuItem value="BRANCH">Şube</MenuItem>
                  <MenuItem value="DEALER">Bayi</MenuItem>
                  <MenuItem value="CONTENT">İçerik</MenuItem>
                  <MenuItem value="NOTIFICATION">Bildirim</MenuItem>
                  <MenuItem value="PAYMENT">Ödeme</MenuItem>
                  <MenuItem value="DOCUMENT">Doküman</MenuItem>
                  <MenuItem value="INSTITUTION">Kurum</MenuItem>
                  <MenuItem value="APPROVAL">Onay</MenuItem>
                  <MenuItem value="ACCOUNTING">Muhasebe</MenuItem>
                  <MenuItem value="SYSTEM_SETTING">Sistem Ayarı</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>İşlem</InputLabel>
                <Select
                  value={filters.action || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, action: e.target.value || undefined })
                  }
                  label="İşlem"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="CREATE">Oluştur</MenuItem>
                  <MenuItem value="UPDATE">Güncelle</MenuItem>
                  <MenuItem value="DELETE">Sil</MenuItem>
                  <MenuItem value="VIEW">Görüntüle</MenuItem>
                  <MenuItem value="LOGIN">Giriş</MenuItem>
                  <MenuItem value="LOGIN_FAILED">Başarısız Giriş</MenuItem>
                  <MenuItem value="LOGOUT">Çıkış</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Başlangıç Tarihi"
                type="date"
                value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value ? new Date(e.target.value) : null })}
                size="small"
                sx={{ minWidth: 150 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Bitiş Tarihi"
                type="date"
                value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value ? new Date(e.target.value) : null })}
                size="small"
                sx={{ minWidth: 150 }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>

          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            paginationMode="server"
            rowCount={total}
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
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

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Log Detayı</DialogTitle>
          <DialogContent>
            {viewingLog && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>İşlem:</strong> {viewingLog.action}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Varlık Türü:</strong> {viewingLog.entityType}
                </Typography>
                {viewingLog.entityId && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Varlık ID:</strong> {viewingLog.entityId}
                  </Typography>
                )}
                {viewingLog.user ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Kullanıcı:</strong> {viewingLog.user.firstName} {viewingLog.user.lastName} ({viewingLog.user.email})
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Kullanıcı:</strong> <em>Bilinmeyen (Sistem işlemi veya başarısız giriş)</em>
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Tarih:</strong> {new Date(viewingLog.createdAt).toLocaleString('tr-TR')}
                </Typography>
                {viewingLog.ipAddress && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>IP Adresi:</strong> {viewingLog.ipAddress}
                  </Typography>
                )}
                {viewingLog.userAgent && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Tarayıcı:</strong> {viewingLog.userAgent}
                  </Typography>
                )}
                {viewingLog.details && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Detaylar:</strong>
                    </Typography>
                    <pre style={{ backgroundColor: alpha(theme.palette.grey[500], 0.1), padding: 16, borderRadius: 4, overflow: 'auto' }}>
                      {JSON.stringify(viewingLog.details, null, 2)}
                    </pre>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Kapat</Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default SystemLogsPage;

