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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Divider,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

import type { Province, District, Institution } from '../../types/region';
import {
  getProvinces,
  getDistricts,
  getInstitutions,
  createInstitution,
  approveInstitution,
  deleteInstitution,
  type DeleteInstitutionDto,
} from '../../api/regionsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

const InstitutionsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [rows, setRows] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingInstitution, setDeletingInstitution] = useState<Institution | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteActionType, setDeleteActionType] = useState<DeleteInstitutionDto['memberActionType']>('REMOVE_INSTITUTION');
  const [deleteTargetInstitutionId, setDeleteTargetInstitutionId] = useState<string>('');
  const [availableInstitutions, setAvailableInstitutions] = useState<Institution[]>([]);
  const [form, setForm] = useState<{
    name: string;
    provinceId: string;
    districtId: string;
  }>({
    name: '',
    provinceId: '',
    districtId: '',
  });

  const { hasPermission } = useAuth();
  const toast = useToast();
  const canManageInstitution = hasPermission('INSTITUTION_CREATE') || hasPermission('INSTITUTION_UPDATE');
  const canListInstitution = hasPermission('INSTITUTION_LIST');
  const canApproveInstitution = hasPermission('INSTITUTION_APPROVE');
  const canDeleteInstitution = hasPermission('INSTITUTION_UPDATE');
  const canViewInstitution = hasPermission('INSTITUTION_LIST');

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

  const handleOpenNew = () => {
    if (!hasPermission('INSTITUTION_CREATE')) {
      toast.showError('Kurum oluşturmak için yetkiniz yok.');
      return;
    }
    setForm({
      name: '',
      provinceId: '',
      districtId: '',
    });
    setDistricts([]);
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
      };

      if (!hasPermission('INSTITUTION_CREATE')) {
        toast.showError('Kurum oluşturmak için yetkiniz yok.');
        setSaving(false);
        return;
      }
      await createInstitution(payload);
      toast.showSuccess('Kurum başarıyla oluşturuldu.');

      await loadInstitutions();
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
      await loadInstitutions();
    } catch (e) {
      console.error('Kurum onaylanırken hata:', e);
      toast.showError('Kurum onaylanırken bir hata oluştu.');
    }
  };

  const handleDeleteClick = async (inst: Institution) => {
    if (!canDeleteInstitution) {
      toast.showError('Kurum kaldırmak için yetkiniz yok.');
      return;
    }
    setDeletingInstitution(inst);
    setDeleteActionType('REMOVE_INSTITUTION');
    setDeleteTargetInstitutionId('');
    // Mevcut kurumu listeden çıkararak hedef kurum listesini hazırla
    const allInstitutions = await getInstitutions();
    const filtered = allInstitutions.filter(i => i.id !== inst.id && i.isActive);
    setAvailableInstitutions(filtered);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingInstitution) return;

    // Transfer seçenekleri için hedef kurum kontrolü
    if (
      (deleteActionType === 'TRANSFER_TO_INSTITUTION' ||
        deleteActionType === 'TRANSFER_AND_DEACTIVATE' ||
        deleteActionType === 'TRANSFER_AND_CANCEL') &&
      !deleteTargetInstitutionId
    ) {
      toast.showError('Lütfen hedef kurum seçin');
      return;
    }

    setDeleting(true);
    try {
      const dto: DeleteInstitutionDto = {
        memberActionType: deleteActionType,
        ...(deleteTargetInstitutionId && { targetInstitutionId: deleteTargetInstitutionId }),
      };
      await deleteInstitution(deletingInstitution.id, dto);
      toast.showSuccess('Kurum başarıyla kaldırıldı.');
      setDeleteDialogOpen(false);
      setDeletingInstitution(null);
      await loadInstitutions();
    } catch (e: any) {
      console.error('Kurum kaldırılırken hata:', e);
      toast.showError(e.response?.data?.message || 'Kurum kaldırılırken bir hata oluştu.');
    } finally {
      setDeleting(false);
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
          {canViewInstitution && (
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/institutions/${params.row.id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          )}
          {canDeleteInstitution && (
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
    <Box sx={{ 
      minHeight: '100vh',
      background: (theme) => 
        theme.palette.mode === 'light' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`
          : theme.palette.background.default,
      pb: 4,
    }}>
      {/* Modern Header */}
      <Box sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 3, md: 4 } }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            color: 'white',
            overflow: 'visible',
            position: 'relative',
            boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.3)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 4,
              padding: '2px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
              >
                <BusinessIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'white' }} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                    mb: 1,
                  }}
                >
                  Kurumlar
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    opacity: 0.95,
                    fontSize: { xs: '0.875rem', md: '1rem' },
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
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    backgroundColor: 'white',
                    color: theme.palette.success.main,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    '&:hover': {
                      backgroundColor: alpha('#fff', 0.9),
                      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  Yeni Kurum
                </Button>
              )}
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Ana Kart */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: `0 12px 28px ${alpha(theme.palette.success.main, 0.12)}`,
            transform: 'translateY(-2px)',
          }
        }}
      >

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
                if (canViewInstitution) {
                  navigate(`/institutions/${params.id}`);
                }
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

      {/* Kurum Kaldır Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.15)}`,
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            pb: 1,
            pt: 3,
            px: 3,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: theme.palette.error.main,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
              }}
            >
              <DeleteIcon />
            </Box>
            Kurumu Sil
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                "{deletingInstitution?.name}" adlı kurumu silmek istediğinize emin misiniz?
              </Typography>
              <Typography variant="body2">
                Bu kuruma bağlı {deletingInstitution?.memberCount || 0} üye bulunmaktadır. 
                Kurumu silmeden önce üyelere ne yapılacağını seçmeniz gerekmektedir.
              </Typography>
            </Alert>

            <Box>
              <FormLabel sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.95rem', display: 'block' }}>
                Üyelere Ne Yapılacak?
              </FormLabel>
              <RadioGroup
                value={deleteActionType}
                onChange={(e) => {
                  setDeleteActionType(e.target.value as DeleteInstitutionDto['memberActionType']);
                  setDeleteTargetInstitutionId('');
                }}
                sx={{ gap: 1 }}
              >
                <FormControlLabel
                  value="REMOVE_INSTITUTION"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Kurum Bilgisini Kaldır
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyeler kurumsuz kalacak, durumları değişmeyecek
                      </Typography>
                    </Box>
                  }
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    p: 1.5,
                    m: 0,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                />
                <FormControlLabel
                  value="TRANSFER_TO_INSTITUTION"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Başka Bir Kuruma Taşı
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyeler seçilen kuruma taşınacak, durumları değişmeyecek
                      </Typography>
                    </Box>
                  }
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    p: 1.5,
                    m: 0,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                />
                <FormControlLabel
                  value="REMOVE_AND_DEACTIVATE"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Kurum Bilgisini Kaldır ve Pasif Et
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyeler kurumsuz kalacak ve pasif duruma getirilecek
                      </Typography>
                    </Box>
                  }
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    p: 1.5,
                    m: 0,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                    },
                  }}
                />
                <FormControlLabel
                  value="TRANSFER_AND_DEACTIVATE"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Başka Bir Kuruma Taşı ve Pasif Et
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyeler seçilen kuruma taşınacak ve pasif duruma getirilecek
                      </Typography>
                    </Box>
                  }
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    p: 1.5,
                    m: 0,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.warning.main, 0.04),
                    },
                  }}
                />
                <FormControlLabel
                  value="TRANSFER_AND_CANCEL"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Başka Bir Kuruma Taşı ve İptal Et
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyeler seçilen kuruma taşınacak ve üyelikleri iptal edilecek (İstifa)
                      </Typography>
                    </Box>
                  }
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    p: 1.5,
                    m: 0,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.04),
                    },
                  }}
                />
              </RadioGroup>
            </Box>

            {(deleteActionType === 'TRANSFER_TO_INSTITUTION' ||
              deleteActionType === 'TRANSFER_AND_DEACTIVATE' ||
              deleteActionType === 'TRANSFER_AND_CANCEL') && (
              <>
                <Divider />
                <FormControl fullWidth required>
                  <InputLabel>Hedef Kurum</InputLabel>
                  <Select
                    value={deleteTargetInstitutionId}
                    onChange={(e) => setDeleteTargetInstitutionId(e.target.value as string)}
                    label="Hedef Kurum"
                    disabled={deleting}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.divider, 0.2),
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Hedef kurum seçin</em>
                    </MenuItem>
                    {availableInstitutions.map((inst) => (
                      <MenuItem key={inst.id} value={inst.id}>
                        {inst.name}
                        {inst.memberCount !== undefined && ` (${inst.memberCount} üye)`}
                      </MenuItem>
                    ))}
                  </Select>
                  <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
                    Üyeler bu kuruma taşınacaktır
                  </Alert>
                </FormControl>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeletingInstitution(null);
              setDeleteActionType('REMOVE_INSTITUTION');
              setDeleteTargetInstitutionId('');
            }} 
            disabled={deleting}
            sx={{ 
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting || ((deleteActionType === 'TRANSFER_TO_INSTITUTION' ||
              deleteActionType === 'TRANSFER_AND_DEACTIVATE' ||
              deleteActionType === 'TRANSFER_AND_CANCEL') && !deleteTargetInstitutionId)}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.4)}`,
              },
            }}
          >
            {deleting ? 'Siliniyor...' : 'Kurumu Sil'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kurum Ekle Dialog */}
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
          Yeni Kurum
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

