// src/pages/accounting/TevkifatCentersPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import BlockIcon from '@mui/icons-material/Block';
import ArchiveIcon from '@mui/icons-material/Archive';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getTevkifatCenters,
  createTevkifatCenter,
  updateTevkifatCenter,
  deleteTevkifatCenter,
  type TevkifatCenter,
  type CreateTevkifatCenterDto,
  type UpdateTevkifatCenterDto,
} from '../../api/accountingApi';

const TevkifatCentersPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState<TevkifatCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<TevkifatCenter | null>(null);
  const [deletingCenter, setDeletingCenter] = useState<TevkifatCenter | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateTevkifatCenterDto>({
    name: '',
    code: '',
    description: '',
  });

  const canView = hasPermission('ACCOUNTING_VIEW');
  const canManage = hasPermission('ACCOUNTING_VIEW'); // Admin yetkisi

  useEffect(() => {
    if (canView) {
      loadCenters();
    }
  }, [canView]);

  const loadCenters = async () => {
    setLoading(true);
    try {
      const data = await getTevkifatCenters();
      setRows(data);
    } catch (e: any) {
      console.error('Tevkifat merkezleri yüklenirken hata:', e);
      toast.showError('Tevkifat merkezleri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (center?: TevkifatCenter) => {
    if (center) {
      setEditingCenter(center);
      setFormData({
        name: center.name,
        code: center.code || '',
        description: center.description || '',
      });
    } else {
      setEditingCenter(null);
      setFormData({
        name: '',
        code: '',
        description: '',
      });
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCenter(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Tevkifat merkezi adı gereklidir');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingCenter) {
        await updateTevkifatCenter(editingCenter.id, formData as UpdateTevkifatCenterDto);
        toast.showSuccess('Tevkifat merkezi başarıyla güncellendi');
      } else {
        await createTevkifatCenter(formData);
        toast.showSuccess('Tevkifat merkezi başarıyla oluşturuldu');
      }
      handleCloseDialog();
      loadCenters();
    } catch (e: any) {
      console.error('Tevkifat merkezi kaydedilirken hata:', e);
      setError(e.response?.data?.message || 'Tevkifat merkezi kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCenter) return;

    setDeleting(true);
    try {
      await deleteTevkifatCenter(deletingCenter.id);
      toast.showSuccess('Tevkifat merkezi pasif yapıldı');
      setDeleteDialogOpen(false);
      setDeletingCenter(null);
      loadCenters();
    } catch (e: any) {
      console.error('Tevkifat merkezi silinirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat merkezi silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (row.code && row.code.toLowerCase().includes(searchText.toLowerCase()));
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && row.isActive) ||
      (statusFilter === 'INACTIVE' && !row.isActive);
    return matchesSearch && matchesStatus;
  });

  const columns: GridColDef<TevkifatCenter>[] = [
    {
      field: 'name',
      headerName: 'Tevkifat Merkezi Adı',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'code',
      headerName: 'Kod',
      width: 150,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'branchCount',
      headerName: 'Bağlı Şube Sayısı',
      width: 150,
      renderCell: (params) => {
        const count = params.value ?? 0;
        if (count === 0) {
          return (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
              }}
            >
              -
            </Typography>
          );
        }
        return <Typography variant="body2">{count}</Typography>;
      },
    },
    {
      field: 'memberCount',
      headerName: 'Toplam Üye Sayısı',
      width: 150,
      renderCell: (params) => {
        const count = params.value ?? 0;
        if (count === 0) {
          return (
            <Tooltip title="Bu merkeze henüz üye eşleştirilmemiştir" arrow>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontStyle: 'italic',
                  cursor: 'help',
                }}
              >
                Henüz atanmadı
              </Typography>
            </Tooltip>
          );
        }
        return <Typography variant="body2">{count}</Typography>;
      },
    },
    {
      field: 'isActive',
      headerName: 'Durum',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Aktif' : 'Pasif'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'lastTevkifatMonth',
      headerName: 'Son Tevkifat Ayı',
      width: 150,
      renderCell: (params) => {
        const month = params.value;
        if (!month) {
          return (
            <Chip
              label="Henüz tevkifat yapılmadı"
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.grey[500], 0.1),
                color: theme.palette.text.secondary,
                fontWeight: 400,
                fontSize: '0.75rem',
              }}
            />
          );
        }
        const monthNames = [
          'Ocak',
          'Şubat',
          'Mart',
          'Nisan',
          'Mayıs',
          'Haziran',
          'Temmuz',
          'Ağustos',
          'Eylül',
          'Ekim',
          'Kasım',
          'Aralık',
        ];
        return <Typography variant="body2">{monthNames[month - 1] || month}</Typography>;
      },
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 200,
      sortable: false,
      renderCell: (params) => {
        const center = params.row as TevkifatCenter;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Detay" arrow>
              <IconButton
                size="small"
                onClick={() => navigate(`/accounting/tevkifat-centers/${center.id}`)}
                sx={{
                  color: theme.palette.info.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.info.main, 0.08),
                  },
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canManage && (
              <>
                <Tooltip title="Düzenle" arrow>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(center)}
                    sx={{
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Pasife Al" arrow>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setDeletingCenter(center);
                      setDeleteDialogOpen(true);
                    }}
                    sx={{
                      color: theme.palette.warning.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.warning.main, 0.08),
                      },
                    }}
                  >
                    <BlockIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        );
      },
    },
  ];

  if (!canView) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
            <BusinessIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Tevkifat Merkezleri
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Kurumlardan gelen toplu aidat kesintilerinin merkezi takibi
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
            mb: 2,
            py: 1.5,
          }}
        >
          <TextField
            placeholder="Ara (isim/kod)..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="small"
            sx={{
              flexGrow: 1,
              minWidth: { xs: '100%', sm: 300 },
              maxWidth: { sm: 'none', md: 400 },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
            <InputLabel>Durum</InputLabel>
            <Select
              value={statusFilter}
              label="Durum"
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <MenuItem value="ALL">Tümü</MenuItem>
              <MenuItem value="ACTIVE">Aktif</MenuItem>
              <MenuItem value="INACTIVE">Pasif</MenuItem>
            </Select>
          </FormControl>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                  transform: 'translateY(-2px)',
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              Yeni Tevkifat Merkezi
            </Button>
          )}
        </Box>
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
          rows={filteredRows}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCenter ? 'Tevkifat Merkezi Düzenle' : 'Yeni Tevkifat Merkezi Oluştur'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Tevkifat Merkezi Adı"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Kod (Opsiyonel)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
              helperText="Benzersiz bir kod girebilirsiniz"
            />
            <TextField
              label="Açıklama"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            İptal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pasif Yap Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Tevkifat Merkezini Pasif Yap</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            "{deletingCenter?.name}" adlı tevkifat merkezini pasif yapmak istediğinize emin misiniz?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Pasif yapılan merkezler listede görünmeye devam eder ancak yeni işlemler için kullanılamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            İptal
          </Button>
          <Button
            onClick={handleDelete}
            color="warning"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <BlockIcon />}
          >
            {deleting ? 'Pasif Yapılıyor...' : 'Pasif Yap'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TevkifatCentersPage;
