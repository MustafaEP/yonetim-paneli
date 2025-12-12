// src/pages/regions/RegionsWorkplacesPage.tsx
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
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import type { Province, District, Workplace } from '../../types/region';
import {
  getProvinces,
  getDistricts,
  getWorkplaces,
  createWorkplace,
  updateWorkplace,
} from '../../api/regionsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

const RegionsWorkplacesPage: React.FC = () => {
  const theme = useTheme();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');

  const [rows, setRows] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<Workplace | null>(null);
  const [form, setForm] = useState<{
    name: string;
    address: string;
    provinceId: string;
    districtId: string;
  }>({
    name: '',
    address: '',
    provinceId: '',
    districtId: '',
  });

  const { hasPermission } = useAuth();
  const toast = useToast();
  const canManageWorkplace = hasPermission('WORKPLACE_MANAGE');
  const canListWorkplace = hasPermission('WORKPLACE_LIST');

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

  const loadWorkplaces = async (provinceId?: string, districtId?: string) => {
    if (!canListWorkplace) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getWorkplaces({ provinceId, districtId });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('İşyerleri alınırken hata:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvinces();
    loadWorkplaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDistrictsForProvince(selectedProvinceId);
    loadWorkplaces(selectedProvinceId || undefined, selectedDistrictId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvinceId]);

  useEffect(() => {
    loadWorkplaces(selectedProvinceId || undefined, selectedDistrictId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrictId]);

  const handleOpenNew = () => {
    if (!canManageWorkplace) {
      toast.showError('İşyeri oluşturmak için yetkiniz yok.');
      return;
    }
    setEditingWorkplace(null);
    setForm({
      name: '',
      address: '',
      provinceId: selectedProvinceId || '',
      districtId: selectedDistrictId || '',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (w: Workplace) => {
    if (!canManageWorkplace) return;
    setEditingWorkplace(w);
    setForm({
      name: w.name,
      address: w.address ?? '',
      provinceId: w.province?.id ?? '',
      districtId: w.district?.id ?? '',
    });
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
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.showWarning('İşyeri adı zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        provinceId: form.provinceId || undefined,
        districtId: form.districtId || undefined,
      };

      if (editingWorkplace) {
        if (!canManageWorkplace) {
          toast.showError('İşyeri güncellemek için yetkiniz yok.');
          setSaving(false);
          return;
        }
        await updateWorkplace(editingWorkplace.id, payload);
        toast.showSuccess('İşyeri başarıyla güncellendi.');
      } else {
        if (!canManageWorkplace) {
          toast.showError('İşyeri oluşturmak için yetkiniz yok.');
          setSaving(false);
          return;
        }
        await createWorkplace(payload);
        toast.showSuccess('İşyeri başarıyla oluşturuldu.');
      }

      await loadWorkplaces(
        selectedProvinceId || form.provinceId || undefined,
        selectedDistrictId || form.districtId || undefined,
      );
      setDialogOpen(false);
    } catch (e) {
      console.error('İşyeri kaydedilirken hata:', e);
      toast.showError('İşyeri kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef<Workplace>[] = [
    {
      field: 'name',
      headerName: 'İşyeri Adı',
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
      field: 'address',
      headerName: 'Adres',
      flex: 2,
      minWidth: 200,
      valueGetter: (params: { row?: Workplace }) => params?.row?.address ?? '',
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (params: { row?: Workplace }) => params?.row?.province?.name ?? '',
    },
    {
      field: 'district',
      headerName: 'İlçe',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (params: { row?: Workplace }) => params?.row?.district?.name ?? '',
    },
  ];

  if (!canListWorkplace) {
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
            <Typography variant="h6" sx={{ mb: 1 }}>Yetkisiz İşlem</Typography>
            <Typography>
              İşyeri listesini görüntülemek için gerekli izne sahip değilsiniz.
            </Typography>
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
              İşyerleri
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              İllere ve ilçelere göre işyerlerini görüntüleyin ve yönetin
            </Typography>
          </Box>
          {canManageWorkplace && (
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
              Yeni İşyeri
            </Button>
          )}
        </Box>

        {/* Mobile New Button */}
        {canManageWorkplace && (
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
            Yeni İşyeri Ekle
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
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
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
              <InputLabel>İl</InputLabel>
              <Select
                label="İl"
                value={selectedProvinceId}
                onChange={(e) => setSelectedProvinceId(e.target.value as string)}
              >
                <MenuItem value="">
                  <em>Tümü</em>
                </MenuItem>
                {provinces.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} {p.code ? `(${p.code})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              size="small"
              fullWidth
              disabled={!selectedProvinceId}
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
              <InputLabel>İlçe</InputLabel>
              <Select
                label="İlçe"
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value as string)}
              >
                <MenuItem value="">
                  <em>Tümü</em>
                </MenuItem>
                {districts.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
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
                Toplam {rows.length} işyeri bulundu
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
                cursor: canManageWorkplace ? 'pointer' : 'default',
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
                const w = rows.find((x) => x.id === params.id);
                if (w) handleOpenEdit(w);
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

      {/* İşyeri Ekle / Düzenle Dialog */}
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
          {editingWorkplace ? 'İşyeri Düzenle' : 'Yeni İşyeri'}
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          >
            <InputLabel>İl</InputLabel>
            <Select
              label="İl"
              value={form.provinceId}
              onChange={(e) => handleFormChange('provinceId', e.target.value as string)}
            >
              <MenuItem value="">
                <em>Seçilmedi</em>
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
            label="İşyeri Adı"
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
            label="Adres"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={form.address}
            onChange={(e) => handleFormChange('address', e.target.value)}
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

export default RegionsWorkplacesPage;