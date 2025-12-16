// src/pages/regions/BranchesPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  Tooltip,
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useNavigate } from 'react-router-dom';

import type { Branch } from '../../api/branchesApi';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  assignBranchPresident,
} from '../../api/branchesApi';
import { getProvinces, getDistricts } from '../../api/regionsApi';
import { getUsers } from '../../api/usersApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { Province, District } from '../../types/region';
import type { UserListItem } from '../../types/user';

const BranchesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [branchToAssign, setBranchToAssign] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedPresidentId, setSelectedPresidentId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    provinceId: '',
    districtId: '',
    address: '',
    phone: '',
    email: '',
  });

  const canManage = hasPermission('BRANCH_MANAGE');
  const canAssignPresident = hasPermission('BRANCH_ASSIGN_PRESIDENT');

  useEffect(() => {
    loadBranches();
    loadProvinces();
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedProvinceId) {
      loadDistricts(selectedProvinceId);
    } else {
      setDistricts([]);
      setSelectedDistrictId('');
    }
  }, [selectedProvinceId]);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const data = await getBranches();
      setRows(data);
    } catch (e: any) {
      console.error('Şubeler yüklenirken hata:', e);
      toast.error('Şubeler yüklenirken bir hata oluştu');
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

  const loadDistricts = async (provinceId: string) => {
    try {
      const data = await getDistricts(provinceId);
      setDistricts(data);
    } catch (e: any) {
      console.error('İlçeler yüklenirken hata:', e);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e: any) {
      console.error('Kullanıcılar yüklenirken hata:', e);
    }
  };

  const handleOpenDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        code: branch.code || '',
        provinceId: branch.provinceId,
        districtId: branch.districtId || '',
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
      });
      setSelectedProvinceId(branch.provinceId);
      if (branch.districtId) {
        setSelectedDistrictId(branch.districtId);
      }
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        code: '',
        provinceId: '',
        districtId: '',
        address: '',
        phone: '',
        email: '',
      });
      setSelectedProvinceId('');
      setSelectedDistrictId('');
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBranch(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.provinceId) {
      setError('Şube adı ve il seçimi gereklidir');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, {
          ...formData,
          districtId: formData.districtId || undefined,
        });
        toast.success('Şube başarıyla güncellendi');
      } else {
        await createBranch({
          ...formData,
          districtId: formData.districtId || undefined,
        });
        toast.success('Şube başarıyla oluşturuldu');
      }
      handleCloseDialog();
      loadBranches();
    } catch (e: any) {
      console.error('Şube kaydedilirken hata:', e);
      setError(e.response?.data?.message || 'Şube kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!branchToAssign || !selectedPresidentId) return;

    setAssigning(true);
    try {
      await assignBranchPresident(branchToAssign.id, { presidentId: selectedPresidentId });
      toast.success('Şube başkanı başarıyla atandı');
      setAssignDialogOpen(false);
      setBranchToAssign(null);
      setSelectedPresidentId('');
      loadBranches();
    } catch (e: any) {
      console.error('Başkan atanırken hata:', e);
      toast.error(e.response?.data?.message || 'Başkan atanırken bir hata oluştu');
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;

    setDeleting(true);
    try {
      await deleteBranch(branchToDelete.id);
      toast.success('Şube başarıyla silindi');
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
      loadBranches();
    } catch (e: any) {
      console.error('Şube silinirken hata:', e);
      toast.error(e.response?.data?.message || 'Şube silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Şube Adı',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'code',
      headerName: 'Kod',
      width: 100,
    },
    {
      field: 'province',
      headerName: 'İl',
      width: 150,
      renderCell: (params) => {
        const province = params.row.province;
        return province ? province.name : '-';
      },
    },
    {
      field: 'district',
      headerName: 'İlçe',
      width: 150,
      renderCell: (params) => {
        const district = params.row.district;
        return district ? district.name : '-';
      },
    },
    {
      field: 'president',
      headerName: 'Şube Başkanı',
      width: 200,
      renderCell: (params) => {
        const president = params.row.president;
        return president ? `${president.firstName} ${president.lastName}` : '-';
      },
    },
    {
      field: 'memberCount',
      headerName: 'Üye Sayısı',
      width: 120,
      valueGetter: (value) => value ?? 0,
    },
    {
      field: 'institutionCount',
      headerName: 'Bağlı Kurum Sayısı',
      width: 150,
      valueGetter: (value, row) => {
        // Backend'den gelecek, şimdilik 0
        return row.institutionCount ?? 0;
      },
    },
    {
      field: 'branchSharePercent',
      headerName: 'Şube Payı (%)',
      width: 130,
      valueGetter: (value) => {
        return value ? `${Number(value)}%` : '40%';
      },
    },
    {
      field: 'isActive',
      headerName: 'Aktif / Pasif',
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
      field: 'actions',
      headerName: 'İşlemler',
      width: 250,
      sortable: false,
      renderCell: (params) => {
        const branch = params.row as Branch;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Detay">
              <IconButton
                size="small"
                onClick={() => navigate(`/regions/branches/${branch.id}`)}
                sx={{ color: theme.palette.info.main }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canAssignPresident && (
              <Tooltip title="Başkan Ata">
                <IconButton
                  size="small"
                  onClick={() => {
                    setBranchToAssign(branch);
                    setSelectedPresidentId(branch.presidentId || '');
                    setAssignDialogOpen(true);
                  }}
                  sx={{ color: theme.palette.secondary.main }}
                >
                  <PersonIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canManage && (
              <>
                <Tooltip title="Düzenle">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(branch)}
                    sx={{ color: theme.palette.primary.main }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sil">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setBranchToDelete(branch);
                      setDeleteDialogOpen(true);
                    }}
                    sx={{ color: theme.palette.error.main }}
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
            <BusinessIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
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
              Şube Yönetimi
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Şubeleri yönetin ve başkan atayın
            </Typography>
          </Box>
        </Box>
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
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            Yeni Şube
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBranch ? 'Şube Düzenle' : 'Yeni Şube Oluştur'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Şube Adı"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Kod"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel>İl</InputLabel>
              <Select
                value={formData.provinceId}
                onChange={(e) => {
                  setFormData({ ...formData, provinceId: e.target.value, districtId: '' });
                  setSelectedProvinceId(e.target.value);
                }}
                label="İl"
              >
                {provinces.map((province) => (
                  <MenuItem key={province.id} value={province.id}>
                    {province.name} {province.code ? `(${province.code})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedProvinceId && (
              <FormControl fullWidth>
                <InputLabel>İlçe (Opsiyonel)</InputLabel>
                <Select
                  value={formData.districtId}
                  onChange={(e) => {
                    setFormData({ ...formData, districtId: e.target.value });
                    setSelectedDistrictId(e.target.value);
                  }}
                  label="İlçe (Opsiyonel)"
                >
                  <MenuItem value="">
                    <em>İlçe seçmeyin</em>
                  </MenuItem>
                  {districts.map((district) => (
                    <MenuItem key={district.id} value={district.id}>
                      {district.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              label="Adres"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Telefon"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />
              <TextField
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
              />
            </Box>
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

      {/* Assign President Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Şube Başkanı Ata</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Başkan Seçimi</InputLabel>
              <Select
                value={selectedPresidentId}
                onChange={(e) => setSelectedPresidentId(e.target.value)}
                label="Başkan Seçimi"
              >
                <MenuItem value="">
                  <em>Başkan seçmeyin</em>
                </MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)} disabled={assigning}>
            İptal
          </Button>
          <Button
            onClick={handleAssign}
            variant="contained"
            disabled={assigning || !selectedPresidentId}
            startIcon={assigning ? <CircularProgress size={16} /> : <PersonIcon />}
          >
            {assigning ? 'Atanıyor...' : 'Ata'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Şubeyi Sil</DialogTitle>
        <DialogContent>
          <Typography>
            "{branchToDelete?.name}" adlı şubeyi silmek istediğinize emin misiniz?
            Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            İptal
          </Button>
          <Button
            onClick={handleDelete}
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

export default BranchesPage;

