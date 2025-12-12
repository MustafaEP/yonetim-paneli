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
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
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

const MembersApplicationsPage: React.FC = () => {
  const theme = useTheme();
  const [rows, setRows] = useState<MemberApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | null;
    memberId: string | null;
  }>({
    open: false,
    type: null,
    memberId: null,
  });

  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canApprove = hasPermission('MEMBER_APPROVE');
  const canReject = hasPermission('MEMBER_REJECT');

  const filteredRows = useMemo(() => {
    let filtered = rows;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (row) =>
          row.firstName.toLowerCase().includes(searchLower) ||
          row.lastName.toLowerCase().includes(searchLower) ||
          row.province?.name.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [rows, statusFilter, searchText]);

  const getStatusLabel = (status: MemberStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'Onay Bekliyor';
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

  const handleApproveClick = (id: string) => {
    if (!canApprove) return;
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
    setProcessingId(id);
    setConfirmDialog({ open: false, type: null, memberId: null });

    try {
      if (confirmDialog.type === 'approve') {
        await approveMember(id);
        await loadApplications();
        toast.showSuccess('Başvuru başarıyla onaylandı.');
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
    },
    {
      field: 'lastName',
      headerName: 'Soyad',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 1,
      minWidth: 100,
      valueGetter: (_value, row: MemberApplicationRow) => row.province?.name ?? '-',
    },
    {
      field: 'createdBy',
      headerName: 'Başvuruyu Yapan',
      flex: 1.2,
      minWidth: 150,
      valueGetter: (_value, row: MemberApplicationRow) => {
        if (row.createdBy) {
          return `${row.createdBy.firstName} ${row.createdBy.lastName}`;
        }
        return '-';
      },
      renderCell: (params: GridRenderCellParams<MemberApplicationRow>) => {
        const createdBy = params.row.createdBy;
        if (!createdBy) {
          return <Typography variant="body2">-</Typography>;
        }
        return (
          <Box>
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
      width: 140,
      renderCell: (params: GridRenderCellParams<MemberApplicationRow>) => (
        <Chip
          label={getStatusLabel(params.row.status)}
          size="small"
          color={getStatusColor(params.row.status)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<MemberApplicationRow>) => {
        const disabled = processingId === params.row.id;
        const isPending = params.row.status === 'PENDING';
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Detay">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/members/${params.row.id}`);
                }}
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canApprove && isPending && (
              <Tooltip title="Onayla">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApproveClick(params.row.id);
                    }}
                    sx={{
                      color: theme.palette.success.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.success.main, 0.08),
                      },
                    }}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {canReject && isPending && (
              <Tooltip title="Reddet">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectClick(params.row.id);
                    }}
                    sx={{
                      color: theme.palette.error.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.08),
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
    <Box>
      {/* Başlık Bölümü */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.warning.main, 0.3)}`,
            }}
          >
            <AssignmentIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Üye Başvuruları
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Üye başvurularını görüntüleyin, onaylayın veya reddedin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/members/applications/new')}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
              },
            }}
          >
            Yeni Başvuru
          </Button>
        </Box>

        {/* Mobile Button */}
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          fullWidth
          onClick={() => navigate('/members/applications/new')}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            mt: 2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            py: 1.5,
            boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          Yeni Başvuru Oluştur
        </Button>
      </Box>

      {/* Ana Kart */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Filtre Bölümü */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: alpha(theme.palette.warning.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.warning.main, 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FilterListIcon sx={{ fontSize: '1.1rem', color: theme.palette.warning.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Arama ve Filtreleme
            </Typography>
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              placeholder="Ad, Soyad, İl..."
              size="small"
              fullWidth
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                },
              }}
            />
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '100%', sm: 220 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                },
              }}
            >
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FilterListIcon fontSize="small" />
                  Durum
                </Box>
              </InputLabel>
              <Select
                value={statusFilter}
                label="Durum"
                onChange={(e) => setStatusFilter(e.target.value as MemberStatus | 'ALL')}
              >
                <MenuItem value="ALL">Tümü</MenuItem>
                <MenuItem value="PENDING">Onay Bekliyor</MenuItem>
                <MenuItem value="ACTIVE">Aktif</MenuItem>
                <MenuItem value="REJECTED">Reddedildi</MenuItem>
                <MenuItem value="RESIGNED">İstifa</MenuItem>
                <MenuItem value="EXPELLED">İhraç</MenuItem>
                <MenuItem value="INACTIVE">Pasif</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* İçerik Bölümü */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Sonuç Sayısı */}
          {!loading && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
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
                <AssignmentIcon fontSize="small" />
                Toplam {filteredRows.length} başvuru bulundu
              </Typography>
            </Paper>
          )}

          {/* Tablo Bölümü */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AssignmentIcon sx={{ fontSize: '1.1rem', color: theme.palette.primary.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Başvuru Listesi
            </Typography>
          </Box>

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
                backgroundColor: alpha(theme.palette.warning.main, 0.04),
                borderBottom: `2px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                borderRadius: 0,
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  backgroundColor: alpha(theme.palette.warning.main, 0.02),
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
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
              sx={{
                '& .MuiDataGrid-virtualScroller': {
                  minHeight: '200px',
                },
              }}
            />
          </Box>
        </Box>
      </Card>

      {/* Onay Dialog'u */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirm}
        title={confirmDialog.type === 'approve' ? 'Başvuruyu Onayla' : 'Başvuruyu Reddet'}
        message={
          confirmDialog.type === 'approve'
            ? 'Bu başvuruyu onaylamak istediğinize emin misiniz? Onaylandıktan sonra üye aktif hale gelecektir.'
            : 'Bu başvuruyu reddetmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
        }
        confirmText={confirmDialog.type === 'approve' ? 'Onayla' : 'Reddet'}
        cancelText="İptal"
        variant={confirmDialog.type === 'approve' ? 'success' : 'error'}
        loading={!!processingId && processingId === confirmDialog.memberId}
      />
    </Box>
  );
};

export default MembersApplicationsPage;