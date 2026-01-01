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
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Divider,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getTevkifatCenters,
  deleteTevkifatCenter,
  type TevkifatCenter,
  type DeleteTevkifatCenterDto,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCenter, setDeletingCenter] = useState<TevkifatCenter | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteActionType, setDeleteActionType] = useState<DeleteTevkifatCenterDto['memberActionType']>('REMOVE_TEVKIFAT_CENTER');
  const [deleteTargetTevkifatCenterId, setDeleteTargetTevkifatCenterId] = useState<string>('');

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



  const handleDelete = async () => {
    if (!deletingCenter) return;

    // Transfer seçenekleri için hedef merkez kontrolü
    if (
      (deleteActionType === 'TRANSFER_TO_TEVKIFAT_CENTER' ||
        deleteActionType === 'TRANSFER_AND_DEACTIVATE' ||
        deleteActionType === 'TRANSFER_AND_CANCEL') &&
      !deleteTargetTevkifatCenterId
    ) {
      toast.showError('Lütfen hedef tevkifat merkezi seçin');
      return;
    }

    setDeleting(true);
    try {
      const dto: DeleteTevkifatCenterDto = {
        memberActionType: deleteActionType,
        ...(deleteTargetTevkifatCenterId && { targetTevkifatCenterId: deleteTargetTevkifatCenterId }),
      };
      await deleteTevkifatCenter(deletingCenter.id, dto);
      toast.showSuccess('Tevkifat merkezi kaldırıldı');
      setDeleteDialogOpen(false);
      setDeletingCenter(null);
      setDeleteActionType('REMOVE_TEVKIFAT_CENTER');
      setDeleteTargetTevkifatCenterId('');
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
      row.name.toLowerCase().includes(searchText.toLowerCase());
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
                <Tooltip title="Kaldır" arrow>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setDeletingCenter(center);
                      setDeleteActionType('REMOVE_TEVKIFAT_CENTER');
                      setDeleteTargetTevkifatCenterId('');
                      setDeleteDialogOpen(true);
                    }}
                    sx={{
                      color: theme.palette.error.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.08),
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
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
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            borderRadius: 3,
            boxShadow: `0 4px 16px ${alpha(theme.palette.error.main, 0.15)}`,
          }}
        >
          <BusinessIcon sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
            Yetkisiz İşlem
          </Typography>
          <Typography color="text.secondary">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: (theme) => 
        theme.palette.mode === 'light' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`
          : theme.palette.background.default,
      pb: 4,
    }}>
      {/* Modern Header */}
      <Box sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 3, md: 4 } }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            overflow: 'visible',
            position: 'relative',
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 4,
              padding: '2px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
              >
                <BusinessIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'white' }} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                    mb: 1,
                  }}
                >
                  Tevkifat Merkezleri
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    opacity: 0.95,
                    fontSize: { xs: '0.875rem', md: '1rem' },
                  }}
                >
                  Kurumlardan gelen toplu aidat kesintilerinin merkezi takibi
                </Typography>
              </Box>
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
                    backgroundColor: 'white',
                    color: theme.palette.primary.main,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    '&:hover': {
                      backgroundColor: alpha('#fff', 0.9),
                      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  Yeni Tevkifat Merkezi
                </Button>
              )}
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Filtre ve Arama */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          mb: 3,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`,
            transform: 'translateY(-2px)',
          }
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
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
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '100%', sm: 140 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                },
              }}
            >
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
          </Box>
        </Box>
      </Card>

      {/* Data Grid Kartı */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`,
            transform: 'translateY(-2px)',
          }
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
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              fontSize: '0.875rem',
            },
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              },
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              backgroundColor: alpha(theme.palette.background.default, 0.5),
            },
          }}
        />
      </Card>

      {/* Pasif Yap Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.warning.main, 0.15)}`,
          },
        }}
      >
        <DialogTitle 
            sx={{ 
              pb: 1,
              pt: 3,
              px: 3,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: theme.palette.error.main,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
              }}
            >
              <DeleteIcon />
            </Box>
            Tevkifat Merkezini Kaldır
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                "{deletingCenter?.name}" adlı tevkifat merkezini kaldırmak istediğinize emin misiniz?
              </Typography>
              <Typography variant="body2">
                Bu tevkifat merkezine bağlı {deletingCenter?.memberCount || 0} üye bulunmaktadır. 
                Tevkifat merkezini kaldırmadan önce üyelere ne yapılacağını seçmeniz gerekmektedir.
              </Typography>
            </Alert>

            <Box>
              <FormLabel sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.95rem', display: 'block' }}>
                Üyelere Ne Yapılacak?
              </FormLabel>
              <RadioGroup
                value={deleteActionType}
                onChange={(e) => setDeleteActionType(e.target.value as DeleteTevkifatCenterDto['memberActionType'])}
                sx={{ gap: 1 }}
              >
                <FormControlLabel
                  value="REMOVE_TEVKIFAT_CENTER"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Tevkifat Merkezi Bilgisini Kaldır
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyelerin tevkifat merkezi bilgisi kaldırılacak (null yapılacak), durumları değişmeyecek
                      </Typography>
                    </Box>
                  }
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    p: 1.5,
                    m: 0,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                />
                <FormControlLabel
                  value="TRANSFER_TO_TEVKIFAT_CENTER"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Başka Bir Tevkifat Merkezine Taşı
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyeler seçilen tevkifat merkezine taşınacak, durumları değişmeyecek
                      </Typography>
                    </Box>
                  }
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    p: 1.5,
                    m: 0,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                />
                <FormControlLabel
                  value="REMOVE_AND_DEACTIVATE"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Tevkifat Merkezi Bilgisini Kaldır ve Pasif Et
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyelerin tevkifat merkezi bilgisi kaldırılacak ve pasif duruma getirilecek
                      </Typography>
                    </Box>
                  }
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    p: 1.5,
                    m: 0,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                    },
                  }}
                />
                <FormControlLabel
                  value="TRANSFER_AND_DEACTIVATE"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Başka Bir Tevkifat Merkezine Taşı ve Pasif Et
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyeler seçilen tevkifat merkezine taşınacak ve pasif duruma getirilecek
                      </Typography>
                    </Box>
                  }
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    p: 1.5,
                    m: 0,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                    },
                  }}
                />
                <FormControlLabel
                  value="TRANSFER_AND_CANCEL"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Başka Bir Tevkifat Merkezine Taşı ve İptal Et
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyeler seçilen tevkifat merkezine taşınacak ve üyelikleri iptal edilecek (İstifa)
                      </Typography>
                    </Box>
                  }
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    p: 1.5,
                    m: 0,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.04),
                    },
                  }}
                />
              </RadioGroup>
            </Box>

            {(deleteActionType === 'TRANSFER_TO_TEVKIFAT_CENTER' ||
              deleteActionType === 'TRANSFER_AND_DEACTIVATE' ||
              deleteActionType === 'TRANSFER_AND_CANCEL') && (
              <>
                <Divider />
                <FormControl fullWidth required>
                  <InputLabel>Hedef Tevkifat Merkezi</InputLabel>
                  <Select
                    value={deleteTargetTevkifatCenterId}
                    onChange={(e) => setDeleteTargetTevkifatCenterId(e.target.value)}
                    label="Hedef Tevkifat Merkezi"
                    disabled={deleting}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.divider, 0.2),
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Hedef tevkifat merkezi seçin</em>
                    </MenuItem>
                    {rows
                      .filter(center => center.id !== deletingCenter?.id && center.isActive)
                      .map((center) => (
                        <MenuItem key={center.id} value={center.id}>
                          {center.name}
                          {center.memberCount !== undefined && ` (${center.memberCount} üye)`}
                        </MenuItem>
                      ))}
                  </Select>
                  <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
                    Üyeler bu tevkifat merkezine taşınacaktır
                  </Alert>
                </FormControl>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeletingCenter(null);
              setDeleteActionType('REMOVE_TEVKIFAT_CENTER');
              setDeleteTargetTevkifatCenterId('');
            }} 
            disabled={deleting}
            sx={{ 
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={
              deleting || 
              (deleteActionType !== 'REMOVE_TEVKIFAT_CENTER' && 
               deleteActionType !== 'REMOVE_AND_DEACTIVATE' && 
               !deleteTargetTevkifatCenterId)
            }
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.4)}`,
              },
            }}
          >
            {deleting ? 'Kaldırılıyor...' : 'Kaldır'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default TevkifatCentersPage;
