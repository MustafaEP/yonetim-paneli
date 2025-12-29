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
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BusinessIcon from '@mui/icons-material/Business';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import BadgeIcon from '@mui/icons-material/Badge';
import RestoreIcon from '@mui/icons-material/Restore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getTevkifatCenters,
  deleteTevkifatCenter,
  type TevkifatCenter,
  getTevkifatTitles,
  createTevkifatTitle,
  updateTevkifatTitle,
  deleteTevkifatTitle,
  type TevkifatTitle,
  type CreateTevkifatTitleDto,
  type UpdateTevkifatTitleDto,
} from '../../api/accountingApi';

const TevkifatCentersPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState<TevkifatCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCenter, setDeletingCenter] = useState<TevkifatCenter | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Tevkifat Unvanları state
  const [titles, setTitles] = useState<TevkifatTitle[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<TevkifatTitle | null>(null);
  const [titleForm, setTitleForm] = useState<CreateTevkifatTitleDto>({ name: '' });
  const [savingTitle, setSavingTitle] = useState(false);
  const [deleteTitleDialogOpen, setDeleteTitleDialogOpen] = useState(false);
  const [deactivateTitleDialogOpen, setDeactivateTitleDialogOpen] = useState(false);
  const [deletingTitle, setDeletingTitle] = useState<TevkifatTitle | null>(null);
  const [deactivatingTitle, setDeactivatingTitle] = useState<TevkifatTitle | null>(null);

  const canView = hasPermission('ACCOUNTING_VIEW');
  const canManage = hasPermission('ACCOUNTING_VIEW'); // Admin yetkisi

  useEffect(() => {
    if (canView) {
      loadCenters();
      loadTitles();
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

  const loadTitles = async () => {
    setLoadingTitles(true);
    try {
      const data = await getTevkifatTitles();
      setTitles(data);
    } catch (e: any) {
      console.error('Tevkifat unvanları yüklenirken hata:', e);
      toast.showError('Tevkifat unvanları yüklenirken bir hata oluştu');
    } finally {
      setLoadingTitles(false);
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

  // Tevkifat Unvanları handler'ları
  const handleOpenTitleDialog = (title?: TevkifatTitle) => {
    if (title) {
      setEditingTitle(title);
      setTitleForm({ name: title.name });
    } else {
      setEditingTitle(null);
      setTitleForm({ name: '' });
    }
    setTitleDialogOpen(true);
  };

  const handleCloseTitleDialog = () => {
    setTitleDialogOpen(false);
    setEditingTitle(null);
    setTitleForm({ name: '' });
  };

  const handleSaveTitle = async () => {
    if (!titleForm.name.trim()) {
      toast.showError('Unvan adı gereklidir');
      return;
    }

    setSavingTitle(true);
    try {
      if (editingTitle) {
        await updateTevkifatTitle(editingTitle.id, titleForm);
        toast.showSuccess('Tevkifat unvanı güncellendi');
      } else {
        await createTevkifatTitle(titleForm);
        toast.showSuccess('Tevkifat unvanı oluşturuldu');
      }
      handleCloseTitleDialog();
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı kaydedilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı kaydedilirken bir hata oluştu');
    } finally {
      setSavingTitle(false);
    }
  };

  const handleDeactivateTitle = async () => {
    if (!deactivatingTitle) return;

    setDeleting(true);
    try {
      await updateTevkifatTitle(deactivatingTitle.id, { isActive: false });
      toast.showSuccess('Tevkifat unvanı pasif yapıldı');
      setDeactivateTitleDialogOpen(false);
      setDeactivatingTitle(null);
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı pasifleştirilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı pasifleştirilirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteTitle = async () => {
    if (!deletingTitle) return;

    setDeleting(true);
    try {
      await deleteTevkifatTitle(deletingTitle.id);
      toast.showSuccess('Tevkifat unvanı silindi');
      setDeleteTitleDialogOpen(false);
      setDeletingTitle(null);
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı silinirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const handleActivateTitle = async (title: TevkifatTitle) => {
    setDeleting(true);
    try {
      await updateTevkifatTitle(title.id, { isActive: true });
      toast.showSuccess('Tevkifat unvanı aktifleştirildi');
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı aktifleştirilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı aktifleştirilirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (row.title && row.title.toLowerCase().includes(searchText.toLowerCase())) ||
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
      field: 'title',
      headerName: 'Tevkifat Ünvanı',
      width: 180,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'code',
      headerName: 'Kod',
      width: 150,
      valueGetter: (value) => value || '-',
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
                    onClick={() => navigate(`/accounting/tevkifat-centers/${center.id}/edit`)}
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

        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} sx={{ mb: 2 }}>
          <Tab label="Tevkifat Merkezleri" icon={<BusinessIcon />} iconPosition="start" />
          <Tab label="Tevkifat Unvanları" icon={<BadgeIcon />} iconPosition="start" />
        </Tabs>

        {tab === 0 && (
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
                onClick={() => navigate('/accounting/tevkifat-centers/new')}
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
        )}

        {tab === 1 && canManage && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenTitleDialog()}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.5,
              }}
            >
              Yeni Unvan Ekle
            </Button>
          </Box>
        )}
      </Box>

      {tab === 0 && (
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
      )}

      {tab === 1 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          {loadingTitles ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Unvan Adı</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell align="right">İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {titles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Henüz unvan eklenmemiş
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    titles.map((title) => (
                      <TableRow key={title.id}>
                        <TableCell>
                          <Typography variant="body1">{title.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={title.isActive ? 'Aktif' : 'Pasif'}
                            color={title.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {canManage && (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Tooltip title="Düzenle" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenTitleDialog(title)}
                                  sx={{ color: theme.palette.primary.main }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {title.isActive ? (
                                <>
                                  <Tooltip title="Pasif Yap" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setDeactivatingTitle(title);
                                        setDeactivateTitleDialogOpen(true);
                                      }}
                                      sx={{ color: theme.palette.warning.main }}
                                    >
                                      <BlockIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Sil" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setDeletingTitle(title);
                                        setDeleteTitleDialogOpen(true);
                                      }}
                                      sx={{ color: theme.palette.error.main }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <Tooltip title="Aktifleştir" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleActivateTitle(title)}
                                    disabled={deleting}
                                    sx={{ color: theme.palette.success.main }}
                                  >
                                    <RestoreIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

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

      {/* Unvan Ekle/Düzenle Dialog */}
      <Dialog open={titleDialogOpen} onClose={handleCloseTitleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTitle ? 'Tevkifat Unvanı Düzenle' : 'Yeni Tevkifat Unvanı Ekle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Unvan Adı"
            value={titleForm.name}
            onChange={(e) => setTitleForm({ name: e.target.value })}
            fullWidth
            margin="normal"
            required
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTitleDialog} disabled={savingTitle}>
            İptal
          </Button>
          <Button
            onClick={handleSaveTitle}
            variant="contained"
            disabled={savingTitle}
            startIcon={savingTitle ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {savingTitle ? 'Kaydediliyor...' : editingTitle ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unvan Pasifleştir Dialog */}
      <Dialog open={deactivateTitleDialogOpen} onClose={() => setDeactivateTitleDialogOpen(false)}>
        <DialogTitle>Tevkifat Unvanını Pasif Yap</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            "{deactivatingTitle?.name}" adlı tevkifat unvanını pasif yapmak istediğinize emin misiniz?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Pasif yapılan unvanlar listede görünmeye devam eder ancak yeni işlemler için kullanılamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateTitleDialogOpen(false)} disabled={deleting}>
            İptal
          </Button>
          <Button
            onClick={handleDeactivateTitle}
            color="warning"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <BlockIcon />}
          >
            {deleting ? 'Pasif Yapılıyor...' : 'Pasif Yap'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unvan Sil Dialog */}
      <Dialog open={deleteTitleDialogOpen} onClose={() => setDeleteTitleDialogOpen(false)}>
        <DialogTitle>Tevkifat Unvanını Sil</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            "{deletingTitle?.name}" adlı tevkifat unvanını kalıcı olarak silmek istediğinize emin misiniz?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 500 }}>
            Bu işlem geri alınamaz. Unvan veritabanından tamamen silinecektir.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTitleDialogOpen(false)} disabled={deleting}>
            İptal
          </Button>
          <Button
            onClick={handleDeleteTitle}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TevkifatCentersPage;
