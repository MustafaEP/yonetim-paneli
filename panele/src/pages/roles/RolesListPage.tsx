// src/pages/roles/RolesListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  useTheme,
  alpha,
  Paper,
  Alert,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import type { RoleListItem, CustomRole } from '../../types/role';
import { getRoles, deleteRole } from '../../api/rolesApi';

const RolesListPage: React.FC = () => {
  const theme = useTheme();
  const [rows, setRows] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<CustomRole | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  // Filtrelenmiş veriler
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Arama filtresi
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter((row) => {
        if ('isSystemRole' in row && row.isSystemRole) {
          return row.name.toLowerCase().includes(searchLower);
        } else {
          const customRole = row as CustomRole;
          return (
            customRole.name.toLowerCase().includes(searchLower) ||
            (customRole.description &&
              customRole.description.toLowerCase().includes(searchLower))
          );
        }
      });
    }

    return filtered;
  }, [rows, searchText]);

  const columns: GridColDef<RoleListItem>[] = [
    {
      field: 'name',
      headerName: 'Rol Adı',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 500 }}>{params.row.name}</Typography>
          {'isSystemRole' in params.row && params.row.isSystemRole && (
            <Chip 
              label="Sistem" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
      ),
    },
    {
      field: 'description',
      headerName: 'Açıklama',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => {
        if ('isSystemRole' in params.row && params.row.isSystemRole) {
          return <Typography variant="body2" color="text.secondary">Sistem rolü</Typography>;
        }
        return (
          <Typography variant="body2">
            {(params.row as CustomRole).description || '-'}
          </Typography>
        );
      },
    },
    {
      field: 'permissions',
      headerName: 'İzin Sayısı',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={`${params.row.permissions.length} izin`}
          size="small"
          icon={<SecurityIcon />}
          color="info"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Durum',
      width: 120,
      renderCell: (params) => {
        if ('isSystemRole' in params.row && params.row.isSystemRole) {
          return <Chip label="Aktif" color="success" size="small" sx={{ fontWeight: 500 }} />;
        }
        const customRole = params.row as CustomRole;
        return customRole.isActive ? (
          <Chip label="Aktif" color="success" size="small" sx={{ fontWeight: 500 }} />
        ) : (
          <Chip label="Pasif" size="small" />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<RoleListItem>) => {
        // Sistem rolleri için sadece görüntüle
        if ('isSystemRole' in params.row && params.row.isSystemRole) {
          return (
            <Tooltip title="Detay">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  // Sistem rolleri için detay sayfası yok, sadece izinleri göster
                }}
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        }

        const customRole = params.row as CustomRole;
        const isAdmin = customRole.name === 'ADMIN';
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Detay">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/roles/${customRole.id}`);
                }}
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isAdmin ? 'ADMIN rolü düzenlenemez' : 'Düzenle'}>
              <span>
                <IconButton
                  size="small"
                  disabled={isAdmin}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAdmin) {
                      navigate(`/roles/${customRole.id}/edit`);
                    }
                  }}
                  sx={{
                    color: theme.palette.info.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.info.main, 0.08),
                    },
                    '&.Mui-disabled': {
                      color: theme.palette.action.disabled,
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={isAdmin ? 'ADMIN rolü silinemez' : 'Sil'}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={isAdmin}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAdmin) {
                      setRoleToDelete(customRole);
                      setDeleteDialogOpen(true);
                    }
                  }}
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.error.main, 0.08),
                    },
                    '&.Mui-disabled': {
                      color: theme.palette.action.disabled,
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await getRoles();
        setRows(data);
      } catch (e) {
        console.error('Roller alınırken hata:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const handleDelete = async () => {
    if (!roleToDelete) return;

    setDeleting(true);
    try {
      await deleteRole(roleToDelete.id);
      setRows((prev) => prev.filter((r) => !('id' in r) || r.id !== roleToDelete.id));
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch (e) {
      console.error('Rol silinirken hata:', e);
      alert('Rol silinirken bir hata oluştu. Rol kullanıcılara atanmış olabilir.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Box>
        {/* Başlık Bölümü */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <AdminPanelSettingsIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
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
                Roller
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                }}
              >
                Sistem rolleri ve özel rolleri görüntüleyin ve yönetin
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/roles/new')}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              Yeni Rol
            </Button>
          </Box>

          {/* Mobile New Role Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            fullWidth
            onClick={() => navigate('/roles/new')}
            sx={{
              display: { xs: 'flex', sm: 'none' },
              mt: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            Yeni Rol Ekle
          </Button>
        </Box>

        {/* Ana Kart */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Arama Bölümü */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            }}
          >
            <TextField
              placeholder="Rol adı veya açıklama ile ara..."
              size="small"
              fullWidth
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                },
              }}
            />
          </Box>

          {/* İçerik Bölümü */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Sonuç Sayısı */}
            {!loading && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.info.main,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <AdminPanelSettingsIcon fontSize="small" />
                  Toplam {filteredRows.length} rol bulundu
                </Typography>
              </Paper>
            )}

            {/* Tablo - Her zaman render edilir, loading state'i DataGrid'e geçirilir */}
            <Box
              sx={{
                height: { xs: 400, sm: 500, md: 600 },
                minHeight: { xs: 400, sm: 500, md: 600 },
                '& .MuiDataGrid-root': {
                  border: 'none',
                  borderRadius: 2,
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 0,
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                },
              }}
            >
              <DataGrid
                rows={filteredRows}
                columns={columns}
                loading={loading}
                getRowId={(row) => ('id' in row ? row.id : `system-${row.name}`)}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25, page: 0 } },
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                disableRowSelectionOnClick
                sx={{
                  '& .MuiDataGrid-virtualScroller': {
                    minHeight: '200px',
                  },
                }}
              />
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Silme Onay Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: { xs: '90%', sm: 400 },
          },
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700,
          fontSize: '1.25rem',
          pb: 1,
        }}>
          Rolü Sil
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ mb: 1.5 }}>
            <strong>{roleToDelete?.name}</strong> rolünü silmek istediğinize emin misiniz?
          </Typography>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Bu rol kullanıcılara atanmışsa silinemez.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={deleting}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 100,
            }}
          >
            {deleting ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RolesListPage;