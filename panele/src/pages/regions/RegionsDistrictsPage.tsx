// src/pages/regions/RegionsDistrictsPage.tsx
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

import type { Province, District } from '../../types/region';
import {
  getProvinces,
  getDistricts,
  createDistrict,
  updateDistrict,
} from '../../api/regionsApi';
import { useAuth } from '../../context/AuthContext';

const RegionsDistrictsPage: React.FC = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [rows, setRows] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [form, setForm] = useState<{ name: string; provinceId: string }>({
    name: '',
    provinceId: '',
  });

  const { hasPermission } = useAuth();
  const canManageBranch = hasPermission('BRANCH_MANAGE');

  const loadProvinces = async () => {
    try {
      const data = await getProvinces();
      setProvinces(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('İller alınırken hata:', e);
      setProvinces([]);
    }
  };

  const loadDistricts = async (provinceId?: string) => {
    setLoading(true);
    try {
      const data = await getDistricts(provinceId);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('İlçeler alınırken hata:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvinces();
    loadDistricts(); // başta tüm ilçeler
  }, []);

  useEffect(() => {
    if (selectedProvinceId) {
      loadDistricts(selectedProvinceId);
    } else {
      loadDistricts();
    }
  }, [selectedProvinceId]);

  const handleOpenNew = () => {
    setEditingDistrict(null);
    setForm({
      name: '',
      provinceId: selectedProvinceId || '',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (district: District) => {
    setEditingDistrict(district);
    setForm({
      name: district.name,
      provinceId: district.provinceId,
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
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      window.alert('İlçe adı zorunludur.');
      return;
    }
    if (!form.provinceId) {
      window.alert('İl seçimi zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        provinceId: form.provinceId,
      };

      if (editingDistrict) {
        await updateDistrict(editingDistrict.id, payload);
      } else {
        await createDistrict(payload);
      }

      await loadDistricts(selectedProvinceId || form.provinceId);
      setDialogOpen(false);
    } catch (e) {
      console.error('İlçe kaydedilirken hata:', e);
      window.alert('İlçe kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef<District>[] = [
    {
      field: 'name',
      headerName: 'İlçe Adı',
      flex: 1,
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 1,
      valueGetter: (params: { row?: District }) => params?.row?.province?.name ?? '',
    },
  ];

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
            <Typography variant="h5">İlçeler</Typography>
            <Typography variant="body2" color="text.secondary">
              İllere bağlı ilçeleri görüntüleyebilir, yetkiniz varsa ekleyip düzenleyebilirsiniz.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>İl Filtresi</InputLabel>
              <Select
                label="İl Filtresi"
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

            {canManageBranch && (
              <Button variant="contained" size="small" onClick={handleOpenNew}>
                Yeni İlçe
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
              if (!canManageBranch) return;
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

        {/* İlçe Ekle / Düzenle Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>
            {editingDistrict ? 'İlçe Düzenle' : 'Yeni İlçe'}
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
                {provinces.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} {p.code ? `(${p.code})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="İlçe Adı"
              size="small"
              fullWidth
              value={form.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
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

export default RegionsDistrictsPage;
