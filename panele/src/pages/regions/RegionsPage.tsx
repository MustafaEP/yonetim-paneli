// src/pages/regions/RegionsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';

import type { Province, District, Workplace, Dealer } from '../../types/region';
import {
  getProvinces,
  createProvince,
  updateProvince,
  getDistricts,
  getWorkplaces,
  getDealers,
} from '../../api/regionsApi';
import { useAuth } from '../../context/AuthContext';
import { canManageBranches } from '../../utils/permissions';

const RegionsPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingWorkplaces, setLoadingWorkplaces] = useState(true);
  const [loadingDealers, setLoadingDealers] = useState(true);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(
    null,
  );
  const [provinceDialogOpen, setProvinceDialogOpen] = useState(false);
  const [editingProvince, setEditingProvince] = useState<Province | null>(null);
  const [provinceForm, setProvinceForm] = useState<{ name: string; code: string }>({
    name: '',
    code: '',
  });
  const [provinceSaving, setProvinceSaving] = useState(false);

  const { user, hasPermission } = useAuth();
  const isBranchManager = canManageBranches(user);
  const canSeeRegions = hasPermission('REGION_LIST') || isBranchManager;

  // 🔹 Kolonlar
  const provinceColumns: GridColDef<Province>[] = [
    { field: 'name', headerName: 'İl Adı', flex: 1 },
    { field: 'code', headerName: 'Plaka Kodu', width: 140 },
  ];

  const districtColumns: GridColDef<District>[] = [
    { field: 'name', headerName: 'İlçe Adı', flex: 1 },
    {
      field: 'provinceName',
      headerName: 'İl',
      flex: 1,
      valueGetter: (params: { row: District }) => params.row.province?.name ?? '',
    },
  ];

  const workplaceColumns: GridColDef<Workplace>[] = [
    { field: 'name', headerName: 'İşyeri Adı', flex: 1 },
    {
      field: 'provinceName',
      headerName: 'İl',
      flex: 1,
      valueGetter: (params: { row: Workplace }) => params.row.province?.name ?? '',
    },
    {
      field: 'districtName',
      headerName: 'İlçe',
      flex: 1,
      valueGetter: (params: { row: Workplace }) => params.row.district?.name ?? '',
    },
    { field: 'address', headerName: 'Adres', flex: 2 },
  ];

  const dealerColumns: GridColDef<Dealer>[] = [
    { field: 'name', headerName: 'Bayi Adı', flex: 1 },
    { field: 'code', headerName: 'Kod', width: 140 },
    {
      field: 'provinceName',
      headerName: 'İl',
      flex: 1,
      valueGetter: (params: { row: Dealer }) => params.row.province?.name ?? '',
    },
    {
      field: 'districtName',
      headerName: 'İlçe',
      flex: 1,
      valueGetter: (params: { row: Dealer }) => params.row.district?.name ?? '',
    },
    { field: 'address', headerName: 'Adres', flex: 2 },
  ];

  // 🔹 Data fetch fonksiyonları
  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const data = await getProvinces();
      setProvinces(data);
    } catch (e) {
      console.error('İller alınırken hata:', e);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadDistricts = async () => {
    setLoadingDistricts(true);
    try {
      const data = await getDistricts(selectedProvinceId || undefined);
      setDistricts(data);
    } catch (e) {
      console.error('İlçeler alınırken hata:', e);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadWorkplaces = async () => {
    setLoadingWorkplaces(true);
    try {
      const data = await getWorkplaces(
        selectedProvinceId ? { provinceId: selectedProvinceId } : undefined,
      );
      setWorkplaces(data);
    } catch (e) {
      console.error('İşyerleri alınırken hata:', e);
    } finally {
      setLoadingWorkplaces(false);
    }
  };

  const loadDealers = async () => {
    setLoadingDealers(true);
    try {
      const data = await getDealers(
        selectedProvinceId ? { provinceId: selectedProvinceId } : undefined,
      );
      setDealers(data);
    } catch (e) {
      console.error('Bayiler alınırken hata:', e);
    } finally {
      setLoadingDealers(false);
    }
  };

  useEffect(() => {
    if (!canSeeRegions) return;

    loadProvinces();
    loadDistricts();
    loadWorkplaces();
    loadDealers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeRegions]);

  // province filter değişince bağlı listeleri tekrar çek
  useEffect(() => {
    if (!canSeeRegions) return;
    loadDistricts();
    loadWorkplaces();
    loadDealers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvinceId]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleProvinceSelectionChange = (selectionModel: GridRowSelectionModel) => {
    const modelArray = Array.isArray(selectionModel) ? selectionModel : [];
    const id = modelArray.length > 0 ? (modelArray[0] as string) : undefined;
    setSelectedProvinceId(id ?? null);
  };

  // 🔹 İl dialog işlemleri
  const openCreateProvinceDialog = () => {
    setEditingProvince(null);
    setProvinceForm({ name: '', code: '' });
    setProvinceDialogOpen(true);
  };

  const openEditProvinceDialog = (province: Province) => {
    setEditingProvince(province);
    setProvinceForm({ name: province.name, code: province.code ?? '' });
    setProvinceDialogOpen(true);
  };

  const handleProvinceFormChange = (field: 'name' | 'code', value: string) => {
    setProvinceForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProvinceSave = async () => {
    if (!provinceForm.name.trim()) return;
    setProvinceSaving(true);
    try {
      if (editingProvince) {
        await updateProvince(editingProvince.id, {
          name: provinceForm.name.trim(),
          code: provinceForm.code.trim() || undefined,
        });
      } else {
        await createProvince({
          name: provinceForm.name.trim(),
          code: provinceForm.code.trim() || undefined,
        });
      }
      await loadProvinces();
      setProvinceDialogOpen(false);
    } catch (e) {
      console.error('İl kaydedilirken hata:', e);
    } finally {
      setProvinceSaving(false);
    }
  };

  if (!canSeeRegions) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Bölge bilgilerini görüntüleme yetkiniz yok.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Bölge Yönetimi
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          İl, ilçe, işyeri ve bayi hiyerarşik yapısını görüntüleyip yönetebilirsiniz.
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab label="İller" />
            <Tab label="İlçeler" />
            <Tab label="İşyerleri" />
            <Tab label="Bayiler" />
          </Tabs>
        </Box>

        {/* İller */}
        {tab === 0 && (
          <Box sx={{ mt: 2 }}>
            {isBranchManager && (
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="small" onClick={openCreateProvinceDialog}>
                  Yeni İl Ekle
                </Button>
              </Box>
            )}

            {loadingProvinces ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ height: 500 }}>
                <DataGrid
                  rows={provinces}
                  columns={provinceColumns}
                  getRowId={(row) => row.id}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25, page: 0 } },
                  }}
                  pageSizeOptions={[10, 25, 50, 100]}
                  onRowDoubleClick={(params) =>
                    isBranchManager && openEditProvinceDialog(params.row)
                  }
                  onRowSelectionModelChange={handleProvinceSelectionChange}
                />
              </Box>
            )}
          </Box>
        )}

        {/* İlçeler */}
        {tab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Üst listeden bir il seçerseniz, sadece o ile bağlı ilçeler listelenir.
            </Typography>
            {loadingDistricts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ height: 500 }}>
                <DataGrid
                  rows={districts}
                  columns={districtColumns}
                  getRowId={(row) => row.id}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25, page: 0 } },
                  }}
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              </Box>
            )}
          </Box>
        )}

        {/* İşyerleri */}
        {tab === 2 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Üst listeden bir il seçerseniz, sadece o ile bağlı işyerleri listelenir.
            </Typography>
            {loadingWorkplaces ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ height: 500 }}>
                <DataGrid
                  rows={workplaces}
                  columns={workplaceColumns}
                  getRowId={(row) => row.id}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25, page: 0 } },
                  }}
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Bayiler */}
        {tab === 3 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Üst listeden bir il seçerseniz, sadece o ile bağlı bayiler listelenir.
            </Typography>
            {loadingDealers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ height: 500 }}>
                <DataGrid
                  rows={dealers}
                  columns={dealerColumns}
                  getRowId={(row) => row.id}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25, page: 0 } },
                  }}
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              </Box>
            )}
          </Box>
        )}

        {/* İl create / edit dialog */}
        <Dialog
          open={provinceDialogOpen}
          onClose={() => !provinceSaving && setProvinceDialogOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>
            {editingProvince ? 'İl Düzenle' : 'Yeni İl Ekle'}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="İl Adı"
              value={provinceForm.name}
              onChange={(e) => handleProvinceFormChange('name', e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Plaka Kodu"
              value={provinceForm.code}
              onChange={(e) => handleProvinceFormChange('code', e.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setProvinceDialogOpen(false)}
              disabled={provinceSaving}
            >
              İptal
            </Button>
            <Button
              onClick={handleProvinceSave}
              disabled={provinceSaving || !provinceForm.name.trim()}
              variant="contained"
            >
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RegionsPage;
