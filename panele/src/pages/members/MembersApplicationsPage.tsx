// src/pages/members/MembersApplicationsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  InputAdornment,
  Stack,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookIcon from '@mui/icons-material/Book';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

import type { MemberApplicationRow, MemberStatus } from '../../types/member';
import {
  getMemberApplications,
  approveMember,
  rejectMember,
} from '../../api/membersApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { getBranches } from '../../api/branchesApi';
import type { Branch } from '../../api/branchesApi';
import { getTevkifatCenters, getTevkifatTitles } from '../../api/accountingApi';

const MembersApplicationsPage: React.FC = () => {
  const theme = useTheme();
  const toast = useToast();
  const [rows, setRows] = useState<MemberApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [provinceFilter, setProvinceFilter] = useState<string>('ALL');
  const [createdByFilter, setCreatedByFilter] = useState<string>('ALL');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | null;
    memberId: string | null;
  }>({
    open: false,
    type: null,
    memberId: null,
  });

  // Onaylama için admin bilgileri
  const [approveForm, setApproveForm] = useState<{
    registrationNumber: string;
    boardDecisionDate: string;
    boardDecisionBookNo: string;
    tevkifatCenterId: string;
    tevkifatTitleId: string;
    branchId: string;
    memberGroupId: string;
  }>({
    registrationNumber: '',
    boardDecisionDate: '',
    boardDecisionBookNo: '',
    tevkifatCenterId: '',
    tevkifatTitleId: '',
    branchId: '',
    memberGroupId: '',
  });

  // Data için state'ler
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tevkifatCenters, setTevkifatCenters] = useState<Array<{ id: string; name: string; title: string | null }>>([]);
  const [tevkifatTitles, setTevkifatTitles] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const [memberGroups, setMemberGroups] = useState<Array<{ id: string; name: string }>>([]);

  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canApprove = hasPermission('MEMBER_APPROVE');
  const canReject = hasPermission('MEMBER_REJECT');

  const filteredRows = useMemo(() => {
    let filtered = rows;

    // İl filtreleme
    if (provinceFilter !== 'ALL') {
      filtered = filtered.filter((row) => row.province?.id === provinceFilter);
    }

    // Başvuruyu yapan filtreleme
    if (createdByFilter !== 'ALL') {
      filtered = filtered.filter((row) => row.createdBy?.id === createdByFilter);
    }

    // Metin araması
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (row) =>
          row.firstName.toLowerCase().includes(searchLower) ||
          row.lastName.toLowerCase().includes(searchLower) ||
          row.province?.name.toLowerCase().includes(searchLower) ||
          (row.createdBy && 
            (`${row.createdBy.firstName} ${row.createdBy.lastName}`.toLowerCase().includes(searchLower) ||
             row.createdBy.email.toLowerCase().includes(searchLower))
          ),
      );
    }

    return filtered;
  }, [rows, provinceFilter, createdByFilter, searchText]);

  // Benzersiz iller listesi
  const uniqueProvinces = useMemo(() => {
    const provinces = rows
      .map((row) => row.province)
      .filter((province): province is NonNullable<typeof province> => province !== null && province !== undefined);
    
    const uniqueMap = new Map(provinces.map((p) => [p.id, p]));
    return Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [rows]);

  // Benzersiz başvuru yapanlar listesi
  const uniqueCreatedBy = useMemo(() => {
    const creators = rows
      .map((row) => row.createdBy)
      .filter((creator): creator is NonNullable<typeof creator> => creator !== null && creator !== undefined);
    
    const uniqueMap = new Map(creators.map((c) => [c.id, c]));
    return Array.from(uniqueMap.values()).sort((a, b) => 
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'tr')
    );
  }, [rows]);

  const getStatusLabel = (status: MemberStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'Başvuru Alındı';
      case 'APPROVED':
        return 'Admin Onayladı (Beklemede)';
      case 'ACTIVE':
        return 'Aktif';
      case 'REJECTED':
        return 'Reddedildi';
      case 'RESIGNED':
        return 'İstifa';
      case 'EXPELLED':
        return 'İhraç';
      case 'INACTIVE':
        return 'Pasif';
      default:
        return String(status);
    }
  };

  const getStatusColor = (
    status: MemberStatus,
  ): 'success' | 'warning' | 'error' | 'default' | 'info' => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'info';
      case 'ACTIVE':
        return 'success';
      case 'REJECTED':
      case 'EXPELLED':
        return 'error';
      case 'RESIGNED':
      case 'INACTIVE':
        return 'default';
      default:
        return 'info';
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await getMemberApplications();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Üye başvuruları alınırken hata:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Şubeleri yükle
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await getBranches({ isActive: true });
        setBranches(data);
      } catch (e) {
        console.error('Şubeler alınırken hata:', e);
      }
    };
    loadBranches();
  }, []);

  // Tevkifat merkezlerini yükle
  useEffect(() => {
    const loadTevkifatCenters = async () => {
      try {
        const data = await getTevkifatCenters();
        const activeCenters = data.filter(c => c.isActive).map(c => ({ id: c.id, name: c.name, title: c.title }));
        setTevkifatCenters(activeCenters);
      } catch (e) {
        console.error('Tevkifat merkezleri yüklenirken hata:', e);
      }
    };
    loadTevkifatCenters();
  }, []);

  // Tevkifat ünvanlarını yükle
  useEffect(() => {
    const loadTevkifatTitles = async () => {
      try {
        const data = await getTevkifatTitles();
        const activeTitles = data.filter(t => t.isActive);
        setTevkifatTitles(activeTitles);
      } catch (e) {
        console.error('Tevkifat ünvanları yüklenirken hata:', e);
      }
    };
    loadTevkifatTitles();
  }, []);

  // Üye gruplarını yükle
  useEffect(() => {
    const loadMemberGroups = async () => {
      try {
        const { getMemberGroups } = await import('../../api/memberGroupsApi');
        const data = await getMemberGroups();
        setMemberGroups(data || []);
      } catch (e) {
        console.error('Üye grupları yüklenirken hata:', e);
      }
    };
    loadMemberGroups();
  }, []);

  const handleApproveClick = (id: string) => {
    if (!canApprove) return;
    // "Üye" grubunu varsayılan olarak bul
    const defaultMemberGroup = memberGroups.find(g => g.name === 'Üye');
    const defaultMemberGroupId = defaultMemberGroup?.id || '';
    
    // Form'u sıfırla
    setApproveForm({
      registrationNumber: '',
      boardDecisionDate: '',
      boardDecisionBookNo: '',
      tevkifatCenterId: '',
      tevkifatTitleId: '',
      branchId: '',
      memberGroupId: defaultMemberGroupId,
    });
    setConfirmDialog({
      open: true,
      type: 'approve',
      memberId: id,
    });
  };

  const handleRejectClick = (id: string) => {
    if (!canReject) return;
    setConfirmDialog({
      open: true,
      type: 'reject',
      memberId: id,
    });
  };

  const handleConfirm = async () => {
    if (!confirmDialog.memberId || !confirmDialog.type) return;

    const id = confirmDialog.memberId;
    
    // Onaylama için tüm alanların dolu olması gerekiyor
    if (confirmDialog.type === 'approve') {
      if (!approveForm.registrationNumber.trim()) {
        toast.showError('Üye numarası zorunludur.');
        return;
      }
      if (!approveForm.boardDecisionDate) {
        toast.showError('Yönetim kurulu karar tarihi zorunludur.');
        return;
      }
      if (!approveForm.boardDecisionBookNo.trim()) {
        toast.showError('Yönetim karar defteri no zorunludur.');
        return;
      }
      if (!approveForm.tevkifatCenterId) {
        toast.showError('Tevkifat kurumu seçimi zorunludur.');
        return;
      }
      if (!approveForm.tevkifatTitleId) {
        toast.showError('Tevkifat ünvanı seçimi zorunludur.');
        return;
      }
      if (!approveForm.branchId) {
        toast.showError('Şube seçimi zorunludur.');
        return;
      }
      if (!approveForm.memberGroupId) {
        toast.showError('Üye grubu seçimi zorunludur.');
        return;
      }
    }

    setProcessingId(id);
    setConfirmDialog({ open: false, type: null, memberId: null });

    try {
      if (confirmDialog.type === 'approve') {
        // Admin bilgilerini gönder
        const approveData: {
          registrationNumber: string;
          boardDecisionDate: string;
          boardDecisionBookNo: string;
          tevkifatCenterId: string;
          tevkifatTitleId: string;
          branchId: string;
          memberGroupId: string;
        } = {
          registrationNumber: approveForm.registrationNumber.trim(),
          boardDecisionDate: approveForm.boardDecisionDate,
          boardDecisionBookNo: approveForm.boardDecisionBookNo.trim(),
          tevkifatCenterId: approveForm.tevkifatCenterId,
          tevkifatTitleId: approveForm.tevkifatTitleId,
          branchId: approveForm.branchId,
          memberGroupId: approveForm.memberGroupId,
        };

        await approveMember(id, approveData);
        await loadApplications();
        toast.showSuccess('Başvuru başarıyla onaylandı. Üye bekleyen üyeler listesine eklendi.');
        // Form'u sıfırla
        setApproveForm({
          registrationNumber: '',
          boardDecisionDate: '',
          boardDecisionBookNo: '',
          tevkifatCenterId: '',
          tevkifatTitleId: '',
          branchId: '',
          memberGroupId: '',
        });
      } else {
        await rejectMember(id);
        await loadApplications();
        toast.showSuccess('Başvuru başarıyla reddedildi.');
      }
    } catch (e) {
      console.error('Başvuru işlenirken hata:', e);
      toast.showError(
        confirmDialog.type === 'approve'
          ? 'Başvuru onaylanırken bir hata oluştu.'
          : 'Başvuru reddedilirken bir hata oluştu.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleCloseConfirmDialog = () => {
    if (processingId) return; // İşlem devam ederken kapatılamaz
    setConfirmDialog({ open: false, type: null, memberId: null });
  };


  const columns: GridColDef<MemberApplicationRow>[] = [
    {
      field: 'firstName',
      headerName: 'Ad',
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'lastName',
      headerName: 'Soyad',
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 1,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (_value, row: MemberApplicationRow) => row.province?.name ?? '-',
    },
    {
      field: 'createdBy',
      headerName: 'Başvuruyu Yapan',
      flex: 1.2,
      minWidth: 150,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (_value, row: MemberApplicationRow) => {
        if (row.createdBy) {
          return `${row.createdBy.firstName} ${row.createdBy.lastName}`;
        }
        return '-';
      },
      renderCell: (params: GridRenderCellParams<MemberApplicationRow>) => {
        const createdBy = params.row.createdBy;
        if (!createdBy) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2">-</Typography>
            </Box>
          );
        }
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" fontWeight={600}>
              {createdBy.firstName} {createdBy.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {createdBy.email}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Başvuru Tarihi',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (_value, row: MemberApplicationRow) => row.createdAt,
      valueFormatter: (value: string | null | undefined) =>
        value
          ? new Date(value).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
          : '-',
    },
    {
      field: 'status',
      headerName: 'Durum',
      width: 160,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<MemberApplicationRow>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Chip
            label={getStatusLabel(params.row.status)}
            size="medium"
            color={getStatusColor(params.row.status)}
            sx={{ 
              fontWeight: 700,
              fontSize: '0.8rem',
              height: '32px',
              borderRadius: 2,
              px: 1,
              boxShadow: `0 2px 8px ${alpha(theme.palette[getStatusColor(params.row.status)].main, 0.25)}`,
            }}
          />
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 200,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<MemberApplicationRow>) => {
        const disabled = processingId === params.row.id;
        const isPending = params.row.status === 'PENDING';
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Tooltip title="Detayları Görüntüle" arrow placement="top">
              <IconButton
                size="medium"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/members/${params.row.id}`);
                }}
                sx={{
                  width: 38,
                  height: 38,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  color: theme.palette.primary.main,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: '#fff',
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                  },
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canApprove && isPending && (
              <Tooltip title="Başvuruyu Onayla" arrow placement="top">
                <span>
                  <IconButton
                    size="medium"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApproveClick(params.row.id);
                    }}
                    sx={{
                      width: 38,
                      height: 38,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      color: theme.palette.success.main,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                        color: '#fff',
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.35)}`,
                      },
                      '&:disabled': {
                        opacity: 0.5,
                      },
                    }}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {canReject && isPending && (
              <Tooltip title="Başvuruyu Reddet" arrow placement="top">
                <span>
                  <IconButton
                    size="medium"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectClick(params.row.id);
                    }}
                    sx={{
                      width: 38,
                      height: 38,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.light, 0.05)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                      color: theme.palette.error.main,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                        color: '#fff',
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.35)}`,
                      },
                      '&:disabled': {
                        opacity: 0.5,
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box
      sx={{
        pb: 4,
      }}
    >
      {/* Modern Başlık Bölümü */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${alpha(theme.palette.warning.main, 0.1)} 0%, transparent 70%)`,
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
                  background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.35)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.05)',
                    boxShadow: `0 12px 32px ${alpha(theme.palette.warning.main, 0.45)}`,
                  },
                }}
              >
                <AssignmentIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />
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
                    textAlign: 'left',
                  }}
                >
                  Üye Başvuruları
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 500,
                    textAlign: 'left',
                  }}
                >
                  Başvuruları yönetin, onaylayın ve takip edin
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/members/applications/new')}
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
              Yeni Başvuru Oluştur
            </Button>
          </Box>

          {/* Mobile Button */}
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            fullWidth
            onClick={() => navigate('/members/applications/new')}
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
            Yeni Başvuru Oluştur
          </Button>
        </Box>
      </Box>

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
        {/* Gelişmiş Filtre Bölümü */}
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
              <FilterListIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, textAlign: 'left' }}>
                Filtrele ve Ara
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', textAlign: 'left' }}>
                Başvuruları hızlıca bulun ve filtreleyin
              </Typography>
            </Box>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2.5}
            alignItems={{ xs: 'stretch', sm: 'flex-end' }}
          >
            <TextField
              placeholder="Ad, Soyad, İl veya Email ile arayın..."
              size="medium"
              fullWidth
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.4rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
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
            />
            
            <FormControl 
              size="medium" 
              sx={{ 
                minWidth: { xs: '100%', sm: 200 },
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
              <InputLabel>İl Filtresi</InputLabel>
              <Select
                value={provinceFilter}
                label="İl Filtresi"
                onChange={(e) => setProvinceFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <FilterListIcon sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="ALL">
                  <Typography>Tüm İller</Typography>
                </MenuItem>
                {uniqueProvinces.map((province) => (
                  <MenuItem key={province.id} value={province.id}>
                    <Typography>{province.name}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl 
              size="medium" 
              sx={{ 
                minWidth: { xs: '100%', sm: 220 },
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
              <InputLabel>Başvuruyu Yapan</InputLabel>
              <Select
                value={createdByFilter}
                label="Başvuruyu Yapan"
                onChange={(e) => setCreatedByFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <FilterListIcon sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="ALL">
                  <Typography>Tüm Kullanıcılar</Typography>
                </MenuItem>
                {uniqueCreatedBy.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Sonuç Sayısı - Filtre içine taşındı */}
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
                <AssignmentIcon fontSize="small" />
                {filteredRows.length} başvuru listeleniyor
                {filteredRows.length !== rows.length && ` (Toplam ${rows.length} başvurudan)`}
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
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiDataGrid-columnHeaders': {
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                borderRadius: 0,
                minHeight: '56px !important',
                maxHeight: '56px !important',
              },
              '& .MuiDataGrid-columnHeaderTitleContainer': {
                justifyContent: 'center',
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
              getRowId={(row) => row.id}
              initialState={{
                pagination: { paginationModel: { pageSize: 25, page: 0 } },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              disableRowSelectionOnClick
              localeText={{
                noRowsLabel: 'Başvuru bulunamadı',
                MuiTablePagination: {
                  labelRowsPerPage: 'Sayfa başına satır:',
                },
              }}
            />
          </Box>
        </Box>
      </Card>

      {/* Onay Dialog'u - Özel (Admin bilgileri ile) */}
      {confirmDialog.type === 'approve' ? (
        <Dialog
          open={confirmDialog.open}
          onClose={handleCloseConfirmDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.2)}`,
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pb: 2.5,
              pt: 3,
              px: 3,
              borderBottom: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.02)} 0%, ${alpha(theme.palette.success.light, 0.01)} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.35)}`,
                }}
              >
                <CheckIcon sx={{ fontSize: '2rem', color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
                  Başvuruyu Onayla
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Üyelik bilgilerini tamamlayın
                </Typography>
              </Box>
            </Box>
            {!processingId && (
              <IconButton
                onClick={handleCloseConfirmDialog}
                size="medium"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>

          <DialogContent sx={{ pt: 3.5, pb: 3, px: 3 }}>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                mb: 3.5, 
                lineHeight: 1.7,
                fontSize: '0.95rem',
              }}
            >
              Bu başvuruyu onaylamak istediğinize emin misiniz? Onaylandıktan sonra üye <strong>aktif</strong> hale gelecektir.
              Aşağıdaki bilgileri doldurarak üyelik kaydını tamamlayabilirsiniz.
            </Typography>

            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.light, 0.03)} 100%)`,
                border: `2px dashed ${alpha(theme.palette.info.main, 0.2)}`,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                  }}
                >
                  <BadgeIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.info.dark }}>
                  Yönetici Bilgileri
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    label="Üye Numarası *"
                    value={approveForm.registrationNumber}
                    onChange={(e) =>
                      setApproveForm((prev) => ({ ...prev, registrationNumber: e.target.value }))
                    }
                    fullWidth
                    required
                    placeholder="Örn: UYE-00001"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      minWidth: 300,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        backgroundColor: '#fff',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Yönetim Karar Defteri No *"
                    value={approveForm.boardDecisionBookNo}
                    onChange={(e) =>
                      setApproveForm((prev) => ({ ...prev, boardDecisionBookNo: e.target.value }))
                    }
                    fullWidth
                    required
                    placeholder="Örn: 2025/01"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BookIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      minWidth: 250,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        backgroundColor: '#fff',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Yönetim Kurulu Karar Tarihi *"
                    type="date"
                    value={approveForm.boardDecisionDate}
                    onChange={(e) =>
                      setApproveForm((prev) => ({ ...prev, boardDecisionDate: e.target.value }))
                    }
                    fullWidth
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      minWidth: 250,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        backgroundColor: '#fff',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Tevkifat Bilgileri Bölümü */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.light, 0.03)} 100%)`,
                border: `2px dashed ${alpha(theme.palette.secondary.main, 0.2)}`,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  }}
                >
                  <AccountBalanceIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.secondary.dark }}>
                  Tevkifat Bilgileri
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={tevkifatCenters}
                    value={tevkifatCenters.find((c) => c.id === approveForm.tevkifatCenterId) || null}
                    onChange={(_, newValue) =>
                      setApproveForm((prev) => ({ ...prev, tevkifatCenterId: newValue?.id || '' }))
                    }
                    getOptionLabel={(option) => option.name}
                    isOptionEqualTo={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tevkifat Kurumu *"
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <CorporateFareIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          minWidth: 250,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                            backgroundColor: '#fff',
                          },
                        }}
                      />
                    )}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={tevkifatTitles}
                    value={tevkifatTitles.find((t) => t.id === approveForm.tevkifatTitleId) || null}
                    onChange={(_, newValue) =>
                      setApproveForm((prev) => ({ ...prev, tevkifatTitleId: newValue?.id || '' }))
                    }
                    getOptionLabel={(option) => option.name}
                    isOptionEqualTo={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tevkifat Ünvanı *"
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          minWidth: 250,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                            backgroundColor: '#fff',
                          },
                        }}
                      />
                    )}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Şube Seçimi Bölümü */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.light, 0.03)} 100%)`,
                border: `2px dashed ${alpha(theme.palette.info.main, 0.2)}`,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                  }}
                >
                  <CorporateFareIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.info.dark }}>
                  Şube Seçimi
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={branches}
                    value={branches.find((b) => b.id === approveForm.branchId) || null}
                    onChange={(_, newValue) =>
                      setApproveForm((prev) => ({ ...prev, branchId: newValue?.id || '' }))
                    }
                    getOptionLabel={(option) => `${option.name}${option.code ? ` (${option.code})` : ''}`}
                    isOptionEqualTo={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Şube *"
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <AccountBalanceIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          minWidth: 300,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                            backgroundColor: '#fff',
                          },
                        }}
                      />
                    )}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Üyelik Bilgileri Bölümü */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.06)} 0%, ${alpha(theme.palette.success.light, 0.03)} 100%)`,
                border: `2px dashed ${alpha(theme.palette.success.main, 0.2)}`,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                  }}
                >
                  <PersonIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.success.dark }}>
                  Üyelik Bilgileri
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={memberGroups}
                    value={memberGroups.find((g) => g.id === approveForm.memberGroupId) || null}
                    onChange={(_, newValue) =>
                      setApproveForm((prev) => ({ ...prev, memberGroupId: newValue?.id || '' }))
                    }
                    getOptionLabel={(option) => option.name}
                    isOptionEqualTo={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Üye Grubu *"
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          minWidth: 300,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                            backgroundColor: '#fff',
                          },
                        }}
                      />
                    )}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pb: 3,
              pt: 2,
              gap: 1.5,
              borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.grey[50], 0.5)} 100%)`,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              onClick={handleCloseConfirmDialog}
              disabled={!!processingId}
              variant="outlined"
              size="large"
              sx={{
                borderRadius: 2.5,
                px: 4,
                py: 1.25,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px',
                  backgroundColor: alpha(theme.palette.grey[500], 0.08),
                },
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!!processingId || !approveForm.registrationNumber.trim() || !approveForm.boardDecisionDate || !approveForm.boardDecisionBookNo.trim() || !approveForm.tevkifatCenterId || !approveForm.tevkifatTitleId || !approveForm.branchId || !approveForm.memberGroupId}
              variant="contained"
              size="large"
              color="success"
              startIcon={processingId ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
              sx={{
                borderRadius: 2.5,
                px: 4,
                py: 1.25,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.35)}`,
                '&:hover': {
                  boxShadow: `0 12px 32px ${alpha(theme.palette.success.main, 0.45)}`,
                  background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                },
              }}
            >
              {processingId ? 'Onaylanıyor...' : 'Onayla ve Kaydet'}
            </Button>
          </DialogActions>
        </Dialog>
      ) : (
        <ConfirmDialog
          open={confirmDialog.open}
          onClose={handleCloseConfirmDialog}
          onConfirm={handleConfirm}
          title="Başvuruyu Reddet"
          message="Bu başvuruyu reddetmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          confirmText="Reddet"
          cancelText="İptal"
          variant="error"
          loading={!!processingId && processingId === confirmDialog.memberId}
        />
      )}
    </Box>
  );
};

export default MembersApplicationsPage;