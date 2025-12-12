// src/pages/members/MembersRejectedPage.tsx
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
import CancelIcon from '@mui/icons-material/Cancel';

import type { MemberListItem } from '../../types/member';
import { getRejectedMembers } from '../../api/membersApi';
import { useAuth } from '../../context/AuthContext';

const MembersRejectedPage: React.FC = () => {
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
          row.province?.name.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [rows, searchText]);

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
      field: 'province',
      headerName: 'İl',
      flex: 1,
      minWidth: 100,
      valueGetter: (_value, row: MemberListItem) => row.province?.name ?? '-',
    },
    {
      field: 'createdAt',
      headerName: 'Başvuru Tarihi',
      width: 150,
      valueGetter: (_value, row: MemberListItem) => row.createdAt,
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
      field: 'approvedBy',
      headerName: 'Reddeden',
      flex: 1.2,
      minWidth: 150,
      valueGetter: (_value, row: MemberListItem) => {
        if (row.approvedBy) {
          return `${row.approvedBy.firstName} ${row.approvedBy.lastName}`;
        }
        return '-';
      },
      renderCell: (params: GridRenderCellParams<MemberListItem>) => {
        const approvedBy = params.row.approvedBy;
        if (!approvedBy) {
          return <Typography variant="body2">-</Typography>;
        }
        return (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {approvedBy.firstName} {approvedBy.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {approvedBy.email}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Durum',
      width: 120,
      renderCell: () => (
        <Chip
          label="Reddedildi"
          size="small"
          color="error"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<MemberListItem>) => (
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
      ),
    },
  ];

  useEffect(() => {
    const fetchMembers = async () => {
      if (!canViewMembers) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const data = await getRejectedMembers();
        setRows(data);
      } catch (error: any) {
        console.error('Reddedilen üyeler alınırken hata:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Reddedilen üyeler alınırken bir hata oluştu';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [canViewMembers]);

  if (!canViewMembers) {
    return (
      <Box>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <CancelIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Yetkisiz İşlem
          </Typography>
          <Typography color="text.secondary">
            Reddedilen üyeleri görüntülemek için gerekli izne sahip değilsiniz.
          </Typography>
        </Paper>
      </Box>
    );
  }

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
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.error.main, 0.3)}`,
            }}
          >
            <CancelIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
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
              Reddedilen Üyeler
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Reddedilen üye başvurularını görüntüleyin
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Hata Mesajı */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

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
            backgroundColor: alpha(theme.palette.error.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.error.main, 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FilterListIcon sx={{ fontSize: '1.1rem', color: theme.palette.error.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Arama
            </Typography>
          </Box>
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
                    borderColor: theme.palette.error.main,
                  },
                },
              },
            }}
          />
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
                backgroundColor: alpha(theme.palette.error.main, 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.error.main,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CancelIcon fontSize="small" />
                Toplam {filteredRows.length} reddedilen üye bulundu
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
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CancelIcon sx={{ fontSize: '1.1rem', color: theme.palette.error.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Reddedilen Üye Listesi
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
                backgroundColor: alpha(theme.palette.error.main, 0.04),
                borderBottom: `2px solid ${alpha(theme.palette.error.main, 0.1)}`,
                borderRadius: 0,
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.02),
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
    </Box>
  );
};

export default MembersRejectedPage;

