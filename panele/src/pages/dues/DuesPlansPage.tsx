import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
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
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { type DuesPlan } from '../../types/dues';
import { getDuesPlans, createDuesPlan, updateDuesPlan, deleteDuesPlan } from '../../api/duesApi';
import { useAuth } from '../../context/AuthContext';
import { canManageDuesPlans, hasAnyRole } from '../../utils/permissions';

const DuesPlansPage: React.FC = () => {
  const [rows, setRows] = useState<DuesPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DuesPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<DuesPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    period: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    isActive: true,
  });

  const { user } = useAuth();
  const isManager = canManageDuesPlans(user);
  const isHighLevel = hasAnyRole(user, ['ADMIN', 'GENEL_BASKAN', 'GENEL_SEKRETER']);

  const handleOpenDialog = (plan?: DuesPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        amount: plan.amount.toString(),
        period: plan.period,
        isActive: plan.isActive,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        amount: '',
        period: 'MONTHLY',
        isActive: true,
      });
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPlan(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.amount) {
      setError('Plan adı ve tutar zorunludur');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Geçerli bir tutar giriniz');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingPlan) {
        await updateDuesPlan(editingPlan.id, {
          name: formData.name,
          description: formData.description || undefined,
          amount,
          period: formData.period,
          isActive: formData.isActive,
        });
      } else {
        await createDuesPlan({
          name: formData.name,
          description: formData.description || undefined,
          amount,
          period: formData.period,
        });
      }
      await loadPlans();
      handleCloseDialog();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'İşlem başarısız oldu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (plan: DuesPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!planToDelete) return;

    setDeleting(true);
    try {
      await deleteDuesPlan(planToDelete.id);
      await loadPlans();
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Plan silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await getDuesPlans(isHighLevel);
      setRows(data);
    } catch (error) {
      console.error('Aidat planları alınırken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef<DuesPlan>[] = [
    { field: 'name', headerName: 'Plan Adı', flex: 1 },
    { field: 'description', headerName: 'Açıklama', flex: 1 },
    {
      field: 'amount',
      headerName: 'Tutar (TL)',
      width: 140,
      valueFormatter: (params) => {
        const amount = typeof params.value === 'number' ? params.value : Number(params.value || 0);
        return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },
    },
    {
      field: 'period',
      headerName: 'Periyot',
      width: 140,
      valueFormatter: (params) =>
        params.value === 'MONTHLY' ? 'Aylık' : 'Yıllık',
    },
    {
      field: 'isActive',
      headerName: 'Durum',
      width: 140,
      renderCell: (params) =>
        params.value ? (
          <Chip label="Aktif" color="success" size="small" />
        ) : (
          <Chip label="Pasif" size="small" />
        ),
    },
    ...(isManager
      ? [
          {
            field: 'actions',
            headerName: 'İşlemler',
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams<DuesPlan>) => (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Düzenle">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog(params.row);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sil">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(params.row);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ),
          } as GridColDef<DuesPlan>,
        ]
      : []),
  ];

  useEffect(() => {
    loadPlans();
  }, [isHighLevel]);

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Aidat Planları
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sistemde tanımlı aidat planları listelenir.{' '}
                {isHighLevel
                  ? '(Aktif + pasif planlar görünüyor.)'
                  : '(Sadece aktif planlar görünüyor.)'}
              </Typography>
            </Box>
            {isManager && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Yeni Plan
              </Button>
            )}
          </Box>

        <Box sx={{ height: 500, minHeight: 500, mt: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </Box>
      </CardContent>
    </Card>

      {/* Ekleme/Düzenleme Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPlan ? 'Aidat Planını Düzenle' : 'Yeni Aidat Planı'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Plan Adı"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Açıklama"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              label="Tutar (TL)"
              required
              fullWidth
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Periyot</InputLabel>
              <Select
                value={formData.period}
                label="Periyot"
                onChange={(e) => setFormData({ ...formData, period: e.target.value as 'MONTHLY' | 'YEARLY' })}
              >
                <MenuItem value="MONTHLY">Aylık</MenuItem>
                <MenuItem value="YEARLY">Yıllık</MenuItem>
              </Select>
            </FormControl>
            {editingPlan && (
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  label="Durum"
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                >
                  <MenuItem value="active">Aktif</MenuItem>
                  <MenuItem value="inactive">Pasif</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Kaydediliyor...' : editingPlan ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Planı Sil</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{planToDelete?.name}</strong> adlı aidat planını silmek istediğinize emin misiniz?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Bu plan üyelere atanmışsa silinemeyebilir.
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
          >
            {deleting ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DuesPlansPage;
