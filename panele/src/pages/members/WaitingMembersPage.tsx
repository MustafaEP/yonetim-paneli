// src/pages/members/WaitingMembersPage.tsx
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate } from 'react-router-dom';

import type { MemberApplicationRow, MemberStatus } from '../../types/member';
import {
  getApprovedMembers,
  rejectMember,
} from '../../api/membersApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { ActivateMemberButton } from '../../components/members/ActivateMemberButton';

const WaitingMembersPage: React.FC = () => {
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
    type: 'activate' | 'reject' | null;
    memberId: string | null;
  }>({
    open: false,
    type: null,
    memberId: null,
  });
  const [selectedMemberName, setSelectedMemberName] = useState('');

  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canApprove = hasPermission('MEMBER_APPROVE');
  const canReject = hasPermission('MEMBER_REJECT');
  const canUpdateMember = hasPermission('MEMBER_UPDATE');

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
        return 'Onaylanmış (Beklemede)';
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

  const loadWaitingMembers = async () => {
    setLoading(true);
    try {
      const data = await getApprovedMembers();
      // Backend zaten sadece APPROVED durumundaki üyeleri döndürüyor
      // Ancak ekstra güvenlik için filtreleme yapıyoruz
      const approvedOnly = Array.isArray(data) ? data.filter(m => m.status === 'APPROVED') : [];
      setRows(approvedOnly);
      console.log('[WaitingMembersPage] Loaded waiting members:', approvedOnly.length);
    } catch (e) {
      console.error('Bekleyen üyeler alınırken hata:', e);
      toast.showError('Bekleyen üyeler yüklenirken bir hata oluştu');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaitingMembers();
  }, []);

  const handleActivated = () => {
    loadWaitingMembers();
  };

  const handleEditClick = (id: string) => {
    if (!canUpdateMember) return;
    navigate(`/members/${id}/edit`);
  };

  const handleRejectClick = (id: string, memberName: string) => {
    if (!canReject) return;
    setSelectedMemberName(memberName);
    setConfirmDialog({
      open: true,
      type: 'reject',
      memberId: id,
    });
  };

  const handleConfirm = async () => {
    if (!confirmDialog.memberId || !confirmDialog.type) return;

    const id = confirmDialog.memberId;

    setProcessingId(id);
    setConfirmDialog({ open: false, type: null, memberId: null });

    try {
      if (confirmDialog.type === 'reject') {
        await rejectMember(id);
        await loadWaitingMembers();
        toast.showSuccess('Üye başarıyla reddedildi.');
      }
    } catch (e) {
      console.error('Üye işlenirken hata:', e);
      toast.showError('Üye reddedilirken bir hata oluştu.');
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
      renderCell: (params: GridRenderCellParams<MemberApplicationRow>) => {
        const statusColor = getStatusColor(params.row.status);
        
        // Safely get the color from palette with fallback
        const getShadowColor = (color: string): string => {
          const palette = theme.palette as any;
          const colorObj = palette[color];
          if (colorObj && colorObj.main) {
            return colorObj.main;
          }
          return theme.palette.grey[500];
        };
        
        const shadowColor = getShadowColor(statusColor);
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Chip
              label={getStatusLabel(params.row.status)}
              size="medium"
              color={statusColor}
              sx={{ 
                fontWeight: 700,
                fontSize: '0.8rem',
                height: '32px',
                borderRadius: 2,
                px: 1,
                boxShadow: `0 2px 8px ${alpha(shadowColor, 0.25)}`,
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 250,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<MemberApplicationRow>) => {
        const disabled = processingId === params.row.id;
        const isApproved = params.row.status === 'APPROVED';
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Tooltip title="Detayları Görüntüle" arrow placement="top">
              <IconButton
                size="medium"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/members/${params.row.id}?source=waiting`);
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
            {canUpdateMember && isApproved && (
              <Tooltip title="Bilgileri Düzenle" arrow placement="top">
                <span>
                  <IconButton
                    size="medium"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(params.row.id);
                    }}
                    sx={{
                      width: 38,
                      height: 38,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      color: theme.palette.info.main,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                        color: '#fff',
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.35)}`,
                      },
                      '&:disabled': {
                        opacity: 0.5,
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {canApprove && isApproved && (
              <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'contents' }}>
                <ActivateMemberButton
                  memberId={params.row.id}
                  memberName={`${params.row.firstName} ${params.row.lastName}`}
                  onActivated={handleActivated}
                  disabled={disabled}
                  variant="text"
                  size="small"
                  iconOnly={true}
                />
              </Box>
            )}
            {canReject && isApproved && (
              <Tooltip title="Üyeyi Reddet" arrow placement="top">
                <span>
                  <IconButton
                    size="medium"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectClick(params.row.id, `${params.row.firstName} ${params.row.lastName}`);
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
          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${alpha(theme.palette.info.main, 0.1)} 0%, transparent 70%)`,
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
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.35)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.05)',
                    boxShadow: `0 12px 32px ${alpha(theme.palette.info.main, 0.45)}`,
                  },
                }}
              >
                <HourglassEmptyIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />
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
                  Bekleyen Üyeler
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
                  Onaylanmış ve aktifleştirilmeyi bekleyen üyeleri yönetin
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Ana Kart - Filtre ve Tablo */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* Gelişmiş Filtre Bölümü */}
        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.02)} 0%, ${alpha(theme.palette.info.light, 0.01)} 100%)`,
            borderBottom: `2px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
              }}
            >
              <FilterListIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, textAlign: 'left' }}>
                Filtrele ve Ara
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', textAlign: 'left' }}>
                Bekleyen üyeleri hızlıca bulun ve filtreleyin
              </Typography>
            </Box>
          </Box>
          <Grid container spacing={2.5}>
            {/* Arama */}
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
                      boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.12)}`,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.info.main,
                        borderWidth: '2px',
                      },
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 16px ${alpha(theme.palette.info.main, 0.2)}`,
                    },
                  },
                }}
              />
            </Grid>
            {/* İl Filtresi */}
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <FormControl 
                size="medium" 
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.12)}`,
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
                  sx={{
                    '& .MuiSelect-select': {
                      fontWeight: provinceFilter !== 'ALL' ? 600 : 400,
                      color: provinceFilter !== 'ALL' ? theme.palette.info.main : 'inherit',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.info.main,
                      borderWidth: 2,
                    },
                  }}
                  MenuProps={{
                    disablePortal: false,
                    disableScrollLock: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        borderRadius: 12,
                      },
                    },
                  }}
                >
                  <MenuItem value="ALL">
                    <Typography>Tüm İller</Typography>
                  </MenuItem>
                  {uniqueProvinces.map((province) => {
                    const isSelected = provinceFilter === province.id;
                    return (
                      <MenuItem 
                        key={province.id} 
                        value={province.id}
                        sx={{
                          backgroundColor: isSelected ? alpha(theme.palette.info.main, 0.1) : 'transparent',
                          '&:hover': {
                            backgroundColor: isSelected 
                              ? alpha(theme.palette.info.main, 0.15) 
                              : alpha(theme.palette.action.hover, 0.05),
                          },
                        }}
                      >
                        <Typography 
                          sx={{ 
                            fontWeight: isSelected ? 700 : 400,
                            color: isSelected ? theme.palette.info.main : 'inherit',
                          }}
                        >
                          {province.name}
                        </Typography>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            {/* Başvuruyu Yapan */}
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <FormControl 
                size="medium" 
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.12)}`,
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
                  sx={{
                    '& .MuiSelect-select': {
                      fontWeight: createdByFilter !== 'ALL' ? 600 : 400,
                      color: createdByFilter !== 'ALL' ? theme.palette.info.main : 'inherit',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.info.main,
                      borderWidth: 2,
                    },
                  }}
                  MenuProps={{
                    disablePortal: false,
                    disableScrollLock: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        borderRadius: 12,
                      },
                    },
                  }}
                >
                  <MenuItem value="ALL">
                    <Typography>Tüm Kullanıcılar</Typography>
                  </MenuItem>
                  {uniqueCreatedBy.map((user) => {
                    const isSelected = createdByFilter === user.id;
                    return (
                      <MenuItem 
                        key={user.id} 
                        value={user.id}
                        sx={{
                          backgroundColor: isSelected ? alpha(theme.palette.info.main, 0.1) : 'transparent',
                          '&:hover': {
                            backgroundColor: isSelected 
                              ? alpha(theme.palette.info.main, 0.15) 
                              : alpha(theme.palette.action.hover, 0.05),
                          },
                        }}
                      >
                        <Box>
                          <Typography 
                            variant="body2" 
                            sx={{
                              fontWeight: isSelected ? 700 : 600,
                              color: isSelected ? theme.palette.info.main : 'inherit',
                            }}
                          >
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Seçili Filtreler */}
          {(provinceFilter !== 'ALL' || createdByFilter !== 'ALL' || searchText.trim()) && (
            <Box
              sx={{
                mt: 3,
                p: 2.5,
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.info.main,
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <FilterListIcon fontSize="small" />
                  Aktif Filtreler
                </Typography>
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    setProvinceFilter('ALL');
                    setCreatedByFilter('ALL');
                    setSearchText('');
                  }}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                    },
                  }}
                >
                  Tümünü Temizle
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {provinceFilter !== 'ALL' && (
                  <Chip
                    label={`İl: ${uniqueProvinces.find(p => p.id === provinceFilter)?.name || provinceFilter}`}
                    onDelete={() => setProvinceFilter('ALL')}
                    deleteIcon={<CloseIcon />}
                    color="info"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      height: 32,
                      '& .MuiChip-deleteIcon': {
                        fontSize: '1.1rem',
                      },
                    }}
                  />
                )}
                {createdByFilter !== 'ALL' && (
                  <Chip
                    label={`Başvuruyu Yapan: ${uniqueCreatedBy.find(u => u.id === createdByFilter)?.firstName} ${uniqueCreatedBy.find(u => u.id === createdByFilter)?.lastName}`}
                    onDelete={() => setCreatedByFilter('ALL')}
                    deleteIcon={<CloseIcon />}
                    color="info"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      height: 32,
                      '& .MuiChip-deleteIcon': {
                        fontSize: '1.1rem',
                      },
                    }}
                  />
                )}
                {searchText.trim() && (
                  <Chip
                    label={`Arama: "${searchText}"`}
                    onDelete={() => setSearchText('')}
                    deleteIcon={<CloseIcon />}
                    color="info"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      height: 32,
                      '& .MuiChip-deleteIcon': {
                        fontSize: '1.1rem',
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

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
                <PeopleIcon fontSize="small" />
                {filteredRows.length} üye listeleniyor
                {filteredRows.length !== rows.length && ` (Toplam ${rows.length} üyeden)`}
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
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.light, 0.03)} 100%)`,
                borderBottom: `2px solid ${alpha(theme.palette.info.main, 0.12)}`,
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
                  backgroundColor: alpha(theme.palette.info.main, 0.03),
                  boxShadow: `inset 4px 0 0 ${theme.palette.info.main}`,
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
              noRowsLabel: 'Bekleyen üye bulunamadı',
            }}
            slotProps={{
              pagination: {
                labelRowsPerPage: 'Sayfa başına satır:',
              },
            }}
          />
          </Box>
        </Box>
      </Card>

      {/* Aktifleştirme ve Reddetme Dialog'ları */}
      {confirmDialog.type === 'reject' && (
        <Dialog
          open={confirmDialog.open}
          onClose={handleCloseConfirmDialog}
          maxWidth="sm"
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
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.02)} 0%, ${alpha(theme.palette.error.light, 0.01)} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.35)}`,
                }}
              >
                <CloseIcon sx={{ fontSize: '2rem', color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
                  Üyeyi Reddet
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Bu işlem geri alınamaz
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
                mb: 2, 
                lineHeight: 1.7,
                fontSize: '0.95rem',
              }}
            >
              <strong>{selectedMemberName}</strong> isimli üyeyi reddetmek istediğinize emin misiniz?
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.error.main,
                fontWeight: 600,
                p: 2,
                borderRadius: 2,
                background: alpha(theme.palette.error.main, 0.1),
              }}
            >
              ⚠️ Bu işlem geri alınamaz ve üye bilgileri kalıcı olarak reddedilmiş duruma geçecektir.
            </Typography>
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
              disabled={!!processingId}
              variant="contained"
              size="large"
              color="error"
              startIcon={processingId ? <CircularProgress size={20} color="inherit" /> : <CloseIcon />}
              sx={{
                borderRadius: 2.5,
                px: 4,
                py: 1.25,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.35)}`,
                '&:hover': {
                  boxShadow: `0 12px 32px ${alpha(theme.palette.error.main, 0.45)}`,
                  background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
                },
              }}
            >
              {processingId ? 'Reddediliyor...' : 'Evet, Reddet'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default WaitingMembersPage;

