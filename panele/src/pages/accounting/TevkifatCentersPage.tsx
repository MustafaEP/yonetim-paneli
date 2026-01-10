// src/pages/accounting/TevkifatCentersPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getTevkifatCenters,
  deleteTevkifatCenter,
  getTevkifatTitles,
  createTevkifatTitle,
  updateTevkifatTitle,
  deleteTevkifatTitle,
  type TevkifatCenter,
  type DeleteTevkifatCenterDto,
  type TevkifatTitle,
  type CreateTevkifatTitleDto,
} from '../../api/accountingApi';
import {
  getProfessions,
  getAllProfessions,
  createProfession,
  updateProfession,
  deleteProfession,
  type Profession,
} from '../../api/professionsApi';

const TevkifatCentersPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(0);
  
  // Tevkifat Merkezileri state
  const [rows, setRows] = useState<TevkifatCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCenter, setDeletingCenter] = useState<TevkifatCenter | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteActionType, setDeleteActionType] = useState<DeleteTevkifatCenterDto['memberActionType']>('REMOVE_TEVKIFAT_CENTER');
  const [deleteTargetTevkifatCenterId, setDeleteTargetTevkifatCenterId] = useState<string>('');

  // Tevkifat Unvanları state
  const [titles, setTitles] = useState<TevkifatTitle[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<TevkifatTitle | null>(null);
  const [titleForm, setTitleForm] = useState<CreateTevkifatTitleDto>({ name: '' });
  const [savingTitle, setSavingTitle] = useState(false);
  const [deleteTitleDialogOpen, setDeleteTitleDialogOpen] = useState(false);
  const [deactivateTitleDialogOpen, setDeactivateTitleDialogOpen] = useState(false);
  const [deletingTitle, setDeletingTitle] = useState<TevkifatTitle | null>(null);
  const [deactivatingTitle, setDeactivatingTitle] = useState<TevkifatTitle | null>(null);

  // Meslek/Unvanlar state
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loadingProfessions, setLoadingProfessions] = useState(false);
  const [showInactiveProfessions, setShowInactiveProfessions] = useState(false);
  const [professionDialogOpen, setProfessionDialogOpen] = useState(false);
  const [editingProfession, setEditingProfession] = useState<Profession | null>(null);
  const [professionForm, setProfessionForm] = useState<{ name: string; isActive: boolean }>({ name: '', isActive: true });
  const [savingProfession, setSavingProfession] = useState(false);
  const [deleteProfessionDialogOpen, setDeleteProfessionDialogOpen] = useState(false);
  const [deactivateProfessionDialogOpen, setDeactivateProfessionDialogOpen] = useState(false);
  const [deletingProfession, setDeletingProfession] = useState<Profession | null>(null);
  const [deactivatingProfession, setDeactivatingProfession] = useState<Profession | null>(null);

  const canView = hasPermission('ACCOUNTING_VIEW');
  const canManage = hasPermission('ACCOUNTING_VIEW'); // Admin yetkisi

  useEffect(() => {
    if (canView) {
      loadCenters();
      loadTitles();
      loadProfessions();
    }
  }, [canView, showInactiveProfessions]);

  const loadCenters = async () => {
    setLoading(true);
    try {
      const data = await getTevkifatCenters();
      setRows(data);
    } catch (e: any) {
      console.error('Tevkifat merkezleri yüklenirken hata:', e);
      toast.showError('Tevkifat merkezleri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadTitles = async () => {
    setLoadingTitles(true);
    try {
      const data = await getTevkifatTitles();
      setTitles(data);
    } catch (e: any) {
      console.error('Tevkifat unvanları yüklenirken hata:', e);
      toast.showError('Tevkifat unvanları yüklenirken bir hata oluştu');
    } finally {
      setLoadingTitles(false);
    }
  };

  const loadProfessions = async () => {
    setLoadingProfessions(true);
    try {
      const data = showInactiveProfessions ? await getAllProfessions() : await getProfessions();
      setProfessions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Meslek/Unvanlar alınırken hata:', e);
      setProfessions([]);
      toast.showError('Meslek/Unvanlar yüklenirken bir hata oluştu.');
    } finally {
      setLoadingProfessions(false);
    }
  };



  const handleDelete = async () => {
    if (!deletingCenter) return;

    // Transfer seçenekleri için hedef merkez kontrolü
    if (
      (deleteActionType === 'TRANSFER_TO_TEVKIFAT_CENTER' ||
        deleteActionType === 'TRANSFER_AND_DEACTIVATE' ||
        deleteActionType === 'TRANSFER_AND_CANCEL') &&
      !deleteTargetTevkifatCenterId
    ) {
      toast.showError('Lütfen hedef tevkifat merkezi seçin');
      return;
    }

    setDeleting(true);
    try {
      const dto: DeleteTevkifatCenterDto = {
        memberActionType: deleteActionType,
        ...(deleteTargetTevkifatCenterId && { targetTevkifatCenterId: deleteTargetTevkifatCenterId }),
      };
      await deleteTevkifatCenter(deletingCenter.id, dto);
      toast.showSuccess('Tevkifat merkezi kaldırıldı');
      setDeleteDialogOpen(false);
      setDeletingCenter(null);
      setDeleteActionType('REMOVE_TEVKIFAT_CENTER');
      setDeleteTargetTevkifatCenterId('');
      loadCenters();
    } catch (e: any) {
      console.error('Tevkifat merkezi silinirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat merkezi silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && row.isActive) ||
      (statusFilter === 'INACTIVE' && !row.isActive);
    return matchesSearch && matchesStatus;
  });

  // Tevkifat Unvanları handler'ları
  const handleOpenTitleDialog = (title?: TevkifatTitle) => {
    if (title) {
      setEditingTitle(title);
      setTitleForm({ name: title.name });
    } else {
      setEditingTitle(null);
      setTitleForm({ name: '' });
    }
    setTitleDialogOpen(true);
  };

  const handleCloseTitleDialog = () => {
    setTitleDialogOpen(false);
    setEditingTitle(null);
    setTitleForm({ name: '' });
  };

  const handleSaveTitle = async () => {
    if (!titleForm.name.trim()) {
      toast.showError('Unvan adı gereklidir');
      return;
    }

    setSavingTitle(true);
    try {
      if (editingTitle) {
        await updateTevkifatTitle(editingTitle.id, titleForm);
        toast.showSuccess('Tevkifat unvanı güncellendi');
      } else {
        await createTevkifatTitle(titleForm);
        toast.showSuccess('Tevkifat unvanı oluşturuldu');
      }
      handleCloseTitleDialog();
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı kaydedilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı kaydedilirken bir hata oluştu');
    } finally {
      setSavingTitle(false);
    }
  };

  const handleDeactivateTitle = async () => {
    if (!deactivatingTitle) return;

    setDeleting(true);
    try {
      await updateTevkifatTitle(deactivatingTitle.id, { isActive: false });
      toast.showSuccess('Tevkifat unvanı pasif yapıldı');
      setDeactivateTitleDialogOpen(false);
      setDeactivatingTitle(null);
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı pasifleştirilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı pasifleştirilirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteTitle = async () => {
    if (!deletingTitle) return;

    setDeleting(true);
    try {
      await deleteTevkifatTitle(deletingTitle.id);
      toast.showSuccess('Tevkifat unvanı silindi');
      setDeleteTitleDialogOpen(false);
      setDeletingTitle(null);
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı silinirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const handleActivateTitle = async (title: TevkifatTitle) => {
    setDeleting(true);
    try {
      await updateTevkifatTitle(title.id, { isActive: true });
      toast.showSuccess('Tevkifat unvanı aktifleştirildi');
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı aktifleştirilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı aktifleştirilirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  // Meslek/Unvanlar handler'ları
  const handleOpenProfessionDialog = (profession?: Profession) => {
    if (profession) {
      setEditingProfession(profession);
      setProfessionForm({ name: profession.name, isActive: profession.isActive });
    } else {
      setEditingProfession(null);
      setProfessionForm({ name: '', isActive: true });
    }
    setProfessionDialogOpen(true);
  };

  const handleCloseProfessionDialog = () => {
    setProfessionDialogOpen(false);
    setEditingProfession(null);
    setProfessionForm({ name: '', isActive: true });
  };

  const handleSaveProfession = async () => {
    if (!professionForm.name.trim()) {
      toast.showError('Meslek/Unvan adı gereklidir');
      return;
    }

    setSavingProfession(true);
    try {
      const payload = {
        name: professionForm.name.trim(),
        ...(editingProfession ? { isActive: professionForm.isActive } : {}),
      };

      if (editingProfession) {
        await updateProfession(editingProfession.id, payload);
        toast.showSuccess('Meslek/Unvan başarıyla güncellendi');
      } else {
        await createProfession({ name: payload.name });
        toast.showSuccess('Meslek/Unvan başarıyla oluşturuldu');
      }
      handleCloseProfessionDialog();
      loadProfessions();
    } catch (e: any) {
      console.error('Meslek/Unvan kaydedilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Meslek/Unvan kaydedilirken bir hata oluştu');
    } finally {
      setSavingProfession(false);
    }
  };

  const handleDeactivateProfession = async () => {
    if (!deactivatingProfession) return;

    setDeleting(true);
    try {
      await updateProfession(deactivatingProfession.id, { isActive: false });
      toast.showSuccess('Meslek/Unvan pasif yapıldı');
      setDeactivateProfessionDialogOpen(false);
      setDeactivatingProfession(null);
      loadProfessions();
    } catch (e: any) {
      console.error('Meslek/Unvan pasifleştirilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Meslek/Unvan pasifleştirilirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteProfession = async () => {
    if (!deletingProfession) return;

    setDeleting(true);
    try {
      await deleteProfession(deletingProfession.id);
      toast.showSuccess('Meslek/Unvan silindi');
      setDeleteProfessionDialogOpen(false);
      setDeletingProfession(null);
      loadProfessions();
    } catch (e: any) {
      console.error('Meslek/Unvan silinirken hata:', e);
      toast.showError(e.response?.data?.message || 'Meslek/Unvan silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const handleActivateProfession = async (profession: Profession) => {
    setDeleting(true);
    try {
      await updateProfession(profession.id, { isActive: true });
      toast.showSuccess('Meslek/Unvan aktifleştirildi');
      loadProfessions();
    } catch (e: any) {
      console.error('Meslek/Unvan aktifleştirilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Meslek/Unvan aktifleştirilirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const columns: GridColDef<TevkifatCenter>[] = [
    {
      field: 'name',
      headerName: 'Tevkifat Merkezi Adı',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 200,
      sortable: false,
      renderCell: (params) => {
        const center = params.row as TevkifatCenter;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Detay" arrow>
              <IconButton
                size="small"
                onClick={() => navigate(`/accounting/tevkifat-centers/${center.id}`)}
                sx={{
                  color: theme.palette.info.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.info.main, 0.08),
                  },
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canManage && (
              <>
                <Tooltip title="Düzenle" arrow>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/accounting/tevkifat-centers/${center.id}/edit`)}
                    sx={{
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Kaldır" arrow>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setDeletingCenter(center);
                      setDeleteActionType('REMOVE_TEVKIFAT_CENTER');
                      setDeleteTargetTevkifatCenterId('');
                      setDeleteDialogOpen(true);
                    }}
                    sx={{
                      color: theme.palette.error.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.08),
                      },
                    }}
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

  if (!canView) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            borderRadius: 3,
            boxShadow: `0 4px 16px ${alpha(theme.palette.error.main, 0.15)}`,
          }}
        >
          <BusinessIcon sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
            Yetkisiz İşlem
          </Typography>
          <Typography color="text.secondary">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Modern Başlık Bölümü */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: { xs: 56, sm: 64 },
                  height: { xs: 56, sm: 64 },
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.05)',
                    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
                  },
                }}
              >
                <BusinessIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />
              </Box>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                    color: theme.palette.text.primary,
                    mb: 0.5,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Tevkifat Merkezleri
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 500,
                  }}
                >
                  Kurumlardan gelen toplu aidat kesintilerinin merkezi takibi ve unvan yönetimi
                </Typography>
              </Box>
            </Box>
            {canManage && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  if (activeTab === 0) {
                    navigate('/accounting/tevkifat-centers/new');
                  } else if (activeTab === 1) {
                    handleOpenTitleDialog();
                  } else {
                    handleOpenProfessionDialog();
                  }
                }}
                size="large"
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  },
                }}
              >
                {activeTab === 0 ? 'Yeni Tevkifat Merkezi' : activeTab === 1 ? 'Yeni Unvan Ekle' : 'Yeni Meslek/Unvan'}
              </Button>
            )}
          </Box>

          {/* Mobile Button */}
          {canManage && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              onClick={() => {
                if (activeTab === 0) {
                  navigate('/accounting/tevkifat-centers/new');
                } else if (activeTab === 1) {
                  handleOpenTitleDialog();
                } else {
                  handleOpenProfessionDialog();
                }
              }}
              size="large"
              sx={{
                display: { xs: 'flex', sm: 'none' },
                mt: 3,
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                fontSize: '1rem',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              {activeTab === 0 ? 'Yeni Tevkifat Merkezi' : activeTab === 1 ? 'Yeni Unvan Ekle' : 'Yeni Meslek/Unvan'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
          mb: 3,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.01)} 100%)`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 64,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab 
            icon={<BusinessIcon />} 
            iconPosition="start"
            label="Tevkifat Merkezleri" 
          />
          <Tab 
            icon={<BadgeIcon />} 
            iconPosition="start"
            label="Tevkifat Unvanları" 
          />
          <Tab 
            icon={<WorkIcon />} 
            iconPosition="start"
            label="Meslek/Unvanlar" 
          />
        </Tabs>
      </Card>

      {/* Ana Kart - Filtre ve Tablo */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {activeTab === 0 ? (
          <>
            {/* Filtre Bölümü */}
            <Box
              sx={{
                p: { xs: 3, sm: 4 },
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.01)} 100%)`,
                borderBottom: `2px solid ${alpha(theme.palette.divider, 0.08)}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  <SearchIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Filtrele ve Ara
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    Tevkifat merkezlerini hızlıca bulun ve filtreleyin
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Ara (isim)..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  size="medium"
                  sx={{
                    flexGrow: 1,
                    minWidth: { xs: '100%', sm: 300 },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      borderRadius: 2.5,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: '2px',
                        },
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.4rem' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl 
                  size="medium" 
                  sx={{ 
                    minWidth: { xs: '100%', sm: 180 },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      borderRadius: 2.5,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                      },
                    },
                  }}
                >
                  <InputLabel>Durum Filtresi</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Durum Filtresi"
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    sx={{
                      '& .MuiSelect-select': {
                        fontWeight: statusFilter !== 'ALL' ? 600 : 400,
                        color: statusFilter !== 'ALL' ? theme.palette.primary.main : 'inherit',
                      },
                    }}
                  >
                    <MenuItem value="ALL">Tümü</MenuItem>
                    <MenuItem value="ACTIVE">Aktif</MenuItem>
                    <MenuItem value="INACTIVE">Pasif</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Sonuç Sayısı */}
              {!loading && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.info.dark,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: '0.9rem',
                    }}
                  >
                    <BusinessIcon fontSize="small" />
                    {filteredRows.length} tevkifat merkezi listeleniyor
                    {filteredRows.length !== rows.length && ` (Toplam ${rows.length} merkezden)`}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Tablo Bölümü */}
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>

              <Box
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  height: { xs: 450, sm: 550, md: 650 },
                  minHeight: { xs: 450, sm: 550, md: 650 },
                  '& .MuiDataGrid-root': {
                    border: 'none',
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                    py: 2,
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    borderRadius: 0,
                    minHeight: '56px !important',
                    maxHeight: '56px !important',
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: theme.palette.text.primary,
                  },
                  '& .MuiDataGrid-row': {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.03),
                      boxShadow: `inset 4px 0 0 ${theme.palette.primary.main}`,
                    },
                    '&:nth-of-type(even)': {
                      backgroundColor: alpha(theme.palette.grey[50], 0.3),
                    },
                  },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                    backgroundColor: alpha(theme.palette.grey[50], 0.5),
                    minHeight: '52px',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    minHeight: '200px',
                  },
                }}
              >
                <DataGrid
                  rows={filteredRows}
                  columns={columns}
                  loading={loading}
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 25 },
                    },
                  }}
                  disableRowSelectionOnClick
                  localeText={{
                    noRowsLabel: 'Tevkifat merkezi bulunamadı',
                  }}
                />
              </Box>
            </Box>
          </>
        ) : activeTab === 1 ? (
          /* Tevkifat Unvanları Tab */
          <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {loadingTitles ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow 
                        sx={{ 
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
                          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2 }}>Unvan Adı</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2 }}>Durum</TableCell>
                        {canManage && (
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2 }}>İşlemler</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {titles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={canManage ? 3 : 2} align="center" sx={{ py: 6 }}>
                            <BadgeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                            <Typography variant="body2" color="text.secondary">
                              Henüz unvan eklenmemiş
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        titles.map((title, index) => (
                          <TableRow 
                            key={title.id}
                            sx={{
                              transition: 'all 0.2s ease',
                              backgroundColor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.grey[50], 0.3),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                                boxShadow: `inset 4px 0 0 ${theme.palette.primary.main}`,
                              },
                            }}
                          >
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{title.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={title.isActive ? 'Aktif' : 'Pasif'}
                            color={title.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        {canManage && (
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Tooltip title="Düzenle" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenTitleDialog(title)}
                                  sx={{ 
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {title.isActive ? (
                                <>
                                  <Tooltip title="Pasif Yap" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setDeactivatingTitle(title);
                                        setDeactivateTitleDialogOpen(true);
                                      }}
                                      sx={{ 
                                        color: theme.palette.warning.main,
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                        },
                                      }}
                                    >
                                      <BlockIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Sil" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setDeletingTitle(title);
                                        setDeleteTitleDialogOpen(true);
                                      }}
                                      sx={{ 
                                        color: theme.palette.error.main,
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                                        },
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <Tooltip title="Aktifleştir" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleActivateTitle(title)}
                                    disabled={deleting}
                                    sx={{ 
                                      color: theme.palette.success.main,
                                      '&:hover': {
                                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                                      },
                                    }}
                                  >
                                    <RestoreIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        ) : activeTab === 2 ? (
          /* Meslek/Unvanlar Tab */
          <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Filtre: Pasif olanları göster */}
            {canManage && (
              <Box
                sx={{
                  mb: 3,
                  p: 2.5,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.primary.light, 0.02)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={showInactiveProfessions}
                      onChange={(e) => setShowInactiveProfessions(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Pasif olanları göster"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    },
                  }}
                />
              </Box>
            )}

            {loadingProfessions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow 
                        sx={{ 
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
                          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2 }}>Meslek/Unvan Adı</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2 }}>Durum</TableCell>
                        {canManage && (
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2 }}>İşlemler</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {professions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={canManage ? 3 : 2} align="center" sx={{ py: 6 }}>
                            <WorkIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                            <Typography variant="body2" color="text.secondary">
                              Henüz meslek/unvan eklenmemiş
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        professions.map((profession, index) => (
                          <TableRow 
                            key={profession.id}
                            sx={{
                              transition: 'all 0.2s ease',
                              backgroundColor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.grey[50], 0.3),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                                boxShadow: `inset 4px 0 0 ${theme.palette.primary.main}`,
                              },
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WorkIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{profession.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={profession.isActive ? 'Aktif' : 'Pasif'}
                                color={profession.isActive ? 'success' : 'default'}
                                size="small"
                                icon={profession.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            {canManage && (
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                  <Tooltip title="Düzenle" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenProfessionDialog(profession)}
                                      sx={{ 
                                        color: theme.palette.primary.main,
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        },
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {profession.isActive ? (
                                    <>
                                      <Tooltip title="Pasif Yap" arrow>
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            setDeactivatingProfession(profession);
                                            setDeactivateProfessionDialogOpen(true);
                                          }}
                                          sx={{ 
                                            color: theme.palette.warning.main,
                                            '&:hover': {
                                              backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                            },
                                          }}
                                        >
                                          <BlockIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Sil" arrow>
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            setDeletingProfession(profession);
                                            setDeleteProfessionDialogOpen(true);
                                          }}
                                          sx={{ 
                                            color: theme.palette.error.main,
                                            '&:hover': {
                                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                                            },
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </>
                                  ) : (
                                    <Tooltip title="Aktifleştir" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleActivateProfession(profession)}
                                        disabled={deleting}
                                        sx={{ 
                                          color: theme.palette.success.main,
                                          '&:hover': {
                                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                                          },
                                        }}
                                      >
                                        <RestoreIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        ) : null}
      </Card>

      {/* Tevkifat Unvanları Dialog'ları */}
      {/* Unvan Ekle/Düzenle Dialog */}
      <Dialog 
        open={titleDialogOpen} 
        onClose={handleCloseTitleDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <BadgeIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingTitle ? 'Tevkifat Unvanı Düzenle' : 'Yeni Tevkifat Unvanı Ekle'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Unvan Adı"
            value={titleForm.name}
            onChange={(e) => setTitleForm({ name: e.target.value })}
            fullWidth
            margin="normal"
            required
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: alpha(theme.palette.primary.main, 0.04) }}>
          <Button 
            onClick={handleCloseTitleDialog} 
            disabled={savingTitle}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleSaveTitle}
            variant="contained"
            disabled={savingTitle}
            startIcon={savingTitle ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }
            }}
          >
            {savingTitle ? 'Kaydediliyor...' : editingTitle ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unvan Pasifleştir Dialog */}
      <Dialog 
        open={deactivateTitleDialogOpen} 
        onClose={() => setDeactivateTitleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
          color: 'white',
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <BlockIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Tevkifat Unvanını Pasif Yap</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ mb: 1 }}>
            "{deactivatingTitle?.name}" adlı tevkifat unvanını pasif yapmak istediğinize emin misiniz?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Pasif yapılan unvanlar listede görünmeye devam eder ancak yeni işlemler için kullanılamaz.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: alpha(theme.palette.warning.main, 0.04) }}>
          <Button 
            onClick={() => setDeactivateTitleDialogOpen(false)} 
            disabled={deleting}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleDeactivateTitle}
            color="warning"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <BlockIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}`,
              }
            }}
          >
            {deleting ? 'Pasif Yapılıyor...' : 'Pasif Yap'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unvan Sil Dialog */}
      <Dialog 
        open={deleteTitleDialogOpen} 
        onClose={() => setDeleteTitleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
          color: 'white',
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <DeleteIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Tevkifat Unvanını Sil</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ mb: 1 }}>
            "{deletingTitle?.name}" adlı tevkifat unvanını kalıcı olarak silmek istediğinize emin misiniz?
          </Typography>
          <Alert severity="error" sx={{ borderRadius: 2, mt: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              Bu işlem geri alınamaz. Unvan veritabanından tamamen silinecektir.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: alpha(theme.palette.error.main, 0.04) }}>
          <Button 
            onClick={() => setDeleteTitleDialogOpen(false)} 
            disabled={deleting}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleDeleteTitle}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
              }
            }}
          >
            {deleting ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pasif Yap Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.warning.main, 0.15)}`,
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
            Tevkifat Merkezini Kaldır
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                "{deletingCenter?.name}" adlı tevkifat merkezini kaldırmak istediğinize emin misiniz?
              </Typography>
              <Typography variant="body2">
                Bu tevkifat merkezine bağlı {deletingCenter?.memberCount || 0} üye bulunmaktadır. 
                Tevkifat merkezini kaldırmadan önce üyelere ne yapılacağını seçmeniz gerekmektedir.
              </Typography>
            </Alert>

            <Box>
              <FormLabel sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.95rem', display: 'block' }}>
                Üyelere Ne Yapılacak?
              </FormLabel>
              <RadioGroup
                value={deleteActionType}
                onChange={(e) => setDeleteActionType(e.target.value as DeleteTevkifatCenterDto['memberActionType'])}
                sx={{ gap: 1 }}
              >
                <FormControlLabel
                  value="REMOVE_TEVKIFAT_CENTER"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Tevkifat Merkezi Bilgisini Kaldır
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyelerin tevkifat merkezi bilgisi kaldırılacak (null yapılacak), durumları değişmeyecek
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
                  value="TRANSFER_TO_TEVKIFAT_CENTER"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Başka Bir Tevkifat Merkezine Taşı
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyeler seçilen tevkifat merkezine taşınacak, durumları değişmeyecek
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
                        Tevkifat Merkezi Bilgisini Kaldır ve Pasif Et
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyelerin tevkifat merkezi bilgisi kaldırılacak ve pasif duruma getirilecek
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
                        Başka Bir Tevkifat Merkezine Taşı ve Pasif Et
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyeler seçilen tevkifat merkezine taşınacak ve pasif duruma getirilecek
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
                        Başka Bir Tevkifat Merkezine Taşı ve İptal Et
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Üyeler seçilen tevkifat merkezine taşınacak ve üyelikleri iptal edilecek (İstifa)
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

            {(deleteActionType === 'TRANSFER_TO_TEVKIFAT_CENTER' ||
              deleteActionType === 'TRANSFER_AND_DEACTIVATE' ||
              deleteActionType === 'TRANSFER_AND_CANCEL') && (
              <>
                <Divider />
                <FormControl fullWidth required>
                  <InputLabel>Hedef Tevkifat Merkezi</InputLabel>
                  <Select
                    value={deleteTargetTevkifatCenterId}
                    onChange={(e) => setDeleteTargetTevkifatCenterId(e.target.value)}
                    label="Hedef Tevkifat Merkezi"
                    disabled={deleting}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.divider, 0.2),
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Hedef tevkifat merkezi seçin</em>
                    </MenuItem>
                    {rows
                      .filter(center => center.id !== deletingCenter?.id && center.isActive)
                      .map((center) => (
                        <MenuItem key={center.id} value={center.id}>
                          {center.name}
                          {center.memberCount !== undefined && ` (${center.memberCount} üye)`}
                        </MenuItem>
                      ))}
                  </Select>
                  <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
                    Üyeler bu tevkifat merkezine taşınacaktır
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
              setDeletingCenter(null);
              setDeleteActionType('REMOVE_TEVKIFAT_CENTER');
              setDeleteTargetTevkifatCenterId('');
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
            disabled={
              deleting || 
              (deleteActionType !== 'REMOVE_TEVKIFAT_CENTER' && 
               deleteActionType !== 'REMOVE_AND_DEACTIVATE' && 
               !deleteTargetTevkifatCenterId)
            }
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
            {deleting ? 'Kaldırılıyor...' : 'Kaldır'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Meslek/Unvanlar Dialog'ları */}
      {/* Meslek/Unvan Ekle/Düzenle Dialog */}
      <Dialog 
        open={professionDialogOpen} 
        onClose={handleCloseProfessionDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <WorkIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingProfession ? 'Meslek/Unvan Düzenle' : 'Yeni Meslek/Unvan Ekle'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Meslek/Unvan Adı"
            value={professionForm.name}
            onChange={(e) => setProfessionForm({ ...professionForm, name: e.target.value })}
            fullWidth
            required
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          {editingProfession && (
            <FormControlLabel
              control={
                <Switch
                  checked={professionForm.isActive}
                  onChange={(e) => setProfessionForm({ ...professionForm, isActive: e.target.checked })}
                />
              }
              label="Aktif"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: alpha(theme.palette.primary.main, 0.04) }}>
          <Button 
            onClick={handleCloseProfessionDialog} 
            disabled={savingProfession}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleSaveProfession}
            variant="contained"
            disabled={savingProfession}
            startIcon={savingProfession ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }
            }}
          >
            {savingProfession ? 'Kaydediliyor...' : editingProfession ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Meslek/Unvan Pasifleştir Dialog */}
      <Dialog 
        open={deactivateProfessionDialogOpen} 
        onClose={() => setDeactivateProfessionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
          color: 'white',
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <BlockIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Meslek/Unvanı Pasif Yap</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ mb: 1 }}>
            "{deactivatingProfession?.name}" adlı meslek/unvanı pasif yapmak istediğinize emin misiniz?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Pasif yapılan meslek/unvanlar listede görünmeye devam eder ancak yeni işlemler için kullanılamaz.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: alpha(theme.palette.warning.main, 0.04) }}>
          <Button 
            onClick={() => setDeactivateProfessionDialogOpen(false)} 
            disabled={deleting}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleDeactivateProfession}
            color="warning"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <BlockIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}`,
              }
            }}
          >
            {deleting ? 'Pasif Yapılıyor...' : 'Pasif Yap'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Meslek/Unvan Sil Dialog */}
      <Dialog 
        open={deleteProfessionDialogOpen} 
        onClose={() => setDeleteProfessionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
          color: 'white',
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <DeleteIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Meslek/Unvanı Sil</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ mb: 1 }}>
            "{deletingProfession?.name}" adlı meslek/unvanı kalıcı olarak silmek istediğinize emin misiniz?
          </Typography>
          <Alert severity="error" sx={{ borderRadius: 2, mt: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              Bu işlem geri alınamaz. Meslek/Unvan veritabanından tamamen silinecektir.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: alpha(theme.palette.error.main, 0.04) }}>
          <Button 
            onClick={() => setDeleteProfessionDialogOpen(false)} 
            disabled={deleting}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleDeleteProfession}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
              }
            }}
          >
            {deleting ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default TevkifatCentersPage;
