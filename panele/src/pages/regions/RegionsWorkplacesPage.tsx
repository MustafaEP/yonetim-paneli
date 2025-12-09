// src/pages/regions/RegionsWorkplacesPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
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
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import type { Province, District, Workplace } from '../../types/region';
import {
  getProvinces,
  getDistricts,
  getWorkplaces,
  createWorkplace,
  updateWorkplace,
} from '../../api/regionsApi';
import { useAuth } from '../../context/AuthContext';

const RegionsWorkplacesPage: React.FC = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');

  const [rows, setRows] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<Workplace | null>(
    null,
  );
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
  const canManageWorkplace = hasPermission('WORKPLACE_MANAGE'); // CRUD
  const canListWorkplace = hasPermission('WORKPLACE_LIST'); // liste görme

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

  const loadWorkplaces = async (
    provinceId?: string,
    districtId?: string,
  ) => {
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
    // İl değişince ilçe listesini yükle
    loadDistrictsForProvince(selectedProvinceId);
    // Filtreye göre işyerlerini getir
    loadWorkplaces(
      selectedProvinceId || undefined,
      selectedDistrictId || undefined,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvinceId]);

  useEffect(() => {
    loadWorkplaces(
      selectedProvinceId || undefined,
      selectedDistrictId || undefined,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrictId]);

  const handleOpenNew = () => {
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
    setEditingWorkplace(w);
    setForm({
      name: w.name,
      address: w.address ?? '',
      provinceId: w.province?.id ?? '',
      districtId: w.district?.id ?? '',
    });
    // il/ilçe filtreleri de uyumlu olsun diye:
    setSelectedProvinceId(w.province?.id ?? '');
    setSelectedDistrictId(w.district?.id ?? '');
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
      window.alert('İşyeri adı zorunludur.');
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
        await updateWorkplace(editingWorkplace.id, payload);
      } else {
        await createWorkplace(payload);
      }

      await loadWorkplaces(
        selectedProvinceId || form.provinceId || undefined,
        selectedDistrictId || form.districtId || undefined,
      );
      setDialogOpen(false);
    } catch (e) {
      console.error('İşyeri kaydedilirken hata:', e);
      window.alert('İşyeri kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef<Workplace>[] = [
    {
      field: 'name',
      headerName: 'İşyeri Adı',
      flex: 1.3,
    },
    {
      field: 'address',
      headerName: 'Adres',
      flex: 2,
      valueGetter: (params: { row?: Workplace }) => params?.row?.address ?? '',
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 0.8,
      valueGetter: (params: { row?: Workplace }) => params?.row?.province?.name ?? '',
    },
    {
      field: 'district',
      headerName: 'İlçe',
      flex: 0.8,
      valueGetter: (params: { row?: Workplace }) => params?.row?.district?.name ?? '',
    },
  ];

  if (!canListWorkplace) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Yetkisiz İşlem</Typography>
        <Typography color="text.secondary">
          İşyeri listesini görüntülemek için gerekli izne sahip değilsiniz.
        </Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h5">İşyerleri</Typography>
            <Typography variant="body2" color="text.secondary">
              İllere ve ilçelere göre işyerlerini görüntüleyebilir, yetkiniz varsa ekleyip düzenleyebilirsiniz.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>İl</InputLabel>
              <Select
                label="İl"
                value={selectedProvinceId}
                onChange={(e) =>
                  setSelectedProvinceId(e.target.value as string)
                }
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
              sx={{ minWidth: 160 }}
              disabled={!selectedProvinceId}
            >
              <InputLabel>İlçe</InputLabel>
              <Select
                label="İlçe"
                value={selectedDistrictId}
                onChange={(e) =>
                  setSelectedDistrictId(e.target.value as string)
                }
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

            {canManageWorkplace && (
              <Button variant="contained" size="small" onClick={handleOpenNew}>
                Yeni İşyeri
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ height: 480 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
            onRowDoubleClick={(params) => {
              if (!canManageWorkplace) return;
              const w = rows.find((x) => x.id === params.id);
              if (w) handleOpenEdit(w);
            }}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25, page: 0 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
          />
        </Box>

        {/* İşyeri Ekle / Düzenle Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>
            {editingWorkplace ? 'İşyeri Düzenle' : 'Yeni İşyeri'}
          </DialogTitle>
          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>İl</InputLabel>
              <Select
                label="İl"
                value={form.provinceId}
                onChange={(e) =>
                  handleFormChange('provinceId', e.target.value as string)
                }
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
            >
              <InputLabel>İlçe</InputLabel>
              <Select
                label="İlçe"
                value={form.districtId}
                onChange={(e) =>
                  handleFormChange('districtId', e.target.value as string)
                }
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
            />

            <TextField
              label="Adres"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={form.address}
              onChange={(e) => handleFormChange('address', e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving} variant="contained">
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RegionsWorkplacesPage;
