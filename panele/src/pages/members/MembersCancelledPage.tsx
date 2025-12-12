// src/pages/members/MembersCancelledPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  InputAdornment,
  Stack,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import BlockIcon from '@mui/icons-material/Block';

import type { MemberListItem } from '../../types/member';
import { getCancelledMembers } from '../../api/membersApi';
import { useAuth } from '../../context/AuthContext';

const MembersCancelledPage: React.FC = () => {
  const theme = useTheme();
  const [rows, setRows] = useState<MemberListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canViewMembers = hasPermission('MEMBER_LIST');

  // Arama filtresi
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Arama filtresi
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (row) =>
          row.firstName.toLowerCase().includes(searchLower) ||
          row.lastName.toLowerCase().includes(searchLower) ||
          row.phone?.toLowerCase().includes(searchLower) ||
          row.email?.toLowerCase().includes(searchLower) ||
          row.province?.name.toLowerCase().includes(searchLower) ||
          row.district?.name.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [rows, searchText]);

  const getStatusLabel = (status: string): string => {
    switch (status) {
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
    status: string,
  ): 'success' | 'warning' | 'error' | 'default' | 'info' => {
    switch (status) {
      case 'RESIGNED':
        return 'warning';
      case 'EXPELLED':
        return 'error';
      case 'INACTIVE':
        return 'default';
      default:
        return 'info';
    }
  };

  const columns: GridColDef<MemberListItem>[] = [
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
      field: 'phone',
      headerName: 'Telefon',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row: MemberListItem) => row.phone ?? '-',
    },
    {
      field: 'email',
      headerName: 'E-posta',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (_value, row: MemberListItem) => row.email ?? '-',
    },
    {
      field: 'status',
      headerName: 'Durum',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams<MemberListItem>) => (
        <Chip
          label={getStatusLabel(params.row.status)}
          color={getStatusColor(params.row.status)}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 1,
      minWidth: 100,
      valueGetter: (_value, row: MemberListItem) => row.province?.name ?? '-',
    },
    {
      field: 'district',
      headerName: 'İlçe',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row: MemberListItem) => row.district?.name ?? '-',
    },
    {
      field: 'cancelledBy',
      headerName: 'İptal Eden',
      flex: 1.2,
      minWidth: 150,
      valueGetter: (_value, row: MemberListItem) => {
        if (row.cancelledBy) {
          return `${row.cancelledBy.firstName} ${row.cancelledBy.lastName}`;
        }
        return '-';
      },
      renderCell: (params: GridRenderCellParams<MemberListItem>) => {
        const cancelledBy = params.row.cancelledBy;
        if (!cancelledBy) {
          return <Typography variant="body2">-</Typography>;
        }
        return (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {cancelledBy.firstName} {cancelledBy.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {cancelledBy.email}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<MemberListItem>) => (
        <Tooltip title="Detayları Görüntüle">
          <IconButton
            size="small"
            onClick={() => navigate(`/members/${params.row.id}`)}
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  useEffect(() => {
    const loadMembers = async () => {
      if (!canViewMembers) {
        setError('Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getCancelledMembers();
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error('İptal edilen üyeler alınırken hata:', e);
        setError(e?.response?.data?.message || 'İptal edilen üyeler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [canViewMembers]);

  if (!canViewMembers) {
    return (
      <Box>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem' },
            mb: 1,
            background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.warning.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          İptal Edilen Üyeler
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Üyeliği iptal edilmiş (İstifa, İhraç, Pasif) üyelerin listesi
        </Typography>
      </Box>

      {/* Arama */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ad, soyad, telefon, e-posta veya bölge ile ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchText && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchText('')}
                    sx={{ color: 'text.secondary' }}
                  >
                    <FilterListIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Box>
      </Card>

      {/* Hata Mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* DataGrid */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                fontWeight: 600,
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              },
            }}
          />
        </Box>
      </Card>

      {/* Boş Durum */}
      {!loading && filteredRows.length === 0 && !error && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            mt: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
          }}
        >
          <BlockIcon sx={{ fontSize: 64, color: 'info.main', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchText ? 'Arama sonucu bulunamadı' : 'İptal edilen üye bulunmamaktadır'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchText
              ? 'Farklı bir arama terimi deneyin'
              : 'Henüz üyeliği iptal edilmiş üye kaydı bulunmamaktadır'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MembersCancelledPage;

