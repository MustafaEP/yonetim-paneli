// src/pages/regions/InstitutionsPage.tsx
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
  useTheme,
  alpha,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';

import type { Province, District, Institution } from '../../types/region';
import {
  getProvinces,
  getDistricts,
  getInstitutions,
  createInstitution,
  updateInstitution,
  approveInstitution,
  deleteInstitution,
} from '../../api/regionsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

const InstitutionsPage: React.FC = () => {
  const theme = useTheme();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedIsActive, setSelectedIsActive] = useState<string>('');

  const [rows, setRows] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [form, setForm] = useState<{
    name: string;
    provinceId: string;
    districtId: string;
    kurumSicilNo: string;
    gorevBirimi: string;
    kurumAdresi: string;
    kadroUnvanKodu: string;
  }>({
    name: '',
    provinceId: '',
    districtId: '',
    kurumSicilNo: '',
    gorevBirimi: '',
    kurumAdresi: '',
    kadroUnvanKodu: '',
  });

  const { hasPermission } = useAuth();
  const toast = useToast();
  const canManageInstitution = hasPermission('INSTITUTION_CREATE') || hasPermission('INSTITUTION_UPDATE');
  const canListInstitution = hasPermission('INSTITUTION_LIST');
  const canApproveInstitution = hasPermission('INSTITUTION_APPROVE');
  const canDeleteInstitution = hasPermission('INSTITUTION_UPDATE');

  const loadProvinces = async () => {
    try {
      const data = await getProvinces();
      setProvinces(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('İller alınırken hata:', e);
      setProvinces([]);
    }
  };

  const loadDistrictsForProvince = async (provinceId?: string) => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }
    try {
      const data = await getDistricts(provinceId);
      setDistricts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('İlçeler alınırken hata:', e);
      setDistricts([]);
    }
  };

  const loadInstitutions = async (provinceId?: string, districtId?: string, isActive?: boolean) => {
    if (!canListInstitution) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getInstitutions({ provinceId, districtId, isActive });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Kurumlar alınırken hata:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvinces();
    loadInstitutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const isActive = selectedIsActive === '' ? undefined : selectedIsActive === 'true';
    loadInstitutions(undefined, undefined, isActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIsActive]);

  const handleOpenNew = () => {
    if (!hasPermission('INSTITUTION_CREATE')) {
      toast.showError('Kurum oluşturmak için yetkiniz yok.');
      return;
    }
    setEditingInstitution(null);
    setForm({
      name: '',
      provinceId: '',
      districtId: '',
      kurumSicilNo: '',
      gorevBirimi: '',
      kurumAdresi: '',
      kadroUnvanKodu: '',
    });
    setDistricts([]);
    setDialogOpen(true);
  };

  const handleOpenEdit = (inst: Institution) => {
    if (!hasPermission('INSTITUTION_UPDATE')) return;
    setEditingInstitution(inst);
    const provinceId = inst.provinceId;
    setForm({
      name: inst.name,
      provinceId,
      districtId: inst.districtId || '',
      kurumSicilNo: inst.kurumSicilNo || '',
      gorevBirimi: inst.gorevBirimi || '',
      kurumAdresi: inst.kurumAdresi || '',
      kadroUnvanKodu: inst.kadroUnvanKodu || '',
    });
    if (provinceId) {
      loadDistrictsForProvince(provinceId);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'provinceId'
        ? {
            districtId: '',
          }
        : {}),
    }));
    if (field === 'provinceId') {
      loadDistrictsForProvince(value);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.showWarning('Kurum adı zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        provinceId: form.provinceId || undefined,
        districtId: form.districtId || undefined,
        kurumSicilNo: form.kurumSicilNo.trim() || undefined,
        gorevBirimi: form.gorevBirimi.trim() || undefined,
        kurumAdresi: form.kurumAdresi.trim() || undefined,
        kadroUnvanKodu: form.kadroUnvanKodu.trim() || undefined,
      };

      if (editingInstitution) {
        if (!hasPermission('INSTITUTION_UPDATE')) {
          toast.showError('Kurum güncellemek için yetkiniz yok.');
          setSaving(false);
          return;
        }
        await updateInstitution(editingInstitution.id, payload);
        toast.showSuccess('Kurum başarıyla güncellendi.');
      } else {
        if (!hasPermission('INSTITUTION_CREATE')) {
          toast.showError('Kurum oluşturmak için yetkiniz yok.');
          setSaving(false);
          return;
        }
        await createInstitution(payload);
        toast.showSuccess('Kurum başarıyla oluşturuldu.');
      }

      const isActive = selectedIsActive === '' ? undefined : selectedIsActive === 'true';
      await loadInstitutions(undefined, undefined, isActive);
      setDialogOpen(false);
    } catch (e) {
      console.error('Kurum kaydedilirken hata:', e);
      toast.showError('Kurum kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!canApproveInstitution) {
      toast.showError('Kurum onaylamak için yetkiniz yok.');
      return;
    }
    try {
      await approveInstitution(id);
      toast.showSuccess('Kurum başarıyla onaylandı.');
      const isActive = selectedIsActive === '' ? undefined : selectedIsActive === 'true';
      await loadInstitutions(undefined, undefined, isActive);
    } catch (e) {
      console.error('Kurum onaylanırken hata:', e);
      toast.showError('Kurum onaylanırken bir hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteInstitution) {
      toast.showError('Kurum silmek için yetkiniz yok.');
      return;
    }
    if (!window.confirm('Bu kurumu silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await deleteInstitution(id);
      toast.showSuccess('Kurum başarıyla silindi.');
      const isActive = selectedIsActive === '' ? undefined : selectedIsActive === 'true';
      await loadInstitutions(undefined, undefined, isActive);
    } catch (e) {
      console.error('Kurum silinirken hata:', e);
      toast.showError('Kurum silinirken bir hata oluştu.');
    }
  };

  const columns: GridColDef<Institution>[] = [
    {
      field: 'name',
      headerName: 'Kurum Adı',
      flex: 1.4,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
          <Typography sx={{ fontWeight: 500 }}>{params.row.name}</Typography>
        </Box>
      ),
    },
    {
      field: 'kurumSicilNo',
      headerName: 'Sicil No',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (params: { row?: Institution }) => params?.row?.kurumSicilNo ?? '-',
    },
    {
      field: 'isActive',
      headerName: 'Durum',
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.isActive ? 'Aktif' : 'Beklemede'}
          color={params.row.isActive ? 'success' : 'warning'}
          size="small"
          icon={params.row.isActive ? <CheckCircleIcon /> : <CancelIcon />}
        />
      ),
    },
    {
      field: 'memberCount',
      headerName: 'Üye Sayısı',
      flex: 0.7,
      minWidth: 100,
      valueGetter: (params: { row?: Institution }) => params?.row?.memberCount ?? 0,
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      flex: 1,
      minWidth: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!params.row.isActive && canApproveInstitution && (
            <IconButton
              size="small"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(params.row.id);
              }}
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          )}
          {canManageInstitution && (
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(params.row);
              }}
            >
              <BusinessIcon fontSize="small" />
            </IconButton>
          )}
          {canDeleteInstitution && (
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(params.row.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  if (!canListInstitution) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Yetkisiz İşlem
            </Typography>
            <Typography>Kurum listesini görüntülemek için gerekli izne sahip değilsiniz.</Typography>
          </Alert>
        </Box>
      </Card>
    );
  }

  return (
    <Box>
      {/* Başlık Bölümü */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              Kurumlar
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Kurumları görüntüleyin ve yönetin
            </Typography>
          </Box>
          {hasPermission('INSTITUTION_CREATE') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenNew}
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
              Yeni Kurum
            </Button>
          )}
        </Box>

        {/* Mobile New Button */}
        {hasPermission('INSTITUTION_CREATE') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            fullWidth
            onClick={handleOpenNew}
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
            Yeni Kurum Ekle
          </Button>
        )}
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
        {/* Filtre Bölümü */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterListIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Filtreler
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr' },
              gap: 2,
              maxWidth: 300,
            }}
          >
            <FormControl
              size="small"
              fullWidth
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
            >
              <InputLabel>Durum</InputLabel>
              <Select
                label="Durum"
                value={selectedIsActive}
                onChange={(e) => setSelectedIsActive(e.target.value as string)}
              >
                <MenuItem value="">
                  <em>Tümü</em>
                </MenuItem>
                <MenuItem value="true">Aktif</MenuItem>
                <MenuItem value="false">Beklemede</MenuItem>
              </Select>
            </FormControl>
          </Box>
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
                <BusinessIcon fontSize="small" />
                Toplam {rows.length} kurum bulundu
              </Typography>
            </Paper>
          )}

          {/* Tablo */}
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
                cursor: canManageInstitution ? 'pointer' : 'default',
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
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              loading={loading}
              onRowDoubleClick={(params) => {
                const inst = rows.find((x) => x.id === params.id);
                if (inst && canManageInstitution) handleOpenEdit(inst);
              }}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25, page: 0 },
                },
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

      {/* Kurum Ekle / Düzenle Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '1.25rem',
            pb: 1,
          }}
        >
          {editingInstitution ? 'Kurum Düzenle' : 'Yeni Kurum'}
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            mt: 1,
          }}
        >
          <FormControl
            fullWidth
            size="small"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          >
            <InputLabel>İl *</InputLabel>
            <Select
              label="İl *"
              value={form.provinceId}
              onChange={(e) => handleFormChange('provinceId', e.target.value as string)}
            >
              <MenuItem value="">
                <em>Seçiniz</em>
              </MenuItem>
              {provinces.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            size="small"
            disabled={!form.provinceId}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          >
            <InputLabel>İlçe</InputLabel>
            <Select
              label="İlçe"
              value={form.districtId}
              onChange={(e) => handleFormChange('districtId', e.target.value as string)}
            >
              <MenuItem value="">
                <em>Seçilmedi</em>
              </MenuItem>
              {districts.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Kurum Adı"
            size="small"
            fullWidth
            value={form.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            label="Kurum Sicil No"
            size="small"
            fullWidth
            value={form.kurumSicilNo}
            onChange={(e) => handleFormChange('kurumSicilNo', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            label="Görev Birimi"
            size="small"
            fullWidth
            value={form.gorevBirimi}
            onChange={(e) => handleFormChange('gorevBirimi', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            label="Kurum Adresi"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={form.kurumAdresi}
            onChange={(e) => handleFormChange('kurumAdresi', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            label="Kadro Ünvan Kodu"
            size="small"
            fullWidth
            value={form.kadroUnvanKodu}
            onChange={(e) => handleFormChange('kadroUnvanKodu', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={saving}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 100,
            }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstitutionsPage;

