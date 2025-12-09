// src/pages/regions/RegionsProvincesPage.tsx
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
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import type { Province } from '../../types/region';
import {
  getProvinces,
  createProvince,
  updateProvince,
} from '../../api/regionsApi';
import { useAuth } from '../../context/AuthContext';

const RegionsProvincesPage: React.FC = () => {
  const [rows, setRows] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProvince, setEditingProvince] = useState<Province | null>(null);
  const [form, setForm] = useState<{ name: string; code: string }>({
    name: '',
    code: '',
  });

  const { hasPermission } = useAuth();
  const canManageBranch = hasPermission('BRANCH_MANAGE');

  const loadProvinces = async () => {
    setLoading(true);
    try {
      const data = await getProvinces();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('İller alınırken hata:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvinces();
  }, []);

  const handleOpenNew = () => {
    setEditingProvince(null);
    setForm({ name: '', code: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (province: Province) => {
    setEditingProvince(province);
    setForm({
      name: province.name,
      code: province.code ?? '',
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
      window.alert('İl adı zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
      };

      if (editingProvince) {
        await updateProvince(editingProvince.id, payload);
      } else {
        await createProvince(payload);
      }

      await loadProvinces();
      setDialogOpen(false);
    } catch (e) {
      console.error('İl kaydedilirken hata:', e);
      window.alert('İl kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef<Province>[] = [
    {
      field: 'name',
      headerName: 'İl Adı',
      flex: 1,
    },
    {
      field: 'code',
      headerName: 'Plaka Kodu',
      width: 140,
      valueGetter: (params: { row?: Province }) => params?.row?.code ?? '',
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
            <Typography variant="h5">İller</Typography>
            <Typography variant="body2" color="text.secondary">
              Sistemde tanımlı illeri görüntüleyebilir, yetkiniz varsa ekleyip düzenleyebilirsiniz.
            </Typography>
          </Box>

          {canManageBranch && (
            <Button variant="contained" size="small" onClick={handleOpenNew}>
              Yeni İl
            </Button>
          )}
        </Box>

        <Box sx={{ height: 480 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
            onRowDoubleClick={(params) => {
              if (!canManageBranch) return;
              const province = rows.find((p) => p.id === params.id);
              if (province) handleOpenEdit(province);
            }}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25, page: 0 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
          />
        </Box>

        {/* İl Ekle / Düzenle Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="xs">
          <DialogTitle>
            {editingProvince ? 'İl Düzenle' : 'Yeni İl'}
          </DialogTitle>
          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField
              label="İl Adı"
              size="small"
              fullWidth
              value={form.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
            />
            <TextField
              label="Plaka Kodu"
              size="small"
              fullWidth
              value={form.code}
              onChange={(e) => handleFormChange('code', e.target.value)}
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

export default RegionsProvincesPage;
