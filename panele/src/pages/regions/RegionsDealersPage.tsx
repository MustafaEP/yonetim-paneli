// src/pages/regions/RegionsDealersPage.tsx
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

import type{ Province, District, Dealer } from '../../types/region';
import {
  getProvinces,
  getDistricts,
  getDealers,
  createDealer,
  updateDealer,
} from '../../api/regionsApi';
import { useAuth } from '../../context/AuthContext';

const RegionsDealersPage: React.FC = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');

  const [rows, setRows] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [form, setForm] = useState<{
    name: string;
    code: string;
    address: string;
    provinceId: string;
    districtId: string;
  }>({
    name: '',
    code: '',
    address: '',
    provinceId: '',
    districtId: '',
  });

  const { hasPermission } = useAuth();
  const canListDealer = hasPermission('DEALER_LIST');
  const canCreateDealer = hasPermission('DEALER_CREATE');
  const canUpdateDealer = hasPermission('DEALER_UPDATE');

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

  const loadDealers = async (provinceId?: string, districtId?: string) => {
    if (!canListDealer) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getDealers({ provinceId, districtId });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Bayiler alınırken hata:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvinces();
    loadDealers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDistrictsForProvince(selectedProvinceId);
    loadDealers(selectedProvinceId || undefined, selectedDistrictId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvinceId]);

  useEffect(() => {
    loadDealers(selectedProvinceId || undefined, selectedDistrictId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrictId]);

  const handleOpenNew = () => {
    if (!canCreateDealer) {
      window.alert('Bayi oluşturmak için yetkiniz yok.');
      return;
    }
    setEditingDealer(null);
    setForm({
      name: '',
      code: '',
      address: '',
      provinceId: selectedProvinceId || '',
      districtId: selectedDistrictId || '',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (d: Dealer) => {
    if (!canUpdateDealer) return;
    setEditingDealer(d);
    setForm({
      name: d.name,
      code: d.code ?? '',
      address: d.address ?? '',
      provinceId: d.province?.id ?? '',
      districtId: d.district?.id ?? '',
    });
    setSelectedProvinceId(d.province?.id ?? '');
    setSelectedDistrictId(d.district?.id ?? '');
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
      window.alert('Bayi adı zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        address: form.address.trim() || undefined,
        provinceId: form.provinceId || undefined,
        districtId: form.districtId || undefined,
      };

      if (editingDealer) {
        if (!canUpdateDealer) {
          window.alert('Bayi güncellemek için yetkiniz yok.');
          setSaving(false);
          return;
        }
        await updateDealer(editingDealer.id, payload);
      } else {
        if (!canCreateDealer) {
          window.alert('Bayi oluşturmak için yetkiniz yok.');
          setSaving(false);
          return;
        }
        await createDealer(payload);
      }

      await loadDealers(
        selectedProvinceId || form.provinceId || undefined,
        selectedDistrictId || form.districtId || undefined,
      );
      setDialogOpen(false);
    } catch (e) {
      console.error('Bayi kaydedilirken hata:', e);
      window.alert('Bayi kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef<Dealer>[] = [
    {
      field: 'name',
      headerName: 'Bayi Adı',
      flex: 1.4,
    },
    {
      field: 'code',
      headerName: 'Kod',
      width: 130,
      valueGetter: (params: { row?: Dealer }) => params?.row?.code ?? '',
    },
    {
      field: 'address',
      headerName: 'Adres',
      flex: 2,
      valueGetter: (params: { row?: Dealer }) => params?.row?.address ?? '',
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 0.8,
      valueGetter: (params: { row?: Dealer }) => params?.row?.province?.name ?? '',
    },
    {
      field: 'district',
      headerName: 'İlçe',
      flex: 0.8,
      valueGetter: (params: { row?: Dealer }) => params?.row?.district?.name ?? '',
    },
  ];

  if (!canListDealer) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Yetkisiz İşlem</Typography>
        <Typography color="text.secondary">
          Bayi listesini görüntülemek için gerekli izne sahip değilsiniz.
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
            <Typography variant="h5">Bayiler</Typography>
            <Typography variant="body2" color="text.secondary">
              İllere ve ilçelere göre bayileri görüntüleyebilir, yetkiniz varsa ekleyip düzenleyebilirsiniz.
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

            {canCreateDealer && (
              <Button variant="contained" size="small" onClick={handleOpenNew}>
                Yeni Bayi
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
              const d = rows.find((x) => x.id === params.id);
              if (d) handleOpenEdit(d);
            }}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25, page: 0 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
          />
        </Box>

        {/* Bayi Ekle / Düzenle Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>{editingDealer ? 'Bayi Düzenle' : 'Yeni Bayi'}</DialogTitle>
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
              label="Bayi Adı"
              size="small"
              fullWidth
              value={form.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
            />

            <TextField
              label="Bayi Kodu"
              size="small"
              fullWidth
              value={form.code}
              onChange={(e) => handleFormChange('code', e.target.value)}
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

export default RegionsDealersPage;
